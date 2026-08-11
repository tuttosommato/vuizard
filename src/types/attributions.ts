export interface Attribution {
  type: "accepted" | "discarded";
  attribution_id: string;
  authors: AttributionAuthor[];
  reasons: Array<{
    reason: string;
    original_text: string;
    date: string;
    rank: number;
  }>;
}

export interface AttributionAuthor {
    name: string;
    local_id: string;
    composite_id: string;
    r_qualifier: string;
    u_qualifier: string;
    similarity_id: string;
    is_anonymous: boolean;
}

export interface AuthorSimilarity {
  a: string;
  b: string;
  similarity_a: string;
  similarity_b: string;
  npmi: number;
  count_a: number;
  count_b: number;
  count_ab: number;
  n: number;
}

export interface AttributionsBundle {
  attributions: Attribution[];
  author_similarities: AuthorSimilarity[];
  implicit_relations: [string, string][];
  master_relations: [string, string][];
  n_attributions: number;
  diversity: number | "";
}
