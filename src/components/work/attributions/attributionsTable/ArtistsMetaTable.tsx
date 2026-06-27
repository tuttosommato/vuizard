import { scaleLinear } from "d3";
import { Fragment, useState } from "react";
import type { AttributionsBundle } from "@/types/attributions";
import type { Author } from "@/types/authors";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "../AttributionCircle";
import { circleTypeFor } from "../utils";
import { colorScale } from "../debateVis/constants";
import useMeasuredSize from "@/hooks/useMeasuredSize";
import ArrowLink from "@/components/ArrowLink";

export default function ArtistsMetaTable({
  artists,
  workTitle,
  currentAttributions,
}: {
  artists: Record<string, Author>;
  workTitle: string;
  currentAttributions: AttributionsBundle;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // We measure the cellWidth of the "Reason reliability" header cell to adapt the visualization of reasons accordingly
  const { ref, width, height } = useMeasuredSize<HTMLTableCellElement>();

  const rankScale = scaleLinear().domain([0, 10]).range([width, 0]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <table
      className="attributions-table"
      aria-label={`Attributional data for ${workTitle}`}
    >
      <thead>
        <tr>
          <th scope="col" className="exp-column"></th>
          <th scope="col" className="type-column">
            Attribution type
          </th>
          <th scope="col" className="artist-column">
            Artist
          </th>
          <th ref={ref} scope="col" className="reliability-column">
            Reason reliability
          </th>
        </tr>
      </thead>
      <tbody>
        {currentAttributions.attributions.map((attr) => {
          const opId = attr.operational_id;
          //const locId = attr.local_id
          const isExpanded = expandedIds.has(opId);
          const r = attr.r_qualifier;
          const u = attr.u_qualifier;
          const currentArtist = artists[attr.local_id];
          const circleType = circleTypeFor(attr);

          return (
            <Fragment key={opId}>
              <tr
                className="visible-row"
                onClick={() => toggle(opId)}
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(opId);
                  }
                }}
              >
                <td className="exp-column">{isExpanded ? "-" : "+"}</td>
                <td
                  className={
                    "type-column" +
                    (attr.type === "accepted" ? " type-accepted" : "")
                  }
                >
                  {attr.type}
                </td>
                <th
                  className={
                    "artist-column" +
                    (attr.type === "accepted" ? " accepted-artist" : "")
                  }
                >
                <ArrowLink target={`/artist/${attr.local_id}`} artistName={attr.author} relation={r} uncertainty={u} isAnonym={attr.is_anonymous} />
                </th>
                <td className="reliability-column">
                  <svg width="100%" height={height}>
                    {u
                      ? attr.reasons.map((reason, i) => (
                          <path
                            key={i}
                            d={uncertaintyLine(
                              [
                                rankScale(0),
                                height / 2,
                                rankScale(reason.rank),
                                height / 2,
                              ],
                              u === "?" ? 0.85 : 0.6,
                            )}
                            stroke="var(--color-text)"
                            strokeWidth={1.5}
                            fill="none"
                          ></path>
                        ))
                      : attr.reasons.map((reason, i) => (
                          <line
                            key={i}
                            x1={rankScale(0)}
                            y1={height / 2}
                            x2={rankScale(reason.rank)}
                            y2={height / 2}
                            stroke="var(--color-text)"
                            strokeWidth={1.5}
                          ></line>
                        ))}

                    {attr.reasons.map((reason, i) => {
                      return (
                        <g
                          key={i}
                          transform={`translate(${rankScale(reason.rank)}, ${height / 2})`}
                        >
                          <AttributionCircle
                            type={circleType}
                            fill={colorScale(attr.type)}
                            r={height / 5.25}
                          />
                          <title>{reason.reason}</title>
                        </g>
                      );
                    })}
                  </svg>
                </td>
              </tr>
              {isExpanded && (
                <tr className="row-details">
                  <td className="exp-column"></td>
                  <td className="type-column"></td>
                  <td className="artist-column">
                    {currentArtist && (
                      <>
                        Artistic school: n.d. <br />
                        External links:{" "}
                        {currentArtist.ulan && (
                          <a
                            href={currentArtist.ulan}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            [ULAN]
                          </a>
                        )}
                        {currentArtist.viaf && (
                          <a
                            href={currentArtist.viaf}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            [VIAF]
                          </a>
                        )}
                        {currentArtist.wikidata && (
                          <a
                            href={currentArtist.wikidata}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            [WIKIDATA]
                          </a>
                        )}
                        {currentArtist.dbpedia && (
                          <a
                            href={currentArtist.dbpedia}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            [DBPEDIA]
                          </a>
                        )}
                      </>
                    )}
                  </td>
                  <td className="reliability-column">
                    {attr.reasons
                      .map((reason) => reason.original_text)
                      .join("; ")}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
