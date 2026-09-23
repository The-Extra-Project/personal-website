// src/features/splat/registry.ts
// The catalogue of Lyra Gaussian-splat scenes published under public/drone/lyra/sog/.
// Joins the world manifest (labels, anchors) with the SOG conversion report
// (gaussian counts, byte sizes, seed-camera pose).

export type SplatSource = 'clip' | 'panoramax' | 'mapillary' | 'youtube';

/**
 * Public origin the Lyra worlds are served from.
 *
 * The splat assets are far too large to ship in the repo (and `public/**` is
 * gitignored), so the published `.spz` / SOG archives and the two registry
 * documents live in a public GCS bucket instead. The ETL writes them under
 * `etl/viewer/` and `scripts/etl/publish_viewer.sh` mirrors them out.
 *
 * The trailing version segment is deliberate: GCS edge-caches public objects,
 * and a cached copy served *before* the bucket's CORS policy existed keeps
 * answering without `Access-Control-Allow-Origin`, which the browser rejects as
 * an opaque failure. Serving a fresh path per publish sidesteps that; bump the
 * version when the assets change.
 */
export const SPLAT_BASE_URL
  = process.env.NEXT_PUBLIC_SPLAT_BASE_URL ?? 'https://storage.googleapis.com/meghdoot-viewer-public/v2';

export type SplatSceneMeta = {
  id: string;
  label: string;
  source: SplatSource;
  lng: number;
  lat: number;
  /** Seed-camera heading in degrees clockwise from north. */
  yaw: number;
  /** Ground elevation (m) from the OpenTopography COP30 DEM. */
  elevation: number;
  gaussians: number;
  sogBytes: number;
  /** `/drone/lyra/splat/<id>.spz` — the viewer asset (Niantic SPZ, Spark-native). */
  url: string;
  /** SOG archive entry point (`meta.json` + webp) kept alongside. */
  sogUrl: string;
  /** Where the first-person camera sits in the scene's local ENU frame. */
  cameraOrigin: [number, number, number];
  /** Unit-ish view direction of the seed camera, in the same frame. */
  cameraForward: [number, number, number];
  /**
   * Uniform scale applied to the splat mesh. Lyra's zoomgs pipeline uses a
   * metric gauge (1 unit = 1 m); VIPE reconstructions of real footage are
   * gauge-free and come out ~50x smaller, so they carry an explicit scale.
   */
  scale: number;
  fillRatio?: number;
};

/** Terrain height (m) at each anchor, from the OpenTopography COP30 DEM. */
const ELEVATION: Record<string, number> = {
  'trail-ascent': 95,
  'roche-tortue': 88,
  'croix-lorraine': 110,
  'pano-06d14b03': 95,
  'pano-175106e9': 95,
};

type ManifestWorld = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  yaw: number;
  source?: string;
};

type ReportScene = {
  id: string;
  gaussians: number;
  sog_bytes: number;
  sog_path: string;
  fill_ratio?: number;
  camera_origin?: [number, number, number];
  camera_forward?: [number, number, number];
  scale?: number;
};

export async function loadScenes(): Promise<SplatSceneMeta[]> {
  const [manifestRes, reportRes] = await Promise.all([
    fetch(`${SPLAT_BASE_URL}/manifest.json`, { cache: 'no-store' }),
    fetch(`${SPLAT_BASE_URL}/sog-report.json`, { cache: 'no-store' }),
  ]);
  if (!manifestRes.ok || !reportRes.ok) {
    throw new Error(`registry ${manifestRes.status}/${reportRes.status}`);
  }
  const manifest = (await manifestRes.json()) as { worlds: ManifestWorld[] };
  const report = (await reportRes.json()) as { scenes: ReportScene[] };
  const byId = new Map(report.scenes.map(s => [s.id, s]));

  return manifest.worlds
    .map((w): SplatSceneMeta | null => {
      const r = byId.get(w.id);
      if (!r) {
        return null;
      }
      return {
        id: w.id,
        label: w.label ?? w.id,
        source: (w.source as SplatSource) ?? 'clip',
        lng: w.lng,
        lat: w.lat,
        yaw: w.yaw,
        elevation: ELEVATION[w.id] ?? 95,
        gaussians: r.gaussians,
        sogBytes: r.sog_bytes,
        url: `${SPLAT_BASE_URL}/splat/${w.id}.spz`,
        sogUrl: `${SPLAT_BASE_URL}/sog/${w.id}/meta.json`,
        cameraOrigin: r.camera_origin ?? [0, 0, 0],
        scale: r.scale ?? 1,
        cameraForward: r.camera_forward
          ?? [Number(-Math.sin((w.yaw * Math.PI) / 180).toFixed(5)), 0, Number(-Math.cos((w.yaw * Math.PI) / 180).toFixed(5))],
        fillRatio: r.fill_ratio,
      };
    })
    .filter((s): s is SplatSceneMeta => Boolean(s));
}

export function findScene(scenes: SplatSceneMeta[], id: string): SplatSceneMeta | undefined {
  return scenes.find(s => s.id === id);
}

export function formatBytes(n: number): string {
  if (n >= 1e9) {
    return `${(n / 1e9).toFixed(2)} GB`;
  }
  if (n >= 1e6) {
    return `${(n / 1e6).toFixed(1)} MB`;
  }
  return `${(n / 1e3).toFixed(0)} KB`;
}
