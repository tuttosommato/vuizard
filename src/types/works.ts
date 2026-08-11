import type { AttributionsBundle } from "./attributions";

export interface Dating {
  type: "accepted" | "discarded";
  from: string;
  to: string;
  from_approximation: string;
  to_approximation: string;
}

export interface Bibliography {
  type: "bibliografia specifica" | "bibliografia di confronto" | "";
  author: string;
  title: string;
  date: string;
}

export interface Photos {
  link: string;
  alt: string;
  image_path: string;
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

// for artist page
export type WorkItem = {
  id: string;
  work: Work | null;
  attributions: AttributionsBundle | null;
};
