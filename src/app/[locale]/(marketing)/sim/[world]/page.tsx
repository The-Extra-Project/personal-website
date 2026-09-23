'use client';

// src/app/[locale]/(marketing)/sim/[world]/page.tsx
// Immersive first-person view of a single Lyra Gaussian-splat world, rendered
// with Spark on its own canvas, with a small OpenStreetMap inset locating it.

import '@/features/splat/splat.css';

import mapboxgl from 'mapbox-gl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { OSM_STYLE } from '@/features/sim/lyraWorlds';
import { formatBytes, loadScenes, type SplatSceneMeta } from '@/features/splat/registry';
import { SplatScene, type SplatSceneStatus } from '@/features/splat/SplatScene';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export default function ImmersiveScenePage() {
  const params = useParams<{ world: string | string[] }>();
  const world = Array.isArray(params?.world) ? params.world[0] : params?.world;
  const [scenes, setScenes] = useState<SplatSceneMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SplatSceneStatus>({ state: 'loading', progress: 0 });
  const insetEl = useRef<HTMLDivElement | null>(null);
  const insetMap = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    loadScenes().then(setScenes).catch(e => setError(String(e)));
  }, []);

  const scene = useMemo(() => scenes.find(s => s.id === world), [scenes, world]);

  useEffect(() => {
    if (!scene || !insetEl.current || insetMap.current) {
      return;
    }
    const m = new mapboxgl.Map({
      container: insetEl.current,
      style: OSM_STYLE,
      center: [scene.lng, scene.lat],
      zoom: 15.5,
      pitch: 52,
      bearing: scene.yaw,
      interactive: false,
      attributionControl: false,
    });
    m.on('load', () => {
      m.addSource('anchor', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [scene.lng, scene.lat] } },
      });
      m.addLayer({
        id: 'anchor',
        type: 'circle',
        source: 'anchor',
        paint: { 'circle-radius': 6, 'circle-color': '#2ecc71', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 },
      });
    });
    insetMap.current = m;
    return () => {
      m.remove();
      insetMap.current = null;
    };
  }, [scene]);

  if (error) {
    return (
      <div className="splat-full">
        <div className="splat-status" data-state="error">
          registry error:
          {error}
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="splat-full">
        <div className="splat-hud">
          <Link className="splat-back" href="/sim">
            ← map
          </Link>
          <h1>
            {scenes.length === 0 ? 'loading scenes…' : `no scene "${world}"`}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="splat-full">
      <SplatScene className="splat-canvas" scene={scene} onStatus={setStatus} />

      <div className="splat-hud">
        <Link className="splat-back" href="/sim">
          ← map
        </Link>
        <div>
          <h1>{scene.label}</h1>
          <p className="splat-sub">
            {scene.source}
            {' '}
            · Lyra 2.0 world model · GPU ETL (morton → clip → SPZ v3)
          </p>
        </div>
      </div>

      <aside className="splat-panel">
        <dl>
          <dt>state</dt>
          <dd>{status.state}</dd>
          <dt>gaussians</dt>
          <dd>{scene.gaussians.toLocaleString()}</dd>
          <dt>SOG</dt>
          <dd>{formatBytes(scene.sogBytes)}</dd>
          {scene.fillRatio !== undefined
            ? (
                <>
                  <dt>fill ratio</dt>
                  <dd>{scene.fillRatio.toFixed(0)}</dd>
                </>
              )
            : null}
          <dt>anchor</dt>
          <dd>
            {scene.lat.toFixed(5)}
            ,
            {scene.lng.toFixed(5)}
          </dd>
          <dt>heading</dt>
          <dd>
            {scene.yaw}
            °
          </dd>
          <dt>elevation</dt>
          <dd>
            {scene.elevation}
            {' '}
            m
          </dd>
          <dt>source</dt>
          <dd>{scene.source}</dd>
        </dl>
        <p className="splat-provenance">
          Reoriented to Y-up ENU from the seed camera in
          {' '}
          <code>cameras.npz</code>
          , so this view starts where the capture drone started.
        </p>
      </aside>

      <div className="splat-inset" ref={insetEl} />
      <div className="splat-hint">drag to look around · scroll to move along the view</div>
    </div>
  );
}
