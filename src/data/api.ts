// Source of truth for "where data comes from"
// The rest of the app go through this module instead of fetching directly, so the implementation can be swapped without changing any other code

import type { Work, WorksIndex } from "@/types/works";
import type { Author } from "@/types/authors";
import type { AttributionsBundle } from "@/types/attributions";

// ---- Configuration ----

const DATA_VERSION = "v1";
const BASE = `/data/${DATA_VERSION}`;

// ---- Cache ----
// We cache the Promise (not just the resolved value) so that concurrent
// callers asking for the same resource share a single in-flight fetch.

const indexCache: { current: Promise<WorksIndex> | null } = { current: null };
const workCache = new Map<string, Promise<Work | null>>();
const attributionsCache = new Map<string, Promise<AttributionsBundle | null>>();
const authorCache = new Map<string, Promise<Author | null>>();

// Internal fetch helpers

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Fetch failed: ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Public API functions

export function getWorksIndex(): Promise<WorksIndex> {
  if (!indexCache.current) {
    indexCache.current = fetchJson<WorksIndex>(`${BASE}/works-index.json`);
  }
  return indexCache.current;
}

export function getWork(id: string): Promise<Work | null> {
  const cached = workCache.get(id);
  if (cached) return cached;
  const p = fetchJsonOrNull<Work>(`${BASE}/works/${id}.json`);
  workCache.set(id, p);
  return p;
}

export function getAttributions(
  workId: string,
): Promise<AttributionsBundle | null> {
  const cached = attributionsCache.get(workId);
  if (cached) return cached;
  const p = fetchJsonOrNull<AttributionsBundle>(
    `${BASE}/attributions/${workId}.json`,
  );
  attributionsCache.set(workId, p);
  return p;
}

export function getAuthor(id: string): Promise<Author | null> {
  const cached = authorCache.get(id);
  if (cached) return cached;
  const p = fetchJsonOrNull<Author>(`${BASE}/authors/${id}.json`);
  authorCache.set(id, p);
  return p;
}
