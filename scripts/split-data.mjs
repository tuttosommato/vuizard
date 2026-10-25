// Reads the four source JSONs from data-source/ and writes:
//   public/data/v1/works/<workId>.json          (one per work IN SCOPE)
//   public/data/v1/authors/<authorId>.json      (one per author — all)
//   public/data/v1/attributions/<workId>.json   (one per work IN SCOPE)
//   public/data/v1/works-index.json             ({ [workId]: title })
//   public/data/v1/works-counts.json            ({ [workId]: number of attributions }, to
//                                                order the artwork list by it)
//   public/data/v1/authors-full.json            (authors.json, copied as-is)
//   public/data/v1/authors-co-full.json         (authors_co.json, copied as-is)
//   public/data/v1/artist-bundles/<authorId>.json
//                                               (WorkItem[] — one per artist with more
//                                                than BUNDLE_MIN_WORKS works)
//
// "In scope" = work IDs present in attributions.json. works.json is treated
// as a lookup table for enrichment (title, dating, etc.) of those works.
//
// authors-full.json / authors-co-full.json are bulk bundles, not split per-id —
// the third visualisation needs every author available at once (e.g. one point
// per author, cross-filtering), so per-id lazy files would just mean fetching
// all of them anyway. See the "all authors + co-occurrences" discussion.
//
// artist-bundles/ are bulk bundles for the opposite reason: an artist page needs
// every work of one artist, and for the biggest artists that means two requests
// per work (1,000-2,000 at once), which browsers refuse (Chrome:
// net::ERR_INSUFFICIENT_RESOURCES). One file per such artist makes it a single request.
//
// Run with: npm run split-data
// To rebuild only the artist bundles (leaves every other output untouched):
//   node scripts/split-data.mjs --bundles-only
// To rebuild only works-counts.json (reads attributions.json only, so it is quick):
//   node scripts/split-data.mjs --counts-only

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "data-source");
const OUT = join(ROOT, "public", "data", "v1");

// Artists with MORE works than this get a bundle. Keep in sync with
// ARTIST_BUNDLE_MIN_WORKS in src/data/api.ts, which decides when to ask for one.
const BUNDLE_MIN_WORKS = 400;

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data));
}

async function resetDir(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function loadWorksAndAttributions() {
  console.log("→ reading attributions.json (defines the in-scope work set)...");
  const attributions = await readJson(join(SOURCE, "attributions.json"));
  console.log(`  ${Object.keys(attributions).length} works in scope`);

  console.log("→ reading works.json (lookup table, ~50 MB — slow)...");
  const works = await readJson(join(SOURCE, "works.json"));
  console.log(`  ${Object.keys(works).length} total works in source`);

  return { works, attributions };
}

async function splitInScopeWorksAndAttributions(works, attributions) {
  const inScopeIds = Object.keys(attributions);

  await resetDir(join(OUT, "works"));
  await resetDir(join(OUT, "attributions"));

  const index = {};
  const missing = [];

  for (const id of inScopeIds) {
    const work = works[id];
    if (!work) {
      // Attribution exists but no matching work record — flag it and skip.
      missing.push(id);
      continue;
    }
    await writeJson(join(OUT, "works", `${id}.json`), work);
    await writeJson(join(OUT, "attributions", `${id}.json`), attributions[id]);
    index[id] = work.title;
  }

  await writeJson(join(OUT, "works-index.json"), index);

  const written = inScopeIds.length - missing.length;
  console.log(`  wrote ${written} work files + ${written} attribution files`);
  console.log(`  wrote works-index.json (${written} entries)`);
  if (missing.length > 0) {
    console.warn(`  ⚠ ${missing.length} attribution keys had no matching work:`);
    console.warn(`    ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", ..." : ""}`);
  }
}

// How many attributions each work has, for ordering the list of works without loading them all
async function writeWorksCounts(attributions) {
  const counts = {};
  for (const [id, bundle] of Object.entries(attributions)) {
    counts[id] = bundle.attributions?.length ?? 0;
  }
  await writeJson(join(OUT, "works-counts.json"), counts);
  console.log(`  wrote works-counts.json (${Object.keys(counts).length} entries)`);
}

async function splitAuthors() {
  console.log("→ reading authors.json...");
  const authors = await readJson(join(SOURCE, "authors.json"));
  const ids = Object.keys(authors);
  console.log(`  ${ids.length} authors`);

  await resetDir(join(OUT, "authors"));

  for (const id of ids) {
    await writeJson(join(OUT, "authors", `${id}.json`), authors[id]);
  }
  console.log(`  wrote ${ids.length} author files`);
}

async function copyAuthorsBundles() {
  console.log("→ copying authors.json and authors_co.json as-is (bulk bundles, no splitting)...");
  const authors = await readJson(join(SOURCE, "authors.json"));
  const authorsCo = await readJson(join(SOURCE, "authors_co.json"));

  await writeJson(join(OUT, "authors-full.json"), authors);
  await writeJson(join(OUT, "authors-co-full.json"), authorsCo);

  console.log(`  wrote authors-full.json (${Object.keys(authors).length} authors)`);
  console.log(`  wrote authors-co-full.json (${Object.keys(authorsCo).length} authors)`);
}

async function writeArtistBundles(works, attributions) {
  console.log(`→ building artist bundles (artists with more than ${BUNDLE_MIN_WORKS} works)...`);
  const authors = await readJson(join(SOURCE, "authors.json"));

  await resetDir(join(OUT, "artist-bundles"));

  let written = 0;
  for (const [authorId, author] of Object.entries(authors)) {
    // same expression the artist page uses to list an artist's works
    const workIds = [...new Set(Object.values(author.stats).flatMap((s) => s.works))];
    if (workIds.length <= BUNDLE_MIN_WORKS) continue;

    // Mirror what the per-id files give the page: a work only has files when it has
    // both an attribution record and a work record, otherwise the fetch yields null.
    const items = workIds.map((id) => {
      const work = works[id];
      const workAttributions = attributions[id];
      return work && workAttributions
        ? { id, work, attributions: workAttributions }
        : { id, work: null, attributions: null };
    });

    await writeJson(join(OUT, "artist-bundles", `${authorId}.json`), items);
    written++;
  }
  console.log(`  wrote ${written} artist bundles`);
}

const bundlesOnly = process.argv.includes("--bundles-only");
const countsOnly = process.argv.includes("--counts-only");

console.time("split-data");
if (countsOnly) {
  console.log("→ reading attributions.json...");
  await mkdir(OUT, { recursive: true });
  await writeWorksCounts(await readJson(join(SOURCE, "attributions.json")));
} else {
  const { works, attributions } = await loadWorksAndAttributions();
  if (!bundlesOnly) {
    await splitInScopeWorksAndAttributions(works, attributions);
    await writeWorksCounts(attributions);
    await splitAuthors();
    await copyAuthorsBundles();
  }
  await writeArtistBundles(works, attributions);
}
console.timeEnd("split-data");
console.log("✓ done. Output is in public/data/v1/");
