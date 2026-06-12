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

export interface AttributionsBundle {
  attributions: Attribution[]
  author_similarities: unknown[]
  implicit_relations: unknown[]
  master_relations: unknown[]
  unmatched_bibliography: unknown[]
}