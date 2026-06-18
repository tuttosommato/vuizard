export interface Attribution {
  type: "accepted" | "discarded" | string
  local_id: string
  author: string
  pseudonym: string
  r_qualifier: string
  u_qualifier: string
  reasons: Array<{
    reason: string
    dates: string[]
    original_text: string
    rank: number
    matched_bibliography: string[]
  }>
  operational_id: string
  similarity_id: string
  base_id: string
  is_anonymous: boolean
}

export interface AuthorSimilarity {
  a: string
  b: string
  similarity_a: string
  similarity_b: string
  npmi: number
  count_a: number
  count_b: number
  count_ab: number
  n: number
}

/** pairs of author identifiers (may include suffixes like "-?", "-BOTTEGA", etc.) */
export type AuthorPair = [string, string]

export interface AttributionsBundle {
  attributions: Attribution[]
  author_similarities: AuthorSimilarity[]
  implicit_relations: AuthorPair[]
  master_relations: AuthorPair[]
  unmatched_bibliography: string[]
}

