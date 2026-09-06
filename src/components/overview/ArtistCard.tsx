import type { Artist } from "@/types/artists";
import { Link } from "react-router-dom";
import ArrowIcon from "@/components/ArrowIcon";
import { getArtistTotal } from "@/utils/getArtistTotal";
import { highlightDot } from "@/stores/hoverBus";
import { useOverviewSelection } from "@/stores/OverviewSelectionContext";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const { toggle, selectedIds } = useOverviewSelection();
  const isSelected = selectedIds.has(artist.id);
  const totalAttributions = getArtistTotal(artist);

  const culturalContext = artist.cultural_context_info.declarations
    .map((d) => d.label)
    .join(", ");

  return (
    <div
      className={
        "work-card-container" +
        (isSelected ? " work-card-container-expanded" : "")
      }
    >
      <div
        className="work-card"
        onClick={() => {
          toggle(artist.id);
        }}
        onMouseEnter={() => highlightDot(artist.id)}
        onMouseLeave={() => highlightDot(null)}
      >
        <div className="work-card-upper">
          <div className="work-card-info">
            <div className="work-card-description">
              <h4 className="work-card-title">{artist.name}</h4>
              <p className="work-card-dating">
                <span className="work-card-dating-note">{artist.life.raw && artist.life.start && `${artist.life.precision === "century" ? "Approx. century" : String(artist.life.type).charAt(0).toUpperCase() + String(artist.life.type).slice(1)}: `}</span>
                {artist.life.raw && artist.life.start
                  ? `${artist.life.start}${artist.life.start_approx ? " ca." : ""} - ${
                      artist.life.end
                        ? `${artist.life.end}${artist.life.end_approx ? " ca." : ""}`
                        : "present"
                    }`
                  : artist.life.raw || "Life dates unknown"}
              </p>
              {culturalContext && (
                <p className="work-card-context">
                  Cultural context: <span className="work-card-context-value">{culturalContext.toLowerCase() != "unknown" ? "scuola" : ""} {culturalContext.toLowerCase()}</span>
                </p>
              )}
            </div>
            <div className="work-card-attributions">
              <p>
                {totalAttributions} attribution
                {totalAttributions !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
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
