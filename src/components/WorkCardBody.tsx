import type { WorkItem } from "@/types/works";
import { BASE_URL } from "@/utils/constants.ts";
import { formatDating } from "@/utils/formatDating";
import ArrowLink from "@/components/ArrowLink";
import { CardOpenArrow, CardTitle } from "@/components/CardLink";
import { Fragment, useState } from "react";

interface WorkCardBodyProps {
  workItem: WorkItem;
  artistId?: string;
  isList?: boolean;
  to?: string; // makes the card a link to this address
}

// A card's image. Until it has arrived the card shows the pulsing frame of the image previews,
// not the browser's alt text; a work with no image, or one that fails to load, gets the same
// frame without the pulse.
function CardImage({ src, alt }: { src: string | undefined; alt: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    src ? "loading" : "failed",
  );

  return (
    <div
      className={
        "work-card-img-container" +
        (status === "loading" ? " work-card-img-pending" : "") +
        (status === "failed"
          ? " work-card-img-pending work-card-img-failed"
          : "")
      }
    >
      {src && status !== "failed" && (
        <img
          src={src}
          alt={alt}
          loading="lazy" // an artist can have ~1,000 cards: only load the ones near the viewport
          // an image that is already there (loaded before) may not fire load again
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setStatus("ready");
          }}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("failed")}
        />
      )}
    </div>
  );
}

export default function WorkCardBody({
  workItem,
  artistId = "",
  isList = false,
  to,
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
      <div
        title={workItem.work?.subject || "Untitled"}
        className="work-card-upper"
      >
        <CardImage
          key={availablePhotos?.[0]?.image_path}
          src={
            availablePhotos?.[0]?.image_path
              ? BASE_URL + availablePhotos[0].image_path
              : undefined
          }
          alt={availablePhotos?.[0]?.alt || "Untitled"}
        />
        <div className="work-card-info">
          <div className="work-card-description">
            <CardTitle to={to}>
              {workItem.work?.subject || "Untitled"}
            </CardTitle>
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
      {to && <CardOpenArrow />}
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
                            noLink={author.local_id === artistId}
                            author={author}
                          />
                        </td>
                        <td
                          className={
                            "work-card-attributions-type-span" +
                            (attr.type === "accepted"
                              ? " type-span-accepted"
                              : " type-span-discarded") +
                            (involvesThisArtist ||
                            (isList && attr.type === "accepted")
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
