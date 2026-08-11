import type { WorkItem } from "@/types/works";
import { BASE_URL } from "@/utils/constants.ts";
import { formatDating } from "@/utils/formatDating";
import ArrowLink from "@/components/ArrowLink";
import ArrowIcon from "@/components/ArrowIcon";
import { Link } from "react-router-dom";
import ExpandArrow from "@/components/ExpandArrow";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
import { representativeAuthor } from "../work/attributions/utils";

interface WorkCardProps {
  workItem: WorkItem;
  artistId: string;
}

export default function WorkCard({ workItem, artistId }: WorkCardProps) {
  const acceptedDating = workItem.work?.dating
    .filter((d) => d.type === "accepted")
    .map(formatDating);
  const { selectedIds, toggle, setHoveredWorkId } = useArtistSelection();
  const workId = workItem.id;
  const isSelected = selectedIds.has(workId);
  const { isWorkFilteredOut, isAttributionFilteredOut } = useArtistFilter();
  const attributionsLength = Object.keys(
    workItem.attributions?.attributions || {},
  ).length;

  // Filter out works that have no attributions for the current artist
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
        (isSelected ? " work-card-container-expanded" : "") +
        (isFilteredOut ? " filtered-out" : "")
      }
    >
      <div
        className="work-card"
        onClick={() => toggle(workId)}
        onMouseEnter={() => setHoveredWorkId(workId)}
        onMouseLeave={() => setHoveredWorkId(null)}
      >
        <div className="work-card-upper">
          <div className="work-card-img-container">
            <img
              src={BASE_URL + workItem.work?.photos[0].image_path}
              alt={workItem.work?.photos[0].alt || "Untitled"}
            />
          </div>
          <div className="work-card-info">
            <div className="work-card-description">
              <h4 className="work-card-title">
                {workItem.work?.subject || "Untitled"}
              </h4>
              <p className="work-card-dating">
                {acceptedDating?.join(", ") ||
                  "No dating information available"}
              </p>
            </div>
            <div className="work-card-attributions">
              <p>
                {isSelected ? "Collapse" : "Expand"} {attributionsLength}{" "}
                attribution
                {attributionsLength !== 1 ? "s" : ""}
              </p>
              <ExpandArrow isExpanded={isSelected} />
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="work-card-attributions-expanded">
            {workItem.attributions ? (
              <>
                <p className="work-card-attributions-header">
                  <span>Artists</span>
                  <span>Type</span>
                </p>
                <ul>
                  {Object.values(workItem.attributions.attributions).map(
                    (attr) => {
                      const involvesThisArtist = attr.authors.some(
                        (a) => a.local_id === artistId,
                      );
                      return (
                        <li key={attr.attribution_id}>
                          <div className="work-card-attribution-authors">
                            {attr.authors.map((author) => (
                              <ArrowLink
                                target={`/artist/${author.local_id}`}
                                artistName={author.name}
                                relation={
                                  representativeAuthor(attr).r_qualifier
                                }
                                uncertainty={
                                  representativeAuthor(attr).u_qualifier
                                }
                                isAnonym={
                                  author.is_anonymous ||
                                  author.local_id === artistId
                                }
                              />
                            ))}
                          </div>

                          <span
                            className={
                              "work-card-attributions-type-span" +
                              (attr.type === "accepted"
                                ? " type-span-accepted"
                                : " type-span-discarded") +
                              (involvesThisArtist
                                ? " type-span-highlighted"
                                : "")
                            }
                          >
                            {attr.type}
                          </span>
                        </li>
                      );
                    },
                  )}
                </ul>
              </>
            ) : null}
          </div>
        )}
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
