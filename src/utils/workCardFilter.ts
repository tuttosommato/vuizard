import type { WorkItem } from "@/types/works";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
import { representativeAuthor } from "@/components/work/attributions/utils";

// Whether the artist page's filters leave nothing of this work to show: its size is
// hidden, or every attribution of the artist on it is. Decides the card's dimming and
// its place in the list (filtered-out cards go last).
export function isWorkItemFilteredOut(
  workItem: WorkItem,
  artistId: string,
  isWorkFilteredOut: (size: number) => boolean,
  isAttributionFilteredOut: (
    uncertainty: ReturnType<typeof uncertaintyBucket>,
    type: "accepted" | "discarded",
  ) => boolean,
): boolean {
  const attributions = workItem.attributions?.attributions ?? [];
  const relevantAttrs = attributions.filter((a) =>
    a.authors.map((author) => author.local_id).includes(artistId),
  );
  return (
    isWorkFilteredOut(Object.keys(attributions).length) ||
    relevantAttrs.length === 0 ||
    relevantAttrs.every((attr) =>
      isAttributionFilteredOut(
        uncertaintyBucket(representativeAuthor(attr).u_qualifier),
        attr.type as "accepted" | "discarded",
      ),
    )
  );
}
