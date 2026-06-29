import type { AttributionsBundle } from "./attributions";
import type { Work } from "./works";

export type WorkItem = {
  id: string;
  work: Work | null;
  attributions: AttributionsBundle | null;
};