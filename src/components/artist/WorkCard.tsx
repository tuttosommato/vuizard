import type { WorkItem } from "@/types/works";
import { BASE_URL } from "@/utils/constants.ts";
import { formatDating } from "@/utils/formatDating";
import ArrowLink from "@/components/ArrowLink";
import ArrowIcon from "@/components/ArrowIcon";
import { Link } from "react-router-dom";
import { useArtistSelection } from "@/stores/ArtistSelectionContext";
import { useArtistFilter } from "@/stores/ArtistFilterContext";
import uncertaintyBucket from "@/utils/uncertaintyBucket";
import { representativeAuthor } from "@/components/work/attributions/utils";

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
  const availablePhotos = workItem.work?.photos.filter((p) => p.image_path);

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
        <div className="work-card-upper">
          <div className="work-card-img-container">
            <img
              src={BASE_URL + availablePhotos?.[0]?.image_path}
              alt={availablePhotos?.[0]?.alt || "Untitled"}
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
                {attributionsLength}{" "}
                attribution
                {attributionsLength !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
          <div className="work-card-attributions-expanded">
            <table className="work-card-attributions-table">
              <thead className="work-card-attributions-header">
                <tr>
                  <th>Artists</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(workItem.attributions?.attributions || {}).map(
                  (attr) => {
                    const involvesThisArtist = attr.authors.some(
                      (a) => a.local_id === artistId,
                    );
                    const authorsLength = attr.authors.length;
                    return (
                      <>
                        {attr.authors.map((author, idx) => (
                          <tr
                            key={attr.attribution_id}
                            className={
                              idx + 1 === authorsLength ? "last-row" : ""
                            }
                          >
                            <td className="work-card-attribution-authors">
                              <ArrowLink
                                key={author.local_id}
                                isAnonym={
                                  author.is_anonymous ||
                                  author.local_id === artistId
                                }
                                author={author}
                              />
                            </td>

                            <td
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
                              {idx + 1 != authorsLength || authorsLength === 1
                                ? attr.type
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
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
