export interface CoAuthorCounts {
  total: number;
  accepted: number;
  discarded: number;
}

// describes the relationship between "this"
// author and one specific other author.
export interface CoAuthorEntry {
  count_ab: number; // how many works these two co-occur in
  count_a: number;  // "this" author's total attributed-work count
  count_b: number;  // the other author's total attributed-work count
  works: string[];  // work ids where both co-occur
  npmi: number;
  co_author_counts: CoAuthorCounts;
}

// One author's entry in authors_co.json
export interface AuthorCoOccurrence {
  n_works: number;
  works: string[];
  counts: CoAuthorCounts;
  co_authors: { [otherAuthorId: string]: CoAuthorEntry };
}

// The whole co-occurrences file
export type AuthorsCoBundle = { [authorId: string]: AuthorCoOccurrence };