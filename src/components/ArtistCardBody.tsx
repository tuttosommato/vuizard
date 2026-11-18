import type { Artist } from "@/types/artists";
import { getArtistTotal } from "@/utils/getArtistTotal";
import { formatLife, formatLifeLabel } from "@/utils/formatLife";
import { memo } from "react";
import { CardOpenArrow, CardTitle } from "@/components/CardLink";

export default memo(function ArtistCardBody({
  artist,
  to,
}: {
  artist: Artist;
  to?: string; // makes the card a link to this address
}) {
  const totalAttributions = getArtistTotal(artist);
  const culturalContext = artist.cultural_context_info.declarations
    .map((d) => d.label)
    .join(", ");

  const lifeLabel = formatLifeLabel(artist.life);

  return (
    <>
      <div className="work-card-upper">
        <div className="work-card-info">
          <div className="work-card-description">
            <CardTitle to={to}>{artist.name}</CardTitle>
            <p className="work-card-dating">
              <span className="work-card-dating-note">
                {lifeLabel && `${lifeLabel}: `}
              </span>
              {formatLife(artist.life)}
            </p>

            {[
              ...artist.pseudonyms,
              ...artist.pseudonym_alts,
              ...artist.variant_names,
            ].length > 0 && (
              <p className="work-card-alt-names">
                Also known as{" "}
                {[
                  ...artist.pseudonyms,
                  ...artist.pseudonym_alts,
                  ...artist.variant_names,
                ].map((name, i) => (
                  <span key={name}>
                    {i > 0 && ", "}
                    <span className="alternative-name">{name}</span>
                  </span>
                ))}
              </p>
            )}

            {culturalContext && (
              <p className="work-card-context">
                Cultural context:{" "}
                <span className="work-card-context-value">
                  {culturalContext.toLowerCase() != "unknown" ? "scuola" : ""}{" "}
                  {culturalContext.toLowerCase()}
                </span>
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
      {to && <CardOpenArrow />}
    </>
  );
});
