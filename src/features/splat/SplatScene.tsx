'use client';

// src/features/splat/SplatScene.tsx
// A Spark (World Labs) Gaussian-splat viewport. The Lyra worlds are
// single-viewpoint "world extensions", so the camera starts *inside* the scene at
// the seed-camera pose (origin, looking along `cameraForward`) rather than orbiting
// from outside — from outside the reconstruction reads as a fan of needles.

import { SparkRenderer, SplatFileType, SplatMesh } from '@sparkjsdev/spark';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import type { SplatSceneMeta } from './registry';

export type SplatLoadState = 'loading' | 'ready' | 'error';

export type SplatSceneStatus = {
  state: SplatLoadState;
  progress: number;
  error?: string;
};

export function SplatScene({
  scene,
  className,
  interactive = true,
  onStatus,
}: {
  scene: SplatSceneMeta;
  className?: string;
  interactive?: boolean;
  onStatus?: (s: SplatSceneStatus) => void;
}) {
  const host = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<SplatSceneStatus>({ state: 'loading', progress: 0 });

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  useEffect(() => {
    const el = host.current;
    if (!el) {
      return;
    }
    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    el.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30000);
    const [ox, oy, oz] = scene.cameraOrigin;
    const [fx, fy, fz] = scene.cameraForward;
    camera.position.set(ox, oy, oz);
    const look = new THREE.Vector3(ox + fx * 80, oy + fy * 80, oz + fz * 80);
    camera.lookAt(look);

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const three = new THREE.Scene();
    three.add(new SparkRenderer({ renderer }));

    let controls: OrbitControls | null = null;
    if (interactive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(look);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.5;
      controls.maxDistance = 6000;
      controls.update();
    }

    const mesh = new SplatMesh({
      url: scene.url,
      // Niantic SPZ: Spark's native compressed format. (SOG v2 from SplatTransform
      // is rejected — Spark's `pcsogs` reader expects the older v1 schema.)
      fileType: SplatFileType.SPZ,
      onProgress: (e: ProgressEvent) => {
        if (e.total) {
          setStatus({ state: 'loading', progress: Math.min(1, e.loaded / e.total) });
        }
      },
    });
    if (scene.scale !== 1) {
      mesh.scale.setScalar(scene.scale);
    }
    three.add(mesh);

    const w = window as unknown as { __SPLAT__?: unknown };
    mesh.initialized
      .then(() => {
        if (disposed) {
          return;
        }
        setStatus({ state: 'ready', progress: 1 });
        w.__SPLAT__ = { state: 'ready', id: scene.id, gaussians: scene.gaussians };
      })
      .catch((e: unknown) => {
        if (disposed) {
          return;
        }
        const message = e instanceof Error ? e.message : String(e);
        setStatus({ state: 'error', progress: 0, error: message });
        w.__SPLAT__ = { state: 'error', id: scene.id, error: message };
      });

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls?.update();
      renderer.render(three, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      w.__SPLAT__ = { state: 'disposed', id: scene.id };
    };
  }, [scene, interactive]);

  return (
    <div className={className} ref={host}>
      {status.state !== 'ready'
        ? (
            <div className="splat-status" data-state={status.state}>
              {status.state === 'error'
                ? `scene failed: ${status.error}`
                : `loading Gaussians ${(status.progress * 100).toFixed(0)}%`}
            </div>
          )
        : null}
    </div>
  );
}
