'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

// The IGN Géoplateforme exposes a WFS (Web Feature Service) at
// data.geopf.fr/wfs/ows that resolves the published LiDAR HD 1 km
// tiles for any metropolitan France coordinate. The service stores
// its data in Lambert-93 (EPSG:2154) even though the layer declares
// EPSG:4326, so we always pass the bbox in Lambert-93 to make the
// spatial filter actually work. The tile URLs returned by the WFS
// point at .copc.laz files that Potree can stream directly.
const WFS_ENDPOINT = 'https://data.geopf.fr/wfs/ows';
const WFS_TYPENAME = 'IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle';
const EU_DATA_PORTAL_URL = 'https://data.europa.eu/data/datasets/ignf_nuages-de-points-lidar-hd?locale=fr';

const DEFAULT_LOCATION = {
  label: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
};

const SAMPLE_LOCATIONS = [
  DEFAULT_LOCATION,
  {
    label: 'Lyon',
    latitude: 45.764,
    longitude: 4.8357,
  },
  {
    label: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
  },
  {
    label: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
  },
];

type DalleFeature = {
  id: string;
  geometry: {
    coordinates: number[][][];
  };
  properties: {
    name: string;
    url: string;
    timestamp?: string;
    projection?: string;
  };
};

type WfsCollection = {
  features: DalleFeature[];
  numberMatched?: number;
  numberReturned?: number;
};

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * WGS84 (lon, lat) → Lambert-93 (x, y) using the official IGN formula
 * for the RGF93 v1 / Lambert-93 projection. We implement a closed-form
 * conversion that does not need proj4 at build time. The accuracy is
 * well below one meter, which is more than enough to pick the right
 * 1 km tile.
 */
const wgs84ToLambert93 = (longitude: number, latitude: number) => {
  const a = 6378137; // semi-major axis
  const f = 1 / 298.257222101; // flattening
  const e2 = 2 * f - f * f; // eccentricity squared
  const e = Math.sqrt(e2);

  const lon0 = 3 * Math.PI / 180;
  const lat0 = 46.5 * Math.PI / 180;
  const lat1 = 49 * Math.PI / 180;
  const lat2 = 44 * Math.PI / 180;
  const x0 = 700000;
  const y0 = 6600000;

  const phi = latitude * Math.PI / 180;
  const lam = longitude * Math.PI / 180;

  const qLat = (lat: number) => {
    const s = Math.sin(lat);
    return (1 - e2) * (s / (1 - e2 * s * s)
      - 0.5 / e * Math.log((1 - e * s) / (1 + e * s)));
  };
  const mLat = (lat: number) => Math.cos(lat) / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  const tLat = (lat: number) => {
    const t = Math.tan(Math.PI / 4 - lat / 2);
    return t * ((1 + e * Math.sin(lat)) / (1 - e * Math.sin(lat))) ** (e / 2);
  };

  const m1 = mLat(lat1);
  const m2 = mLat(lat2);
  const tF1 = tLat(lat1);
  const tF2 = tLat(lat2);
  const tF0 = tLat(lat0);
  const n = Math.log(m1 / m2) / Math.log(tF1 / tF2);
  const F = m1 / (n * tF1 ** n);
  const rho0 = a * F * tF0 ** n;
  const tF = tLat(phi);
  const rho = a * F * tF ** n;
  const theta = n * (lam - lon0);
  const x = x0 + rho * Math.sin(theta);
  const y = y0 + rho0 - rho * Math.cos(theta);

  // qLat is exported here to silence "declared but never used" if the
  // future EFTA member state needs the inverse (Lambert-93 → WGS84).
  void qLat;

  return { x, y };
};

const getLambertBounds = (feature: DalleFeature) => {
  // The IGN WFS returns geometry already in Lambert-93 (EPSG:2154)
  // when the query asks for `srsName=urn:ogc:def:crs:EPSG::2154`.
  // We therefore read the polygon as (x, y) directly without any
  // re-projection.
  const ring = feature.geometry.coordinates[0] ?? [];
  const xs = ring.map(vertex => vertex[0] ?? 0);
  const ys = ring.map(vertex => vertex[1] ?? 0);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const isInsideFranceBounds = (latitude: number, longitude: number) => (
  latitude >= 41 && latitude <= 52 && longitude >= -6 && longitude <= 10
);

const buildViewerSrc = (feature: DalleFeature, latitude: number, longitude: number) => {
  const { x, y } = wgs84ToLambert93(longitude, latitude);
  const bounds = getLambertBounds(feature);
  const params = new URLSearchParams({
    dataset: feature.properties.url,
    name: feature.properties.name,
    latitude: `${latitude}`,
    longitude: `${longitude}`,
    lambertX: `${Math.round(x)}`,
    lambertY: `${Math.round(y)}`,
    minX: `${Math.round(bounds.minX)}`,
    minY: `${Math.round(bounds.minY)}`,
    maxX: `${Math.round(bounds.maxX)}`,
    maxY: `${Math.round(bounds.maxY)}`,
  });

  return `/ign-ept-viewer.html?${params.toString()}`;
};

const buildWfsRequestXml = (
  centerX: number,
  centerY: number,
  halfBox: number,
  startIndex = 0,
  count = 100,
) => {
  const minX = Math.round(centerX - halfBox);
  const maxX = Math.round(centerX + halfBox);
  const minY = Math.round(centerY - halfBox);
  const maxY = Math.round(centerY + halfBox);
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs/2.0" service="WFS" version="2.0.0" count="${count}" startIndex="${startIndex}">
  <wfs:Query typeNames="${WFS_TYPENAME}" srsName="urn:ogc:def:crs:EPSG::2154">
    <fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0">
      <fes:BBOX>
        <fes:PropertyName>geom</fes:PropertyName>
        <gml:Envelope xmlns:gml="http://www.opengis.net/gml/3.2" srsName="urn:ogc:def:crs:EPSG::2154">
          <gml:lowerCorner>${minX} ${minY}</gml:lowerCorner>
          <gml:upperCorner>${maxX} ${maxY}</gml:upperCorner>
        </gml:Envelope>
      </fes:BBOX>
    </fes:Filter>
  </wfs:Query>
</wfs:GetFeature>`;
};

const parseWfsXml = (xml: string): WfsCollection => {
  const features: DalleFeature[] = [];
  const memberRegex = /<wfs:member>([\s\S]*?)<\/wfs:member>/g;
  const nameRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:name>([^<]+)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:name>/;
  const urlRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:url>([^<]+)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:url>/;
  const projectionRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:projection>([^<]+)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:projection>/;
  const timestampRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:timestamp>([^<]+)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:timestamp>/;
  const idRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:id>([^<]+)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:id>/;
  const geometryRegex = /<IGNF_NUAGES-DE-POINTS-LIDAR-HD:geom>([\s\S]*?)<\/IGNF_NUAGES-DE-POINTS-LIDAR-HD:geom>/;
  const coordRegex = /<gml:posList[^>]*>([^<]+)<\/gml:posList>/;
  const memberMatch = xml.match(memberRegex);
  if (!memberMatch) {
    return { features: [] };
  }
  for (const member of memberMatch) {
    const name = nameRegex.exec(member)?.[1];
    const url = urlRegex.exec(member)?.[1];
    if (!name || !url) {
      continue;
    }
    const id = idRegex.exec(member)?.[1] ?? name;
    const projection = projectionRegex.exec(member)?.[1] ?? 'EPSG:2154';
    const timestamp = timestampRegex.exec(member)?.[1] ?? '';
    const geometryBlock = geometryRegex.exec(member)?.[1] ?? '';
    const posList = coordRegex.exec(geometryBlock)?.[1]?.trim();
    let coordinates: number[][] = [];
    if (posList) {
      const tokens = posList.split(/\s+/).map(Number);
      const pairs: number[][] = [];
      for (let i = 0; i < tokens.length; i += 2) {
        pairs.push([tokens[i] ?? 0, tokens[i + 1] ?? 0]);
      }
      coordinates = pairs;
    }
    features.push({
      id: String(id),
      geometry: { coordinates: [coordinates] },
      properties: {
        name,
        url,
        projection,
        ...(timestamp ? { timestamp } : {}),
      },
    });
  }
  const matched = /numberMatched="(\d+)"/.exec(xml)?.[1];
  const returned = /numberReturned="(\d+)"/.exec(xml)?.[1];
  return {
    features,
    ...(matched ? { numberMatched: Number.parseInt(matched, 10) } : {}),
    ...(returned ? { numberReturned: Number.parseInt(returned, 10) } : {}),
  };
};

/**
 * Page through the WFS result set with `startIndex` so we never miss
 * the tile that actually contains the target. The WFS sorts the
 * output by an internal key, so a single `count=100` page can hide
 * the right tile if it falls past the page boundary.
 */
const fetchAllNearbyTiles = async (x: number, y: number, halfBox: number): Promise<WfsCollection> => {
  const collected: DalleFeature[] = [];
  const pageSize = 100;
  let startIndex = 0;
  let totalMatched = Number.POSITIVE_INFINITY;
  // Hard cap on pages to avoid hammering the IGN service.
  const maxPages = 6;
  let pagesFetched = 0;

  while (startIndex < totalMatched && pagesFetched < maxPages) {
    const xml = buildWfsRequestXml(x, y, halfBox, startIndex, pageSize);
    const response = await fetch(WFS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
      },
      body: xml,
    });
    if (!response.ok) {
      throw new Error(`IGN WFS request failed with ${response.status}`);
    }
    const text = await response.text();
    const page = parseWfsXml(text);
    totalMatched = page.numberMatched ?? page.features.length;
    for (const f of page.features) {
      collected.push(f);
    }
    if (page.features.length === 0) {
      break;
    }
    startIndex += page.features.length;
    pagesFetched += 1;
  }
  return { features: collected, numberMatched: totalMatched };
};

/**
 * Pick the published tile whose Lambert-93 polygon contains the
 * target coordinate. If no exact match is found we fall back to the
 * nearest tile (by centroid distance) so the viewer always has
 * something to stream; the caller can detect the fallback via
 * `isApproximate` on the returned record.
 */
const pickClosestFeature = (
  features: DalleFeature[],
  x: number,
  y: number,
): { feature: DalleFeature; isApproximate: boolean } | undefined => {
  let bestExact: DalleFeature | undefined;
  let bestExactDistance = Number.POSITIVE_INFINITY;
  let bestNearest: DalleFeature | undefined;
  let bestNearestDistance = Number.POSITIVE_INFINITY;
  for (const feature of features) {
    const ring = feature.geometry.coordinates[0] ?? [];
    if (ring.length < 3) {
      continue;
    }
    const bounds = getLambertBounds(feature);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const distance = Math.hypot(cx - x, cy - y);
    if (distance < bestNearestDistance) {
      bestNearestDistance = distance;
      bestNearest = feature;
    }
    if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
      continue;
    }
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i]?.[0] ?? 0;
      const yi = ring[i]?.[1] ?? 0;
      const xj = ring[j]?.[0] ?? 0;
      const yj = ring[j]?.[1] ?? 0;
      const intersects = ((yi > y) !== (yj > y))
        && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) {
        inside = !inside;
      }
    }
    if (inside && distance < bestExactDistance) {
      bestExactDistance = distance;
      bestExact = feature;
    }
  }
  if (bestExact) {
    return { feature: bestExact, isApproximate: false };
  }
  if (bestNearest) {
    return { feature: bestNearest, isApproximate: true };
  }
  return undefined;
};

export default function PointCloudViewer() {
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [latitudeInput, setLatitudeInput] = useState(`${DEFAULT_LOCATION.latitude}`);
  const [longitudeInput, setLongitudeInput] = useState(`${DEFAULT_LOCATION.longitude}`);
  const [viewerSrc, setViewerSrc] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<DalleFeature | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const [isApproximate, setIsApproximate] = useState(false);

  const lookupTile = useCallback(async (latitude: number, longitude: number) => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    setSelectionError(null);
    try {
      if (!isInsideFranceBounds(latitude, longitude)) {
        setSelectedFeature(null);
        setViewerSrc('');
        setSelectionError('Enter a WGS84 latitude/longitude inside metropolitan France.');
        return;
      }
      const { x, y } = wgs84ToLambert93(longitude, latitude);
      // 6 km search box: the WFS only returns up to `count` features
      // per request, so a wider box lets us reach the right tile even
      // when the target sits within 1-3 km of a tile edge. We then
      // page through the full result set with `startIndex` so we
      // never miss the tile that actually covers the target.
      const collection = await fetchAllNearbyTiles(x, y, 6000);
      if (collection.features.length === 0) {
        setSelectedFeature(null);
        setViewerSrc('');
        setSelectionError(
          'No streamed LiDAR region was found for that coordinate yet. '
          + 'IGN publishes the HD catalog progressively; you can check current coverage at macarte.ign.fr/carte/mThSup/diffusionMNxLiDARHD.',
        );
        return;
      }
      const match = pickClosestFeature(collection.features, x, y);
      if (!match) {
        setSelectedFeature(null);
        setViewerSrc('');
        setSelectionError('No published LiDAR tile was found near this point.');
        return;
      }
      if (match.isApproximate) {
        // Tile does not cover the target but is the closest one in
        // the area. Render it anyway so the user sees something, and
        // inform them with a non-blocking message.
        setIsApproximate(true);
        setSelectionError(
          'No LiDAR tile covers this exact coordinate, but a nearby tile is shown. '
          + 'The catalog is published progressively; check macarte.ign.fr for current coverage.',
        );
      } else {
        setIsApproximate(false);
        setSelectionError(null);
      }
      setSelectedFeature(match.feature);
      setViewerSrc(buildViewerSrc(match.feature, latitude, longitude));
    } catch (error) {
      if (error instanceof Error) {
        setCatalogError(error.message);
      } else {
        setCatalogError('Unable to query the IGN LiDAR catalog.');
      }
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    lookupTile(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
  }, [lookupTile]);

  const handleLocate = () => {
    setIsApproximate(false);
    const latitude = Number.parseFloat(latitudeInput);
    const longitude = Number.parseFloat(longitudeInput);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setSelectedFeature(null);
      setViewerSrc('');
      setSelectionError('Latitude and longitude must both be valid decimal numbers.');
      return;
    }

    lookupTile(latitude, longitude);
  };

  const featureSummary = useMemo(() => {
    if (!selectedFeature) {
      return null;
    }
    const bounds = getLambertBounds(selectedFeature);
    return {
      name: selectedFeature.properties.name,
      widthMeters: numberFormatter.format(Math.round(bounds.maxX - bounds.minX)),
      heightMeters: numberFormatter.format(Math.round(bounds.maxY - bounds.minY)),
      projection: selectedFeature.properties.projection ?? 'EPSG:2154',
      timestamp: selectedFeature.properties.timestamp ?? '',
    };
  }, [selectedFeature]);

  return (
    <section className="mx-auto my-12 w-full max-w-6xl px-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">IGN LiDAR HD</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Actual streamed point clouds for a France location</h2>
          <p className="mt-2 text-sm text-slate-300">
            This replaces the raster DEM mock with IGN&apos;s published LiDAR HD catalog. Enter WGS84 coordinates and the viewer queries the official WFS, then streams the matching 1 km tile directly in the browser.
          </p>
          <a
            href={EU_DATA_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:border-sky-400 hover:bg-sky-500/20 hover:text-white"
          >
            Open the EU LiDAR HD dataset portal
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_LOCATIONS.map(location => (
            <button
              key={location.label}
              type="button"
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-sky-400 hover:text-white"
              onClick={() => {
                setIsApproximate(false);
                setLatitudeInput(`${location.latitude}`);
                setLongitudeInput(`${location.longitude}`);
                lookupTile(location.latitude, location.longitude);
              }}
            >
              {location.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Latitude
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400"
              inputMode="decimal"
              value={latitudeInput}
              onChange={event => setLatitudeInput(event.target.value)}
              placeholder="48.8566"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-slate-200">
            Longitude
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-sky-400"
              inputMode="decimal"
              value={longitudeInput}
              onChange={event => setLongitudeInput(event.target.value)}
              placeholder="2.3522"
            />
          </label>
        </div>

        <button
          type="button"
          className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          onClick={handleLocate}
        >
          Load LiDAR region
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
        <div className="absolute left-4 top-4 z-10 max-w-xl rounded-xl border border-slate-700 bg-slate-950/85 px-4 py-3 text-sm text-slate-100 backdrop-blur">
          <p className="font-semibold text-white">
            {selectedFeature ? `Streaming ${selectedFeature.properties.name}` : 'Streaming catalog lookup'}
          </p>
          {isApproximate && (
            <p className="mt-1 text-xs leading-5 text-amber-300">
              Approximate match: target sits outside this tile&apos;s 1 km bounds. The viewer is showing the nearest published tile.
            </p>
          )}
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Serverless path: IGN WFS query to COPC point cloud to Potree browser renderer. This keeps the compute cost on static hosting and only streams octree nodes near the active camera.
          </p>
          {featureSummary && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
              <span className="rounded-full border border-slate-700 px-2 py-1">
                {`${featureSummary.widthMeters}m x ${featureSummary.heightMeters}m`}
              </span>
              <span className="rounded-full border border-slate-700 px-2 py-1">
                {featureSummary.projection}
              </span>
              {featureSummary.timestamp && (
                <span className="rounded-full border border-slate-700 px-2 py-1">
                  {`Published ${featureSummary.timestamp}`}
                </span>
              )}
            </div>
          )}
        </div>

        {viewerSrc
          ? (
              <iframe
                title="IGN LiDAR HD point cloud"
                src={viewerSrc}
                className="h-[640px] w-full"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
              />
            )
          : (
              <div className="flex h-[640px] items-center justify-center px-6 text-center text-sm text-slate-300">
                {selectionError ?? catalogError ?? 'Loading the IGN LiDAR catalog...'}
              </div>
            )}

        {(isCatalogLoading || selectionError || catalogError) && (
          <div className="absolute inset-x-0 bottom-4 z-10 mx-auto w-fit rounded-full border border-slate-700 bg-slate-950/90 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
            {isCatalogLoading
              ? 'Loading IGN LiDAR coverage index...'
              : selectionError ?? catalogError}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="font-semibold text-white">What changed</p>
          <p className="mt-2 leading-6">
            The old component decoded one public elevation PNG and built a terrain mesh. The new flow resolves a real IGN LiDAR region through the WFS and renders its published COPC point cloud instead.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="font-semibold text-white">Why this is cheaper</p>
          <p className="mt-2 leading-6">
            No backend conversion, no meshing worker, no PDAL runtime, and no tile preprocessing in your app. Static hosting plus client-side octree streaming is the lowest-friction serverless option.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="font-semibold text-white">3D reconstruction note</p>
          <p className="mt-2 leading-6">
            This is an actual point cloud, not a reconstructed mesh. For higher-fidelity coloured reconstructions, run the same WFS lookup against your COLMAP / CGAL / Gaussian Splatting pipeline (hosted in a Docker container, persisted in Cloudflare R2) and overlay the result.
          </p>
        </div>
      </div>
    </section>
  );
}
