import { promises as fs } from 'node:fs';
import path from 'node:path';

import { list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const LOCAL_CACHE_DIR = path.join(process.cwd(), 'local');
const LOCAL_CACHE_FILE = path.join(LOCAL_CACHE_DIR, 'pointcloud_mappings.json');
const BLOB_FILENAME = 'pointcloud_mappings.json';

type Mapping = {
  latitude: number;
  longitude: number;
  featureId: string;
  pointCount: string;
  extent: string;
  elevation: string;
  viewerSrc: string;
  timestamp: string;
};

// Helper to get all mappings (from Vercel Blob or Local fallback)
async function getMappings(): Promise<Mapping[]> {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (hasToken) {
    try {
      const { blobs } = await list();
      const existingBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
      if (existingBlob) {
        const response = await fetch(existingBlob.url);
        if (response.ok) {
          return await response.json() as Mapping[];
        }
      }
    } catch (error) {
      console.error('Failed to read from Vercel Blob:', error);
    }
  }

  // Fallback to local file cache
  try {
    await fs.mkdir(LOCAL_CACHE_DIR, { recursive: true });
    const content = await fs.readFile(LOCAL_CACHE_FILE, 'utf-8');
    return JSON.parse(content) as Mapping[];
  } catch {
    return [];
  }
}

// Helper to save mappings (to Vercel Blob or Local fallback)
async function saveMappings(mappings: Mapping[]): Promise<string> {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const jsonContent = JSON.stringify(mappings, null, 2);

  if (hasToken) {
    try {
      const blob = await put(BLOB_FILENAME, jsonContent, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } catch (error) {
      console.error('Failed to save to Vercel Blob, falling back to local:', error);
    }
  }

  // Fallback to local file cache
  await fs.mkdir(LOCAL_CACHE_DIR, { recursive: true });
  await fs.writeFile(LOCAL_CACHE_FILE, jsonContent, 'utf-8');
  return '/local/pointcloud_mappings.json';
}

// GET handler to retrieve cached mapping for a coordinate (with small tolerance)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('latitude');
    const lngStr = searchParams.get('longitude');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Latitude and Longitude parameters are required.' }, { status: 400 });
    }

    const latitude = Number.parseFloat(latStr);
    const longitude = Number.parseFloat(lngStr);
    const mappings = await getMappings();

    // Check if there is an exact or extremely close mapping (within 0.0001 degrees)
    const tolerance = 0.0001;
    const matched = mappings.find(
      m => Math.abs(m.latitude - latitude) < tolerance && Math.abs(m.longitude - longitude) < tolerance,
    );

    return NextResponse.json({ matched: matched || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler to store a new coordinate mapping
export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<Mapping, 'timestamp'>;
    const { latitude, longitude, featureId, pointCount, extent, elevation, viewerSrc } = body;

    if (!latitude || !longitude || !featureId || !viewerSrc) {
      return NextResponse.json({ error: 'Required fields are missing.' }, { status: 400 });
    }

    const mappings = await getMappings();

    // Remove any existing mapping for the exact coordinates to avoid duplicates
    const updatedMappings = mappings.filter(
      m => !(Math.abs(m.latitude - latitude) < 0.0001 && Math.abs(m.longitude - longitude) < 0.0001),
    );

    const newMapping: Mapping = {
      latitude,
      longitude,
      featureId,
      pointCount,
      extent,
      elevation,
      viewerSrc,
      timestamp: new Date().toISOString(),
    };

    updatedMappings.push(newMapping);
    const storageUrl = await saveMappings(updatedMappings);

    return NextResponse.json({ success: true, storageUrl, mapping: newMapping });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
