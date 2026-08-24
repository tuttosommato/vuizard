// Reads the four source JSONs from data-source/ and writes:
//   public/data/v1/works/<workId>.json          (one per work IN SCOPE)
//   public/data/v1/authors/<authorId>.json      (one per author — all)
//   public/data/v1/attributions/<workId>.json   (one per work IN SCOPE)
//   public/data/v1/works-index.json             ({ [workId]: title })
//   public/data/v1/authors-full.json            (authors.json, copied as-is)
//   public/data/v1/authors-co-full.json         (authors_co.json, copied as-is)
//
// "In scope" = work IDs present in attributions.json. works.json is treated
// as a lookup table for enrichment (title, dating, etc.) of those works.
//
// authors-full.json / authors-co-full.json are bulk bundles, not split per-id —
// the third visualisation needs every author available at once (e.g. one point
// per author, cross-filtering), so per-id lazy files would just mean fetching
// all of them anyway. See the "all authors + co-occurrences" discussion.
//
// Run with: npm run split-data

import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "data-source");
const OUT = join(ROOT, "public", "data", "v1");

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

async function splitInScopeWorksAndAttributions() {
  console.log("→ reading attributions.json (defines the in-scope work set)...");
  const attributions = await readJson(join(SOURCE, "attributions.json"));
  const inScopeIds = Object.keys(attributions);
  console.log(`  ${inScopeIds.length} works in scope`);

  console.log("→ reading works.json (lookup table, ~50 MB — slow)...");
  const works = await readJson(join(SOURCE, "works.json"));
  console.log(`  ${Object.keys(works).length} total works in source`);

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

console.time("split-data");
await splitInScopeWorksAndAttributions();
await splitAuthors();
await copyAuthorsBundles();
console.timeEnd("split-data");
console.log("✓ done. Output is in public/data/v1/");