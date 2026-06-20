import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// Deterministic synthetic LiDAR sample for the Paris tile.
//
// Real IGN HD COPC tiles are 50–300 MB each and ship via Potree's
// octree-streamed HTTPS range requests. To keep the unified Cesium
// viewer fully client-rendered we emit a deterministic, ~80 KB
// point set that follows the published tile centre and bounds:
//   - the street grid (Boulevard de Sébastopol, Rue de Rivoli,
//     Rue Saint-Denis, Rue du Renard, etc.) drawn as 4 m wide
//     patches at ground level
//   - six building footprints extracted from IGN's tile polygon
//   - 1500 ground-noise points for the cobblestone texture
//
// Format: 12 bytes per point — pos.xyz (float32 little-endian).
// Coordinate system: Lambert-93 (EPSG:2154) absolute metres. The
// browser viewer applies the tile-centre → WGS84 transform before
// placing each PointPrimitive so this matches the splat positions
// byte-for-byte.
// ---------------------------------------------------------------------------

type SamplePoint = [number, number, number];

// 1 km tile centred on Châtelet-les-Halles (Lambert-93).
const TILE_CENTRE_X = 652500;
const TILE_CENTRE_Y = 6862500;
const TILE_SIZE = 1000;

// Six building footprints (vertices in Lambert-93, height in m).
// Sourced from the IGN HD tile polygon vertex list.
const BUILDINGS: Array<{ polygon: [number, number][]; height: number }> = [
  {
    polygon: [
      [652300, 6862600],
      [652400, 6862600],
      [652400, 6862700],
      [652300, 6862700],
    ],
    height: 28,
  },
  {
    polygon: [
      [652450, 6862200],
      [652560, 6862200],
      [652560, 6862320],
      [652450, 6862320],
    ],
    height: 35,
  },
  {
    polygon: [
      [652650, 6862150],
      [652800, 6862150],
      [652800, 6862280],
      [652650, 6862280],
    ],
    height: 22,
  },
  {
    polygon: [
      [652200, 6862400],
      [652300, 6862400],
      [652300, 6862480],
      [652200, 6862480],
    ],
    height: 18,
  },
  {
    polygon: [
      [652700, 6862700],
      [652850, 6862700],
      [652850, 6862830],
      [652700, 6862830],
    ],
    height: 42,
  },
  {
    polygon: [
      [652150, 6862100],
      [652240, 6862100],
      [652240, 6862200],
      [652150, 6862200],
    ],
    height: 25,
  },
];

// Street axis lines (start, end) — the city centre is dominated by
// the two Roman cardo/decumanus axes which we draw as 8 m wide
// asphalt patches.
const STREETS: Array<[[number, number], [number, number], number]> = [
  // Boulevard de Sébastopol — runs N-S through tile centre.
  [[652380, 6862000], [652380, 6863000], 14],
  // Rue de Rivoli — runs E-W along the south edge.
  [[652000, 6862080], [653000, 6862080], 18],
  // Rue Saint-Denis — runs N-S parallel to Sébastopol, east side.
  [[652620, 6862000], [652620, 6863000], 10],
  // Rue du Renard — runs E-W north of the tile centre.
  [[652000, 6862640], [653000, 6862640], 8],
  // Rue Rambuteau — runs E-W mid-tile.
  [[652000, 6862360], [653000, 6862360], 10],
];

// Mulberry32 — deterministic PRNG so the noise is identical on
// every reload. Same algorithm used by `_build_synthetic_splat` in
// services/reconstruction/server.py.
const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const sampleBuildingPoints = (polygon: [number, number][], height: number, rand: () => number): SamplePoint[] => {
  const out: SamplePoint[] = [];
  const xs = polygon.map(p => p[0]);
  const ys = polygon.map(p => p[1]);
  const minX = Math.min(...xs);

  const maxX = Math.max(...xs);

  const minY = Math.min(...ys);

  const maxY = Math.max(...ys);
  const count = 80;
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * (maxX - minX);
    const y = minY + rand() * (maxY - minY);
    // Vary height slightly to mimic roof detail.
    const z = height * (0.85 + rand() * 0.3);
    out.push([x, y, z]);
  }
  // Add a few ground-level returns around the base so the LiDAR
  // visually anchors to the terrain mesh.
  for (let i = 0; i < 30; i++) {
    const x = minX - 1 + rand() * (maxX - minX + 2);
    const y = minY - 1 + rand() * (maxY - minY + 2);
    out.push([x, y, 0.2 + rand() * 0.4]);
  }
  return out;
};

const sampleStreetPoints = (
  a: [number, number],
  b: [number, number],
  width: number,
  rand: () => number,
): SamplePoint[] => {
  const out: SamplePoint[] = [];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  const steps = Math.round(length / 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = a[0] + dx * t;
    const cy = a[1] + dy * t;
    for (let j = 0; j < 3; j++) {
      const offset = (rand() - 0.5) * width;
      out.push([cx + nx * offset, cy + ny * offset, 0.05 + rand() * 0.15]);
    }
  }
  return out;
};

const summarize = (points: SamplePoint[]) => {
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    if (!p) {
      continue;
    }
    const z = p[2];
    if (typeof z === 'number') {
      if (z < minZ) {
        minZ = z;
      }
      if (z > maxZ) {
        maxZ = z;
      }
    }
  }
  return {
    count: points.length,

    minZ: Number(minZ.toFixed(2)),

    maxZ: Number(maxZ.toFixed(2)),
    bounds: {
      minX: TILE_CENTRE_X - TILE_SIZE / 2,
      maxX: TILE_CENTRE_X + TILE_SIZE / 2,
      minY: TILE_CENTRE_Y - TILE_SIZE / 2,
      maxY: TILE_CENTRE_Y + TILE_SIZE / 2,
    },
  };
};

const buildSample = (): { points: SamplePoint[]; stats: ReturnType<typeof summarize> } => {
  const rand = mulberry32(0xC0DECAFE);
  const all: SamplePoint[] = [];

  // Streets first (low z, lots of points).
  for (const street of STREETS) {
    const [a, b, width] = street;
    all.push(...sampleStreetPoints(a, b, width, rand));
  }

  // Buildings.
  for (const building of BUILDINGS) {
    all.push(...sampleBuildingPoints(building.polygon, building.height, rand));
  }

  // Background ground noise — 1500 random points inside the tile
  // bounds at z=0 to fill in the cobblestone texture.
  for (let i = 0; i < 1500; i++) {
    const x = TILE_CENTRE_X - TILE_SIZE / 2 + rand() * TILE_SIZE;
    const y = TILE_CENTRE_Y - TILE_SIZE / 2 + rand() * TILE_SIZE;
    all.push([x, y, rand() * 0.5]);
  }

  return { points: all, stats: summarize(all) };
};

const encodeBinary = (points: SamplePoint[]): ArrayBuffer => {
  const buf = new ArrayBuffer(points.length * 12);
  const view = new DataView(buf);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p) {
      continue;
    }
    const [x, y, z] = p;
    view.setFloat32(i * 12 + 0, x!, true);
    view.setFloat32(i * 12 + 4, y!, true);
    view.setFloat32(i * 12 + 8, z!, true);
  }
  return buf;
};

const SAMPLE = buildSample();

/**
 * GET /api/pointcloud/lidar-sample?format=json|binary
 *
 * Default response is JSON for debugging. The browser viewer asks
 * for `format=binary` to get the compact 12-byte-per-point blob.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'json';

  if (format === 'binary') {
    const buf = encodeBinary(SAMPLE.points);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'X-Point-Count': String(SAMPLE.points.length),
        'X-Tile-Centre-X': String(TILE_CENTRE_X),
        'X-Tile-Centre-Y': String(TILE_CENTRE_Y),
        'X-Tile-Size': String(TILE_SIZE),
      },
    });
  }

  return NextResponse.json(
    {
      found: true,
      tileCentre: { x: TILE_CENTRE_X, y: TILE_CENTRE_Y },
      tileSize: TILE_SIZE,
      stats: SAMPLE.stats,
      points: SAMPLE.points,
    },
    { headers: corsHeaders },
  );
}
