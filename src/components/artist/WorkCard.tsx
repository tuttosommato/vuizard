import type { WorkItem } from "@/types/artists";
import { BASE_URL } from "@/utils/constants.ts";
import { formatDating } from "@/utils/formatDating";
import { useState } from "react";
import ArrowLink from "@/components/ArrowLink";

interface WorkCardProps {
  workItem: WorkItem;
  artistId: string;
}

export default function WorkCard({ workItem, artistId }: WorkCardProps) {
  const [expanded, setExpanded] = useState(false);
  const acceptedDating = workItem.work?.dating
    .filter((d) => d.type === "accepted")
    .map(formatDating);

  return (
    <div
      className={"work-card" + (expanded ? " work-card-expanded" : "")}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="work-card-upper">
        <div className="work-card-img-container">
          <img
            src={BASE_URL + workItem.work?.photos[0].link}
            alt={workItem.work?.title || "Untitled"}
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
            <p>Expand attributions</p>
            <span>{expanded ? "−" : "+"}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="work-card-attributions-expanded">
          {workItem.attributions ? (
            <ul>
              {Object.values(workItem.attributions.attributions).map((attr) => {
                return (
                  <li key={attr.local_id}>
                    <ArrowLink
                      target={`/artist/${attr.local_id}`}
                      artistName={attr.author}
                      relation={attr.r_qualifier}
                      uncertainty={attr.u_qualifier}
                      isAnonym={attr.is_anonymous || attr.local_id === artistId}
                    />
                    <span
                      className={
                        "work-card-attributions-type-span" +
                        (attr.type === "accepted"
                          ? " type-span-accepted"
                          : " type-span-discarded")
                      }
                    >
                      {attr.type}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
