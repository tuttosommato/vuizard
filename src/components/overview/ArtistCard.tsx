import type { Artist } from "@/types/artists";
import { Link } from "react-router-dom";
import ArrowIcon from "@/components/ArrowIcon";
import { highlightDot } from "@/stores/hoverBus";
import { useOverviewSelection } from "@/stores/OverviewSelectionContext";
import ArtistCardBody from "@/components/ArtistCardBody";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const { toggle, selectedIds } = useOverviewSelection();
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
        onClick={() => toggle(artist.id)}
        onMouseEnter={() => highlightDot(artist.id)}
        onMouseLeave={() => highlightDot(null)}
      >
        <ArtistCardBody artist={artist} />
      </div>

      <div className="work-card-link-cnt">
        <Link
          to={`/artist/${artist.id}`}
          className="work-card-link"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowIcon size={28} stroke={1.25} />
        </Link>
      </div>
    </div>
  );
}
