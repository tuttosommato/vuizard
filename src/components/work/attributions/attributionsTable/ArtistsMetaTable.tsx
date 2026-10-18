import { scaleLinear } from "d3";
import { Fragment } from "react";
import type { AttributionsBundle } from "@/types/attributions";
import type { Artist } from "@/types/artists";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import { circleTypeFor } from "@/components/work/attributions/utils";
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
  artists: Record<string, Artist>;
  workTitle: string;
  currentAttributions: AttributionsBundle;
}) {
  // We measure the cellWidth of the "source authoritativeness" header cell to adapt the visualization of reasons accordingly
  const { ref, width, height } = useMeasuredSize<HTMLTableCellElement>();

  const radius = height / 5.85;

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
            Source authoritativeness
          </th>
        </tr>
      </thead>
      <tbody>
        {currentAttributions.attributions.map((attr) => {
          const attrId = attr.attribution_id;
          const isExpanded = selectedIds.has(attrId);
          const circleType = circleTypeFor(attr);
          const u = attr.authors.some((a) => a.u_qualifier);
          const authorsLength = attr.authors.length;

          return (
            <Fragment key={attr.attribution_id}>
              {attr.authors.map((author, idx) => {
                const coArtist = artists[author.local_id];
                return (
                  <>
                    <tr
                      key={attrId + "-" + author.local_id}
                      className={`visible-row ${highlightedId === attrId ? "tr-highlighted" : ""}${idx + 1 === authorsLength ? " last-row" : ""}${authorsLength === 1 ? " only-row" : ""}`}
                      onMouseEnter={() => setHighlightedId(attrId)}
                      onMouseLeave={() => setHighlightedId(null)}
                      onClick={() => {
                        toggle(attrId);
                        if (isExpanded) setHighlightedId(null);
                      }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(attrId);
                        }
                      }}
                    >
                      <td className="exp-column">
                        {idx === 0 && <ExpandArrow isExpanded={isExpanded} />}
                      </td>
                      <td
                        className={
                          "type-column" +
                          (attr.type === "accepted" ? " type-accepted" : "")
                        }
                      >
                        {idx === 0 && attr.type}
                      </td>
                      <th
                        className={
                          "artist-column" +
                          (attr.type === "accepted" ? " accepted-artist" : "")
                        }
                      >
                        <div className="attribution-author">
                          <ArrowLink
                            onMouseEnter={() => setHighlightedId(null)}
                            onMouseLeave={() => setHighlightedId(attrId)}
                            author={author}
                          />
                        </div>
                      </th>
                      <td className="reliability-column">
                        {idx === 0 && (
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
                                      u ? 0.85 : 0.6,
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
                        )}
                      </td>
                    </tr>
                    {isExpanded && coArtist && (
                      <tr
                        className={`artist-detail-row ${idx + 1 === authorsLength ? "last-detail-row" : ""}`}
                        aria-expanded={isExpanded}
                        key={attrId + "-" + author.local_id + "-details"}
                        onMouseEnter={() => setHighlightedId(attrId)}
                        onMouseLeave={() => setHighlightedId(null)}
                        onClick={() => {
                          toggle(attrId);
                          if (isExpanded) setHighlightedId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(attrId);
                          }
                        }}
                      >
                        <td className="exp-column details-cell"></td>
                        <td className="type-column details-cell"></td>
                        <td className="artist-column details-cell">
                          {[
                            ...coArtist.pseudonyms,
                            ...coArtist.pseudonym_alts,
                            ...coArtist.variant_names,
                          ].length > 0 && (
                            <div className="artist-names-cnt">
                              Also known as:{" "}
                              <span className="names-list">
                                {[
                                  ...coArtist.pseudonyms,
                                  ...coArtist.pseudonym_alts,
                                  ...coArtist.variant_names,
                                ].join(", ")}
                              </span>
                            </div>
                          )}
                                                    {coArtist.cultural_context_info?.declarations.length >
                            0 && (
                            <div className="artist-context-cnt">
                              Cultural context:{" "}
                              <span className="context-list"> {"scuola "}
                                {coArtist.cultural_context_info.declarations
                                  .map((d) => {
                                    if (d.chain.length === 0) return "n.d.";
                                    if (d.chain.length === 1) return d.chain[0];
                                    if (d.chain.length === 2)
                                      return d.chain[0] + ` (${d.chain[1]})`;
                                    return d.chain[0] + ` (${d.chain[2]})`;
                                  })
                                  .join("; ")}
                              </span>
                            </div>
                          )}
                          {(() => {
                            const links = [
                              { label: "ULAN", href: coArtist.ulan },
                              { label: "VIAF", href: coArtist.viaf },
                              {
                                label: "Wikidata",
                                href: coArtist.wikidata,
                              },
                              { label: "DBpedia", href: coArtist.dbpedia },
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
                        <td className="reliability-column details-cell">
                          {idx === 0 &&
                            attr.reasons.map((reason, i) => (
                              <Fragment key={i}>
                                {i > 0 && (
                                  <>
                                    ;<br />
                                  </>
                                )}
                                <span className="reason-label">
                                  {reason.reason}
                                </span>
                                <br />
                                <span className="reason-original-text">
                                  {reason.original_text}
                                </span>
                              </Fragment>
                            ))}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
