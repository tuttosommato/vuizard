import type { AuthorsCoBundle } from "@/types/coOccurrences";

export function getCoAuthorsIds(
  id: string,
  coOccurrences: AuthorsCoBundle,
): Set<string> {
  return new Set(Object.keys(coOccurrences[id]?.co_authors ?? {}));
}

// Authors who appear together with EVERY currently-selected author: in at least one work
// that all the selected authors share (the same works the overview's works list shows).
// For a single selected author that is just their co-authors.
export function getIntersection(
  selectedIds: Set<string>,
  coOccurrences: AuthorsCoBundle,
): Set<string> {
  const [first, ...others] = selectedIds;
  // No selection at all → nothing to intersect → empty set.
  if (first === undefined) return new Set();

  const coAuthors = coOccurrences[first]?.co_authors ?? {};
  if (others.length === 0) return new Set(Object.keys(coAuthors));

  // works all the selected authors appear in
  const sharedWorks = new Set(coOccurrences[first]?.works ?? []);
  for (const id of others) {
    const own = new Set(coOccurrences[id]?.works ?? []);
    for (const w of sharedWorks) if (!own.has(w)) sharedWorks.delete(w);
  }

  // whoever appears in one of those works, next to the first author (and so, being
  // in a work all of them share, next to all of them)
  return new Set(
    Object.entries(coAuthors)
      .filter(([, entry]) => entry.works.some((w) => sharedWorks.has(w)))
      .map(([id]) => id),
  );
}

// Everything that should read as "highlighted":
// the selected authors, plus whoever co-occurs with all of them
export function getHighlightedIds(
  selectedIds: Set<string>,
  coOccurrences: AuthorsCoBundle,
): Set<string> {
  return new Set([
    ...selectedIds,
    ...getIntersection(selectedIds, coOccurrences),
  ]);
}
