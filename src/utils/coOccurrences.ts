import type { AuthorsCoBundle } from "@/types/coOccurrences";

export function getCoAuthorsIds(
  id: string,
  coOccurrences: AuthorsCoBundle,
): Set<string> {
  return new Set(Object.keys(coOccurrences[id]?.co_authors ?? {}));
}

// Authors who co-occur with EVERY currently-selected author. Progressively narrow:
// it starts with the first selected author's co-authors, then for each additional
// selected author, keep only the ids that are ALSO in that author's own co-author set
export function getIntersection(
  selectedIds: Set<string>,
  coOccurrences: AuthorsCoBundle,
): Set<string> {
  let intersection: Set<string> | null = null;

  for (const id of selectedIds) {
    const coAuthors = getCoAuthorsIds(id, coOccurrences);

    if (intersection === null) {
      // First selected author
      intersection = coAuthors;
    } else {
      // Keep only ids present in BOTH the running intersection and this author's own co-authors
      intersection = new Set(
        [...intersection].filter((coAuthorId: string) =>
          coAuthors.has(coAuthorId),
        ),
      );
    }
  }
  // No selection at all → nothing to intersect → empty set.
  return intersection ?? new Set();
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
