'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const VPC_INDEX_URL = 'https://data.geopf.fr/chunk/telechargement/download/lidarhd_fxx_ept/vpc-128/index.vpc';
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

type VpcFeature = {
  id: string;
  geometry: {
    coordinates: number[][][];
  };
  properties: {
    'pc:count': number;
    'proj:bbox': [number, number, number, number, number, number];
  };
  assets: {
    data: {
      href: string;
    };
  };
};

type VpcCollection = {
  features: VpcFeature[];
};

const numberFormatter = new Intl.NumberFormat('en-US');

const getFeatureBounds = (feature: VpcFeature) => {
  const vertices = feature.geometry.coordinates[0] ?? [];
  const longitudes = vertices.map(vertex => vertex[0] ?? 0);
  const latitudes = vertices.map(vertex => vertex[1] ?? 0);

  return {
    minLongitude: Math.min(...longitudes),
    maxLongitude: Math.max(...longitudes),
    minLatitude: Math.min(...latitudes),
    maxLatitude: Math.max(...latitudes),
  };
};

const formatPointCount = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  return numberFormatter.format(value);
};

const isInsideFranceBounds = (latitude: number, longitude: number) => (
  latitude >= 41 && latitude <= 52 && longitude >= -6 && longitude <= 10
);

const buildViewerSrc = (feature: VpcFeature, latitude: number, longitude: number) => {
  const [minX, minY, minZ, maxX, maxY, maxZ] = feature.properties['proj:bbox'];
  const params = new URLSearchParams({
    dataset: feature.assets.data.href,
    name: feature.id,
    latitude: `${latitude}`,
    longitude: `${longitude}`,
    minX: `${minX}`,
    minY: `${minY}`,
    minZ: `${minZ}`,
    maxX: `${maxX}`,
    maxY: `${maxY}`,
    maxZ: `${maxZ}`,
  });

  return `/ign-ept-viewer.html?${params.toString()}`;
};

export default function PointCloudViewer() {
  const [catalog, setCatalog] = useState<VpcFeature[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [latitudeInput, setLatitudeInput] = useState(`${DEFAULT_LOCATION.latitude}`);
  const [longitudeInput, setLongitudeInput] = useState(`${DEFAULT_LOCATION.longitude}`);
  const [viewerSrc, setViewerSrc] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<VpcFeature | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const loadCatalog = async () => {
      try {
        const response = await fetch(VPC_INDEX_URL, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`IGN catalog request failed with ${response.status}`);
        }

        const payload = await response.json() as VpcCollection;
        setCatalog(payload.features ?? []);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setCatalogError(
          error instanceof Error
            ? error.message
            : 'Unable to load the IGN LiDAR catalog.',
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      abortController.abort();
    };
  }, []);

  const resolveLocation = useCallback((latitude: number, longitude: number) => {
    if (!isInsideFranceBounds(latitude, longitude)) {
      setSelectedFeature(null);
      setViewerSrc('');
      setSelectionError('Enter a WGS84 latitude/longitude inside metropolitan France.');
      return;
    }

    const nextFeature = catalog.find((feature) => {
      const bounds = getFeatureBounds(feature);

      return longitude >= bounds.minLongitude
        && longitude <= bounds.maxLongitude
        && latitude >= bounds.minLatitude
        && latitude <= bounds.maxLatitude;
    });

    if (!nextFeature) {
      setSelectedFeature(null);
      setViewerSrc('');
      setSelectionError('No streamed LiDAR region was found for that coordinate yet. Coverage depends on IGN publication status.');
      return;
    }

    setSelectionError(null);
    setSelectedFeature(nextFeature);
    setViewerSrc(buildViewerSrc(nextFeature, latitude, longitude));
  }, [catalog]);

  useEffect(() => {
    if (catalog.length === 0) {
      return;
    }

    resolveLocation(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
  }, [catalog, resolveLocation]);

  const handleLocate = () => {
    const latitude = Number.parseFloat(latitudeInput);
    const longitude = Number.parseFloat(longitudeInput);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setSelectedFeature(null);
      setViewerSrc('');
      setSelectionError('Latitude and longitude must both be valid decimal numbers.');
      return;
    }

    resolveLocation(latitude, longitude);
  };

  const featureSummary = useMemo(() => {
    if (!selectedFeature) {
      return null;
    }

    const [minX, minY, minZ, maxX, maxY, maxZ] = selectedFeature.properties['proj:bbox'];

    return {
      pointCount: formatPointCount(selectedFeature.properties['pc:count']),
      extent: `${numberFormatter.format(Math.round(maxX - minX))}m x ${numberFormatter.format(Math.round(maxY - minY))}m`,
      elevation: `${Math.round(minZ)}m to ${Math.round(maxZ)}m`,
    };
  }, [selectedFeature]);

  return (
    <section className="mx-auto my-12 w-full max-w-6xl px-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">IGN LiDAR HD</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Actual streamed point clouds for a France location</h2>
          <p className="mt-2 text-sm text-slate-300">
            This replaces the raster DEM mock with IGN&apos;s published LiDAR HD catalog. Enter WGS84 coordinates and the viewer resolves the matching EPT region, then streams points directly in the browser.
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
                setLatitudeInput(`${location.latitude}`);
                setLongitudeInput(`${location.longitude}`);
                resolveLocation(location.latitude, location.longitude);
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
            {selectedFeature ? `Streaming ${selectedFeature.id}` : 'Streaming catalog lookup'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Serverless path: IGN VPC catalog to EPT manifest to Potree browser renderer. This keeps the compute cost on static hosting and only streams octree nodes near the active camera.
          </p>
          {featureSummary && (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
              <span className="rounded-full border border-slate-700 px-2 py-1">
                {featureSummary.pointCount}
                points
              </span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{featureSummary.extent}</span>
              <span className="rounded-full border border-slate-700 px-2 py-1">{featureSummary.elevation}</span>
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
            The old component decoded one public elevation PNG and built a terrain mesh. The new flow resolves a real IGN LiDAR region and renders its published point cloud hierarchy instead.
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
            This is an actual point cloud, not a reconstructed mesh. Production-grade surface reconstruction still needs an offline pipeline from COPC/LAZ into a mesh or 3D Tiles derivative.
          </p>
        </div>
      </div>
    </section>
  );
}
