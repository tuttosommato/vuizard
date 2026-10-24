import type { WorkItem } from "@/types/works";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import { isWorkItemFilteredOut } from "@/utils/workCardFilter";
import WorkCardBody from "@/components/WorkCardBody";

interface WorkCardProps {
  workItem: WorkItem;
  artistId: string;
}

export default function WorkCard({ workItem, artistId }: WorkCardProps) {
  const { selectedIds, setHoveredWorkId } = useArtistSelection();
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
        onMouseEnter={() => setHoveredWorkId(workId)}
        onMouseLeave={() => setHoveredWorkId(null)}
      >
        <WorkCardBody
          workItem={workItem}
          artistId={artistId}
          to={`/work/${workId}`}
        />
      </div>
    </div>
  );
}
