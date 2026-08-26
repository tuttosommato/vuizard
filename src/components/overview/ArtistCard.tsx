import { useState } from "react";
import type { Artist } from "@/types/artists";
import { Link } from "react-router-dom";
import ArrowIcon from "@/components/ArrowIcon";
import { getArtistTotal } from "@/utils/getArtistTotal";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalAttributions = getArtistTotal(artist);

  const culturalContext = artist.cultural_context_info.declarations
    .map((d) => d.label)
    .join(", ");

  return (
    <div
      className={
        "work-card-container" +
        (isExpanded ? " work-card-container-expanded" : "")
      }
    >
      <div className="work-card" onClick={() => setIsExpanded((v) => !v)}>
        <div className="work-card-upper">
          <div className="work-card-info">
            <div className="work-card-description">
              <h4 className="work-card-title">{artist.name}</h4>
              <p className="work-card-dating">
                {artist.life.raw && artist.life.start
                  ? `${artist.life.start}${artist.life.start_approx ? " ca." : ""} - ${
                      artist.life.end
                        ? `${artist.life.end}${artist.life.end_approx ? " ca." : ""}`
                        : "present"
                    }`
                  : artist.life.raw || "Life dates unknown"}
              </p>
              {culturalContext && (
                <p className="work-card-context">Artistic school (cultural context): {culturalContext}</p>
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