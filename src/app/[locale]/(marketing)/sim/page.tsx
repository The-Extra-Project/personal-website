'use client';

// src/app/[locale]/(marketing)/sim/page.tsx
// Locator map for the Lyra Gaussian-splat worlds. Clicking a world flies the map
// to its anchor and opens an anchored portal preview (a real Spark render from the
// seed camera pose); "immersive" opens the full-screen route.

import './styles/sim.css';
import '@/features/splat/splat.css';

import type { Layer, PickingInfo } from '@deck.gl/core';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import mapboxgl from 'mapbox-gl';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { OSM_STYLE } from '@/features/sim/lyraWorlds';
import { formatBytes, loadScenes, SPLAT_BASE_URL, type SplatSceneMeta } from '@/features/splat/registry';
import { SplatScene } from '@/features/splat/SplatScene';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

type ScenePoint = SplatSceneMeta & { position: [number, number, number] };

const anchor3d = (s: SplatSceneMeta): [number, number, number] => [s.lng, s.lat, s.elevation + 6];

const SOURCE_COLOR: Record<string, [number, number, number, number]> = {
  clip: [46, 204, 113, 150],
  panoramax: [90, 150, 255, 150],
  mapillary: [240, 170, 60, 150],
};

/** The Circuit des 25 Bosses is surveyed as five named trail sections. */
const TRAIL_SECTION_IDS = ['trail-ascent', 'roche-tortue', 'croix-lorraine', 'pano-06d14b03', 'pano-175106e9'] as const;
const TRAIL_SECTION_TOTAL = TRAIL_SECTION_IDS.length;

export default function SimPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const [scenes, setScenes] = useState<SplatSceneMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SplatSceneMeta | null>(null);

  useEffect(() => {
    loadScenes().then(setScenes).catch(e => setError(String(e)));
  }, []);

  const trailSections = useMemo(
    () => scenes.filter(s => (TRAIL_SECTION_IDS as readonly string[]).includes(s.id)).length,
    [scenes],
  );

  const select = useCallback((s: SplatSceneMeta) => {
    setSelected(s);
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [s.lng, s.lat], zoom: 17.4, pitch: 62, bearing: s.yaw, duration: 900 });
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) {
      return;
    }
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: OSM_STYLE,
      center: [2.5289, 48.378],
      zoom: 14.2,
      pitch: 58,
      bearing: -22,
      attributionControl: true,
    });
    mapRef.current = map;
    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay as unknown as mapboxgl.IControl);
    overlayRef.current = overlay;
    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || scenes.length === 0) {
      return;
    }
    const points: ScenePoint[] = scenes.map(s => ({ ...s, position: anchor3d(s) }));
    const path = scenes.map(anchor3d);

    const layers: Layer[] = [
      new PathLayer<[number, number, number]>({
        id: 'flight-path',
        data: [path],
        getPath: d => d,
        getColor: [255, 122, 0, 200],
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 2,
        jointRounded: true,
        capRounded: true,
      }),
      new ScatterplotLayer<ScenePoint>({
        id: 'scene-markers',
        data: points,
        getPosition: d => d.position,
        getRadius: 9,
        radiusUnits: 'pixels',
        radiusMinPixels: 5,
        radiusMaxPixels: 16,
        getFillColor: d => SOURCE_COLOR[d.source] ?? [200, 200, 200, 140],
        getLineColor: d => (selected?.id === d.id ? [255, 255, 255] : [255, 255, 255, 160]),
        getLineWidth: d => (selected?.id === d.id ? 3 : 1),
        lineWidthUnits: 'pixels',
        stroked: true,
        pickable: true,
      }),
      new TextLayer<ScenePoint>({
        id: 'scene-labels',
        data: points,
        getPosition: d => d.position,
        getText: d => d.id,
        getSize: 11,
        getColor: [255, 255, 255],
        getPixelOffset: [0, -16],
        billboard: false,
        fontFamily: 'monospace',
        outlineWidth: 2,
        outlineColor: [0, 0, 0],
        sizeUnits: 'pixels',
      }),
    ];

    overlay.setProps({
      layers,
      onClick: (info: PickingInfo) => {
        if (info.layer?.id === 'scene-markers' && info.object) {
          select(info.object as SplatSceneMeta);
        }
      },
    });
  }, [scenes, selected, select]);

  useEffect(() => {
    if (selected) {
      (window as unknown as { __SIM_SELECTED__?: unknown }).__SIM_SELECTED__ = selected.id;
    }
    if (scenes.length > 0) {
      (window as unknown as { __SIM_SPLATS__?: unknown }).__SIM_SPLATS__ = {
        scenes: scenes.length,
        gaussians: scenes.reduce((n, s) => n + s.gaussians, 0),
        sogBytes: scenes.reduce((n, s) => n + s.sogBytes, 0),
        selected: selected?.id ?? null,
      };
    }
  }, [scenes, selected]);

  return (
    <div className="sim-root">
      <div ref={mapContainer} className="sim-map" />
      <aside className="sim-panel">
        <h1>Circuit des 25 Bosses · spatial intelligence</h1>
        <p className="sim-sub">
          Fontainebleau sandstone, reconstructed and geo-registered — one anchor per boulder field
        </p>

        <div className="sim-progress">
          <div className="sim-progress-bar" aria-hidden>
            <span style={{ transform: `scaleX(${trailSections / TRAIL_SECTION_TOTAL})` }} />
          </div>
          <p className="sim-progress-note">
            {trailSections}
            {' '}
            of
            {' '}
            {TRAIL_SECTION_TOTAL}
            {' '}
            trail sections live ·
            {' '}
            {scenes.length}
            {' '}
            world models, GPU-optimised
          </p>
        </div>

        <details className="sim-pipeline">
          <summary>how a section is built</summary>
          <ol>
            <li>FastH3 flythrough + Panoramax / YouTube capture</li>
            <li>Lyra 2.0 → world extension (VIPE gauge-free recon)</li>
            <li>reorient COLMAP → ENU, clip, 45% decimate</li>
            <li>Morton-order prepass → SPZ v3 (viewer) + SOG (archive)</li>
            <li>publish to GCS · seed camera pose drives the first-person view</li>
          </ol>
        </details>

        {error
          ? (
              <p className="sim-err">
                registry:
                {error}
              </p>
            )
          : null}
        <ol className="sim-list">
          {scenes.map(s => (
            <li key={s.id} className={selected?.id === s.id ? 'is-selected' : undefined}>
              <button type="button" className="sim-pick" onClick={() => select(s)}>
                <div className="sim-row">
                  <span className="sim-dot" data-status="ok" />
                  <strong>{s.label}</strong>
                  <span className="sim-status">
                    {s.source}
                  </span>
                </div>
                <div className="sim-label">{s.id}</div>
                <div className="sim-meta">
                  {s.gaussians.toLocaleString()}
                  {' '}
                  gaussians ·
                  {formatBytes(s.sogBytes)}
                  {' '}
                  · elev
                  {' '}
                  {s.elevation}
                  {' '}
                  m ·
                  {' '}
                  {s.lat.toFixed(4)}
                  ,
                  {s.lng.toFixed(4)}
                </div>
              </button>
              <Link className="sim-open" href={`/sim/${s.id}`}>
                immersive →
              </Link>
            </li>
          ))}
        </ol>

        <p className="sim-foot">
          assets served from
          {' '}
          <a href={SPLAT_BASE_URL} target="_blank" rel="noreferrer">GCS</a>
          {' '}
          · SPZ v3 / SOG v2
        </p>
      </aside>

      {selected
        ? (
            <div className="sim-portal" data-testid="portal">
              <div className="sim-portal-head">
                <strong>{selected.id}</strong>
                <Link href={`/sim/${selected.id}`}>immersive →</Link>
              </div>
              <SplatScene className="sim-portal-canvas" scene={selected} />
            </div>
          )
        : null}
    </div>
  );
}
