import { promises as fs } from 'node:fs';
import path from 'node:path';

import { NextResponse } from 'next/server';

const LOCAL_STORE_DIR = path.join(process.cwd(), 'local');
const LOCAL_STORE_FILE = path.join(LOCAL_STORE_DIR, 'waiting_list.json');

type WaitingListEntry = {
  name: string;
  email: string;
  organization?: string;
  createdAt: string;
};

const isValidEmail = (value: string) =>
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(value);

const readLocalStore = async (): Promise<WaitingListEntry[]> => {
  try {
    const content = await fs.readFile(LOCAL_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as WaitingListEntry[]) : [];
  } catch {
    return [];
  }
};

const writeLocalStore = async (entries: WaitingListEntry[]) => {
  await fs.mkdir(LOCAL_STORE_DIR, { recursive: true });
  await fs.writeFile(LOCAL_STORE_FILE, JSON.stringify(entries, null, 2), 'utf-8');
};

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { name, email, organization } = (payload ?? {}) as {
    name?: unknown;
    email?: unknown;
    organization?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length < 1) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const entry: WaitingListEntry = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    ...(typeof organization === 'string' && organization.trim()
      ? { organization: organization.trim() }
      : {}),
    createdAt: new Date().toISOString(),
  };

  // Stub: persist locally for now. A real implementation will wire this
  // to a CRM, mailing list, or a serverless database.
  const entries = await readLocalStore();
  if (entries.some(existing => existing.email === entry.email)) {
    return NextResponse.json(
      { error: 'This email is already on the waiting list.' },
      { status: 409 },
    );
  }
  entries.push(entry);
  await writeLocalStore(entries);

  return NextResponse.json({ ok: true, entry });
}

export async function GET() {
  // Stub read endpoint for local debugging. Hide behind an env flag in
  // production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  const entries = await readLocalStore();
  return NextResponse.json({ entries });
}
