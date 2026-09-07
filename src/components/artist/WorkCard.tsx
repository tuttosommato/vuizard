import type { WorkItem } from "@/types/works";
import ArrowIcon from "@/components/ArrowIcon";
import { Link } from "react-router-dom";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
import { representativeAuthor } from "@/components/work/attributions/utils";
import WorkCardBody from "@/components/WorkCardBody";

interface WorkCardProps {
  workItem: WorkItem;
  artistId: string;
}

export default function WorkCard({ workItem, artistId }: WorkCardProps) {
  const { selectedIds, toggle, setHoveredWorkId } = useArtistSelection();
  const workId = workItem.id;
  const isSelected = selectedIds.has(workId);
  const { isWorkFilteredOut, isAttributionFilteredOut } = useArtistFilter();
  const attributionsLength = Object.keys(
    workItem.attributions?.attributions || {},
  ).length;

  const relevantAttrs =
    workItem.attributions?.attributions.filter((a) =>
      a.authors.map((author) => author.local_id).includes(artistId),
    ) ?? [];

  const isFilteredOut =
    isWorkFilteredOut(attributionsLength) ||
    relevantAttrs.length === 0 ||
    relevantAttrs.every((attr) =>
      isAttributionFilteredOut(
        uncertaintyBucket(representativeAuthor(attr).u_qualifier),
        attr.type as "accepted" | "discarded",
      ),
    );

  return (
    <div
      className={
        "work-card-container" +
        (isSelected ? " work-card-container-selected" : "") +
        (isFilteredOut ? " filtered-out" : "")
      }
    >
      <div
        className="work-card"
        onClick={() => toggle(workId)}
        onMouseEnter={() => setHoveredWorkId(workId)}
        onMouseLeave={() => setHoveredWorkId(null)}
      >
        <WorkCardBody workItem={workItem} artistId={artistId} />
      </div>

      <div className="work-card-link-cnt">
        <Link
          to={`/work/${workItem.work?.id}`}
          className="work-card-link"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowIcon size={28} stroke={1.25} />
        </Link>
      </div>
    </div>
  );
}
