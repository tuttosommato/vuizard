import type { WorkItem } from "@/types/works";
import ArrowIcon from "@/components/ArrowIcon";
import { Link } from "react-router-dom";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import { isWorkItemFilteredOut } from "@/utils/workCardFilter";
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
  const isFilteredOut = isWorkItemFilteredOut(
    workItem,
    artistId,
    isWorkFilteredOut,
    isAttributionFilteredOut,
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
