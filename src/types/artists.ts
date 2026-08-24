export interface Artist {
  id: string;
  pharos_id: string;
  name: string;
  surname: string;
  first_name: string;
  sex: string;
  role: string;
  birthplace: string;
  deathplace: string;
  activity_note: string;
  cultural_context: string;
  cultural_context_info: CulturalContextInfo;
  ulan: string | null;
  wikidata: string | null;
  wikipedia: string | null;
  dbpedia: string | null;
  viaf: string | null;
  variant_names: string[];
  pseudonyms: string[];
  pseudonym_alts: string[];
  school: string[];
  life: Life;
  stats: { [key: string]: Stats };
}

export interface CulturalContextInfo {
  century_bucket: number | null; // e.g. 1400, 1500
  declarations: CulturalContextDeclaration[];
}

export interface CulturalContextDeclaration {
  canonical: string;
  label: string;
  tier: "city" | "regional" | "national" | "unknown";
  chain: string[]; // e.g. ["italiana", "toscana", "fiorentina"] — broad to narrow
}

export interface Life {
  type: "life" | "information" | "activity";
  start: string;
  end: string;
  start_approx: string;
  end_approx: string;
  precision: "year" | "century" | "unknown";
  raw: string;
  parsed: boolean;
}

export interface Stats {
  counts: { [key: string]: number };
  reasons: { [key: string]: number };
  works: string[];
}