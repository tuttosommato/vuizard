export interface Stats {
  counts: {[key: string]: number}
  reasons: {[key: string]: number}
  works: string[]
}

export interface Life {
  birth: string
  birth_qualifier: string
  death: string
  death_qualifier: string
  source: string
  source_url: string
}

export interface Author {
  ulan: string | null
  viaf: string | null
  wikidata: string | null
  dbpedia: string | null
  wikipedia: string | null
  pharos_actor: string | null
  names: string[]
  life?: Life
  stats: {[key: string]: Stats}
}