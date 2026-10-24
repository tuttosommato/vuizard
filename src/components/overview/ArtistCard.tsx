import type { Artist } from "@/types/artists";
import { highlightDot } from "@/stores/hoverBus";
import { useOverviewSelection } from "@/stores/OverviewSelectionContext";
import ArtistCardBody from "@/components/ArtistCardBody";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const { selectedIds } = useOverviewSelection();
  const isSelected = selectedIds.has(artist.id);

  return (
    <div
      className={
        "work-card-container" +
        (isSelected ? " work-card-container-selected" : "")
      }
    >
      <div
        className="work-card"
        onMouseEnter={() => highlightDot(artist.id)}
        onMouseLeave={() => highlightDot(null)}
      >
        <ArtistCardBody artist={artist} to={`/artist/${artist.id}`} />
      </div>
    </div>
  );
}
