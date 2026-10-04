// Source of truth for "where data comes from"
// The rest of the app go through this module instead of fetching directly, so the implementation can be swapped without changing any other code

import type { Work, WorkItem, WorksIndex } from "@/types/works";
import type { Artist } from "@/types/artists";
import type { AttributionsBundle } from "@/types/attributions";
import type { AuthorsCoBundle } from "@/types/coOccurrences";

// ---- Configuration ----

const DATA_VERSION = "v1";
const BASE = `/data/${DATA_VERSION}`;

// Artists with MORE works than this have a pre-built bundle (see
// scripts/split-data.mjs, BUNDLE_MIN_WORKS — keep the two in sync), so their page
// needs one request instead of two per work, which browsers refuse in bulk.
const ARTIST_BUNDLE_MIN_WORKS = 400;

// ---- Cache ----
// We cache the Promise (not just the resolved value) so that concurrent
// callers asking for the same resource share a single in-flight fetch.

const indexCache: { current: Promise<WorksIndex> | null } = { current: null };
const workCache = new Map<string, Promise<Work | null>>();
const attributionsCache = new Map<string, Promise<AttributionsBundle | null>>();
const authorCache = new Map<string, Promise<Artist | null>>();
const artistBundleCache = new Map<string, Promise<WorkItem[] | null>>();
const authorsFullCache: { current: Promise<Record<string, Artist>> | null } = {
  current: null,
};
const authorsCoCache: { current: Promise<AuthorsCoBundle> | null } = {
  current: null,
};

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

export function getAllAuthors(): Promise<Record<string, Artist>> {
  if (!authorsFullCache.current) {
    authorsFullCache.current = fetchJson<Record<string, Artist>>(
      `${BASE}/authors-full.json`,
    );
  }
  return authorsFullCache.current;
}

export function getAllAuthorsCo(): Promise<AuthorsCoBundle> {
  if (!authorsCoCache.current) {
    authorsCoCache.current = fetchJson<AuthorsCoBundle>(
      `${BASE}/authors-co-full.json`,
    );
  }
  return authorsCoCache.current;
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

export function getAuthor(id: string): Promise<Artist | null> {
  const cached = authorCache.get(id);
  if (cached) return cached;
  const p = fetchJsonOrNull<Artist>(`${BASE}/authors/${id}.json`);
  authorCache.set(id, p);
  return p;
}

function getArtistBundle(authorId: string): Promise<WorkItem[] | null> {
  const cached = artistBundleCache.get(authorId);
  if (cached) return cached;
  const p = fetchJsonOrNull<WorkItem[]>(`${BASE}/artist-bundles/${authorId}.json`)
    .then((items) => {
      // Seed the per-id caches too, so opening one of these works afterwards
      // (the card's link to /work/:id) doesn't fetch it again.
      for (const item of items ?? []) {
        if (!workCache.has(item.id)) {
          workCache.set(item.id, Promise.resolve(item.work));
        }
        if (!attributionsCache.has(item.id)) {
          attributionsCache.set(item.id, Promise.resolve(item.attributions));
        }
      }
      return items;
    })
    // The bundle is only a shortcut: if it's missing or unreadable (e.g. data
    // generated before bundles existed), fall back to per-id fetching.
    .catch(() => null);
  artistBundleCache.set(authorId, p);
  return p;
}

// Everything the artist page needs for one artist's works. Artists with many works
// come from a single bundle file; the rest, or any artist whose bundle is missing
// or doesn't cover all their works, are fetched per work.
export async function getArtistWorkItems(
  authorId: string,
  workIds: string[],
): Promise<WorkItem[]> {
  if (workIds.length > ARTIST_BUNDLE_MIN_WORKS) {
    const bundle = await getArtistBundle(authorId);
    if (bundle) {
      const byId = new Map(bundle.map((item) => [item.id, item]));
      const items = workIds.map((id) => byId.get(id));
      // a bundle that misses some of the artist's works is stale: don't trust it
      if (items.every((item): item is WorkItem => item !== undefined)) {
        return items;
      }
    }
  }

  const [works, attributions] = await Promise.all([
    Promise.all(workIds.map((id) => getWork(id))),
    Promise.all(workIds.map((id) => getAttributions(id))),
  ]);
  return workIds.map((id, i) => ({
    id,
    work: works[i],
    attributions: attributions[i],
  }));
}
