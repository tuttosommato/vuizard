import type { WorkItem } from "@/types/works";
import { BASE_URL } from "@/utils/constants.ts";
import { formatDating } from "@/utils/formatDating";
import ArrowLink from "@/components/ArrowLink";
import { Fragment } from "react";

interface WorkCardBodyProps {
  workItem: WorkItem;
  artistId?: string;
  isList?: boolean;
}

export default function WorkCardBody({
  workItem,
  artistId = "",
  isList = false,
}: WorkCardBodyProps) {
  const acceptedDating = workItem.work?.dating
    .filter((d) => d.type === "accepted")
    .map(formatDating);
  const attributionsLength = Object.keys(
    workItem.attributions?.attributions || {},
  ).length;
  const availablePhotos = workItem.work?.photos.filter((p) => p.image_path);

  return (
    <>
      <div title={workItem.work?.subject || "Untitled"} className="work-card-upper">
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
              {acceptedDating?.join(", ") || "No dating information available"}
            </p>
          </div>
          <div className="work-card-attributions">
            <p>
              {attributionsLength} attribution
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
                  <Fragment key={attr.attribution_id}>
                    {attr.authors.map((author, idx) => (
                      <tr
                        key={author.local_id}
                        className={idx + 1 === authorsLength ? "last-row" : ""}
                      >
                        <td className="work-card-attribution-authors">
                          <ArrowLink
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
                            (involvesThisArtist || (isList && attr.type === "accepted") ? " type-span-highlighted" : "")
                          }
                        >
                          {idx + 1 != authorsLength || authorsLength === 1
                            ? attr.type
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
