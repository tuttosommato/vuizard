import { scaleLinear } from "d3";
import { Fragment } from "react";
import type { AttributionsBundle } from "@/types/attributions";
import type { Author } from "@/types/artists";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "../AttributionCircle";
import { circleTypeFor } from "../utils";
import { colorScale } from "@/utils/constants.ts";
import useMeasuredSize from "@/hooks/useMeasuredSize";
import ArrowLink from "@/components/ArrowLink";
import ExpandArrow from "@/components/ExpandArrow";
import { useCrossSelection } from "@/stores/CrossSelectionContext";
import { useHighlight } from "@/stores/HighlightContext";

export default function ArtistsMetaTable({
  artists,
  workTitle,
  currentAttributions,
}: {
  artists: Record<string, Author>;
  workTitle: string;
  currentAttributions: AttributionsBundle;
}) {
  // We measure the cellWidth of the "Reason reliability" header cell to adapt the visualization of reasons accordingly
  const { ref, width, height } = useMeasuredSize<HTMLTableCellElement>();

  const radius = height / 5.25;

  const rankScale = scaleLinear().domain([0, 11]).range([width, radius]);

  const { selectedIds, toggle } = useCrossSelection();
  const { highlightedId, setHighlightedId } = useHighlight();

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
          const isExpanded = selectedIds.has(opId);
          const r = attr.r_qualifier;
          const u = attr.u_qualifier;
          const currentArtist = artists[attr.local_id];
          const circleType = circleTypeFor(attr);

          return (
            <Fragment key={opId}>
              <tr
                className={`visible-row ${highlightedId === opId ? "tr-highlighted" : ""}`}
                onMouseEnter={() => setHighlightedId(opId)}
                onMouseLeave={() => setHighlightedId(null)}
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
                <td className="exp-column">
                  <ExpandArrow isExpanded={isExpanded} />
                </td>
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
                  <ArrowLink
                    target={`/artist/${attr.local_id}`}
                    artistName={currentArtist?.preferred_name || attr.author}
                    relation={r}
                    uncertainty={u}
                    isAnonym={attr.is_anonymous}
                    onMouseEnter={() => setHighlightedId(null)}
                    onMouseLeave={() => setHighlightedId(opId)}
                  />
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
                            r={radius}
                          />
                          <title>{reason.reason}</title>
                        </g>
                      );
                    })}
                  </svg>
                </td>
              </tr>
              {isExpanded && (
                <tr className="row-details" onClick={() => toggle(opId)}>
                  <td className="exp-column"></td>
                  <td className="type-column"></td>
                  <td className="artist-column">
                    {currentArtist && currentArtist.other_names.length > 0 && (
                      <div className="artist-names-cnt">
                        Also known as:{" "}
                        <span className="names-list">
                          {currentArtist.other_names.join(", ")}
                        </span>
                      </div>
                    )}
                    {currentArtist &&
                      (() => {
                        const links = [
                          { label: "ULAN", href: currentArtist.ulan },
                          { label: "VIAF", href: currentArtist.viaf },
                          { label: "Wikidata", href: currentArtist.wikidata },
                          { label: "DBpedia", href: currentArtist.dbpedia },
                        ].filter((l) => l.href);
                        return links.length > 0 ? (
                          <div className="artist-links-cnt">
                            External links:{" "}
                            {links.map((l, i) => (
                              <span key={l.label}>
                                <a
                                  href={l.href!}
                                  onClick={(e) => e.stopPropagation()}
                                  className="in-text-a"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {l.label}
                                </a>
                                {i < links.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                  </td>
                  <td className="reliability-column">
                    {attr.reasons.map((reason, i) => (
                      <Fragment key={i}>
                        {i > 0 && (
                          <>
                            ;<br />
                          </>
                        )}
                        <span className="reason-label">{reason.reason}</span>
                        <br />
                        <span className="reason-original-text">
                          {reason.original_text}
                        </span>
                      </Fragment>
                    ))}
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
