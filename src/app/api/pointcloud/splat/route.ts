import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { Env } from '@/libs/Env';

const REGISTRY_PATH = path.join(process.cwd(), 'public', 'sample-data', 'metadata', 'splat-registry.json');

type SplatEntry = {
  tileName: string;
  splatUrl: string;
  format: 'spz' | 'splat' | 'ply';
  sizeBytes: number;
  generatedAt: string;
  source: 'nerfstudio' | 'webodm' | 'pix4d' | 'manual';
  generator: string;
  qualityScore?: number;
  fallbackDemoUrl?: string;
  notes?: string;
};

type Registry = {
  version: number;
  updatedAt: string;
  entries: SplatEntry[];
};

const DEMO_FALLBACK_BY_TILE: Record<string, string> = {
  // Public Spark demo assets used while local reconstructions are pending.
  LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69: 'https://sparkjs.dev/assets/splats/butterfly.spz',
  LHD_FXX_0842_6520_PTS_O_LAMB93_IGN69: 'https://sparkjs.dev/assets/splats/garden.spz',
};

const SEED_ENTRIES: SplatEntry[] = [
  {
    tileName: 'LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69',
    splatUrl: '/sample-data/splats/chatelet-les-halles.spz',
    format: 'spz',
    sizeBytes: 0,
    generatedAt: '1970-01-01T00:00:00.000Z',
    source: 'nerfstudio',
    generator: 'splatfacto',
    fallbackDemoUrl: DEMO_FALLBACK_BY_TILE.LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69,
    notes: 'Châtelet-les-Halles, Paris 1st. Generated from YouTube drone fly-over. See docs/paris-fusion-setup.md.',
  },
  {
    tileName: 'LHD_FXX_0842_6520_PTS_O_LAMB93_IGN69',
    splatUrl: '/sample-data/splats/lyon-presquile.spz',
    format: 'spz',
    sizeBytes: 0,
    generatedAt: '1970-01-01T00:00:00.000Z',
    source: 'nerfstudio',
    generator: 'splatfacto',
    fallbackDemoUrl: DEMO_FALLBACK_BY_TILE.LHD_FXX_0842_6520_PTS_O_LAMB93_IGN69,
    notes: 'Lyon Presqu\'île. Pending reconstruction.',
  },
  {
    tileName: 'LHD_FXX_0892_6248_PTS_C_LAMB93_IGN69',
    splatUrl: '/sample-data/splats/marseille-port.spz',
    format: 'spz',
    sizeBytes: 0,
    generatedAt: '1970-01-01T00:00:00.000Z',
    source: 'nerfstudio',
    generator: 'splatfacto',
    notes: 'Marseille Old Port. Pending reconstruction.',
  },
  {
    tileName: 'LHD_FXX_0417_6422_PTS_C_LAMB93_IGN69',
    splatUrl: '/sample-data/splats/bordeaux-centre.spz',
    format: 'spz',
    sizeBytes: 0,
    generatedAt: '1970-01-01T00:00:00.000Z',
    source: 'nerfstudio',
    generator: 'splatfacto',
    notes: 'Bordeaux centre. Pending reconstruction.',
  },
];

const isReadOnlyFs = (): boolean => Env.READ_ONLY_FS === 'true';

const buildRegistryFromSeeds = (): Registry => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  entries: [...SEED_ENTRIES],
});

const readRegistry = async (): Promise<Registry> => {
  if (isReadOnlyFs()) {
    return buildRegistryFromSeeds();
  }
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Registry;
    // Merge in any seed entries that aren't present yet so newly
    // added tiles become discoverable without a manual write.
    const known = new Set(parsed.entries.map(e => e.tileName));
    for (const seed of SEED_ENTRIES) {
      if (!known.has(seed.tileName)) {
        parsed.entries.push(seed);
      }
    }
    return parsed;
  } catch {
    return buildRegistryFromSeeds();
  }
};

const writeRegistry = async (registry: Registry): Promise<void> => {
  if (isReadOnlyFs()) {
    throw new Error('Registry is read-only in this environment (READ_ONLY_FS=true)');
  }
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
};

const lookupEntry = (registry: Registry, tileName: string): SplatEntry | undefined =>
  registry.entries.find(entry => entry.tileName === tileName);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * GET /api/pointcloud/splat?tile=LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69
 *
 * Resolves the splat entry for a given LiDAR HD tile. The response
 * always includes both the local `splatUrl` (which may 404 if the
 * reconstruction is still pending) and a `fallbackDemoUrl` so the
 * client can degrade gracefully.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tile = searchParams.get('tile');

  if (!tile) {
    return NextResponse.json(
      { error: 'Missing required `tile` query parameter.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const registry = await readRegistry();
  const entry = lookupEntry(registry, tile);

  if (!entry) {
    return NextResponse.json(
      {
        tile,
        found: false,
        message: 'No splat registered for this tile yet.',
      },
      { status: 404, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    {
      found: true,
      tile,
      splatUrl: entry.splatUrl,
      format: entry.format,
      sizeBytes: entry.sizeBytes,
      generatedAt: entry.generatedAt,
      source: entry.source,
      generator: entry.generator,
      qualityScore: entry.qualityScore,
      fallbackDemoUrl: entry.fallbackDemoUrl,
      notes: entry.notes,
    },
    { headers: corsHeaders },
  );
}

/**
 * POST /api/pointcloud/splat/synth
 *
 * Body:
 *   {
 *     "tileName": "LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69",
 *     "lambertCenterX": 652500,
 *     "lambertCenterY": 6862500,
 *     "tileSizeM": 1000,
 *     "splatCount": 8000
 *   }
 *
 * Proxies the request to the FastAPI reconstruction sidecar, which
 * writes a deterministic `.splat` aligned to the Lambert-93 tile
 * bounds. Returns the resulting splat URL so the browser can stream
 * it directly from /sample-data/splats/.
 */
export async function PUT(request: Request) {
  if (isReadOnlyFs()) {
    return NextResponse.json(
      { error: 'Registry is read-only in this environment (READ_ONLY_FS=true)' },
      { status: 403, headers: corsHeaders },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const tileName = String(body.tileName ?? '');
  const lambertX = Number(body.lambertCenterX ?? NaN);
  const lambertY = Number(body.lambertCenterY ?? NaN);
  const tileSize = Number(body.tileSizeM ?? 800);
  const splatCount = Number(body.splatCount ?? 8000);

  if (!tileName || !Number.isFinite(lambertX) || !Number.isFinite(lambertY)) {
    return NextResponse.json(
      {
        error: 'Required fields: tileName, lambertCenterX, lambertCenterY.',
      },
      { status: 400, headers: corsHeaders },
    );
  }

  const sidecarUrl = process.env.RECON_SIDECAR_URL;
  if (!sidecarUrl) {
    return NextResponse.json(
      {
        error:
          'RECON_SIDECAR_URL is not configured. The reconstruction sidecar is required to generate splats on demand.',
      },
      { status: 503, headers: corsHeaders },
    );
  }

  let sidecarResponse: Response;
  try {
    sidecarResponse = await fetch(`${sidecarUrl}/api/synth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tile_name: tileName,
        lambert_center_x: lambertX,
        lambert_center_y: lambertY,
        tile_size_m: tileSize,
        splat_count: splatCount,
        output_format: 'splat',
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Reconstruction sidecar unreachable at ${sidecarUrl}: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 502, headers: corsHeaders },
    );
  }

  if (!sidecarResponse.ok) {
    const errorText = await sidecarResponse.text();
    return NextResponse.json(
      {
        error: `Sidecar returned ${sidecarResponse.status}: ${errorText.slice(0, 500)}`,
      },
      { status: 502, headers: corsHeaders },
    );
  }

  const payload = await sidecarResponse.json();
  return NextResponse.json(
    {
      ok: true,
      tile: tileName,
      splatUrl: payload.splat_url,
      splatSizeBytes: payload.splat_size_bytes,
      splatCount: payload.splat_count,
      format: payload.format,
      alignment: payload.alignment,
      sidecar: sidecarUrl,
    },
    { headers: corsHeaders },
  );
}

/**
 * POST /api/pointcloud/splat
 *
 * Body:
 *   {
 *     "tileName": "LHD_FXX_0652_6863_PTS_O_LAMB93_IGN69",
 *     "splatUrl": "/sample-data/splats/chatelet-les-halles.spz",
 *     "format": "spz",
 *     "sizeBytes": 12345678,
 *     "source": "nerfstudio",
 *     "generator": "splatfacto",
 *     "qualityScore": 30.4 (optional),
 *     "notes": "Free-form text" (optional)
 *   }
 *
 * Used by `scripts/reconstruction/process-paris-tile.ts` after a
 * successful training run. Updates the existing entry in place or
 * appends a new one.
 */
export async function POST(request: Request) {
  if (isReadOnlyFs()) {
    return NextResponse.json(
      { error: 'Registry is read-only in this environment (READ_ONLY_FS=true)' },
      { status: 403, headers: corsHeaders },
    );
  }

  let body: Partial<SplatEntry>;
  try {
    body = (await request.json()) as Partial<SplatEntry>;
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const { tileName, splatUrl, format, sizeBytes, source, generator, qualityScore, notes } = body;

  if (!tileName || !splatUrl || !format || !source || !generator) {
    return NextResponse.json(
      {
        error: 'Required fields: tileName, splatUrl, format, source, generator.',
      },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!['spz', 'splat', 'ply'].includes(format)) {
    return NextResponse.json(
      { error: 'format must be one of: spz, splat, ply.' },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!['nerfstudio', 'webodm', 'pix4d', 'manual'].includes(source)) {
    return NextResponse.json(
      { error: 'source must be one of: nerfstudio, webodm, pix4d, manual.' },
      { status: 400, headers: corsHeaders },
    );
  }

  const registry = await readRegistry();
  const existingIndex = registry.entries.findIndex(entry => entry.tileName === tileName);
  const nextEntry: SplatEntry = {
    tileName,
    splatUrl,
    format: format as SplatEntry['format'],
    sizeBytes: sizeBytes ?? 0,
    generatedAt: new Date().toISOString(),
    source: source as SplatEntry['source'],
    generator,
    ...(typeof qualityScore === 'number' ? { qualityScore } : {}),
    fallbackDemoUrl: DEMO_FALLBACK_BY_TILE[tileName],
    ...(notes ? { notes } : {}),
  };

  if (existingIndex >= 0) {
    const previous = registry.entries[existingIndex] as SplatEntry | undefined;
    if (previous) {
      registry.entries[existingIndex] = {
        ...previous,
        ...nextEntry,
        // Preserve any hand-curated notes unless caller overrode them.
        notes: notes ?? previous.notes,
        fallbackDemoUrl: previous.fallbackDemoUrl ?? nextEntry.fallbackDemoUrl,
      };
    } else {
      // Theoretically impossible (existingIndex is from findIndex) but
      // satisfies the type-checker under noUncheckedIndexedAccess.
      registry.entries[existingIndex] = nextEntry;
    }
  } else {
    registry.entries.push(nextEntry);
  }

  registry.updatedAt = new Date().toISOString();
  await writeRegistry(registry);

  const insertedIndex = existingIndex >= 0 ? existingIndex : registry.entries.length - 1;
  return NextResponse.json(
    {
      success: true,
      entry: registry.entries[insertedIndex],
    },
    { headers: corsHeaders },
  );
}
