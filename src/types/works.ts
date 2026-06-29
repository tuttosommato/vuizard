export interface Dating {
  type: "accepted" | "discarded";
  from: string;
  to: string;
  from_approximation?: string;
  to_approximation?: string;
}

export interface Bibliography {
  type: string;
  author: string;
  title: string;
  date: string;
}

export interface Photos {
  link: string;
  alt: string;
  h: string;
  w: string;
}

export interface Work {
  id: string;
  title: string;
  subject: string;
  link: string;
  dating: Dating[];
  bibliography: Bibliography[];
  photos: Photos[];
  object: string;
  medium_material: string;
  height: string;
  length: string;
  n_attributions: number;
  diversity: number;
}

export interface WorksData {
  [key: string]: Work;
}

export type WorksIndex = Record<string, string>;
