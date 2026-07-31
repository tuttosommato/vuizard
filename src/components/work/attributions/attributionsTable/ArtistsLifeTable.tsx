import type { Author } from "@/types/authors";
import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear, extent } from "d3";
import { labelsFontSize } from "../debateVis/constants";
import { colorScale } from "@/utils/constants.ts";
import type { Work } from "@/types/works";
import useMeasuredSize from "@/hooks/useMeasuredSize";
import TimeSpan from "./TimeSpan";
import { Fragment, useMemo } from "react";
import ArrowLink from "@/components/ArrowLink";
import QuestionMarkTooltip from "@/components/QuestionMarkTooltip";
import { useCrossSelection } from "@/stores/CrossSelectionContext";
import { useHighlight } from "@/stores/HighlightContext";

const barHeight = labelsFontSize / 1.1;

export default function ArtistsLifeTable({
  artists,
  currentAttributions,
  acceptedDating,
  discardedDating,
}: {
  artists: Record<string, Author>;
  currentAttributions: AttributionsBundle;
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
}) {
  const { ref, width, height } = useMeasuredSize<HTMLTableCellElement>();

  const {selectedIds, toggle} = useCrossSelection();
  const { highlightedId, setHighlightedId } = useHighlight();

  const domain = useMemo(() => {
    const values = currentAttributions.attributions.flatMap((attr) => {
      const artist = artists[attr.local_id];
      return artist?.life ? [+artist.life.birth, +artist.life.death] : [];
    });
    acceptedDating.forEach((d) => {
      if (d.from) values.push(+d.from);
      if (d.to) values.push(+d.to);
    });
    discardedDating.forEach((d) => {
      if (d.from) values.push(+d.from);
      if (d.to) values.push(+d.to);
    });
    return extent(values) as [number, number];
  }, [
    artists,
    currentAttributions.attributions,
    acceptedDating,
    discardedDating,
  ]);

  const padding = 10;

  const timeScale = useMemo(() => {
    return scaleLinear()
      .domain([(domain[0] ?? 0) - padding, (domain[1] ?? 1) + padding])
      .nice()
      .range([0, width]);
  }, [domain, width]);

  return (
    <table
      className="artists-life-table"
      aria-label="Life data of attributed artists"
    >
      <thead>
        <tr>
          <th scope="col" className="artist-column">
            Artist
          </th>
          <th scope="col" className="uncertain-column">
          </th>
          <th ref={ref} scope="col">
            Life data
          </th>
        </tr>
      </thead>
      <tbody>
        {currentAttributions.attributions.map((attr) => {
          const artist = artists[attr.local_id];
          const life = artist?.life;
          return (
            <tr
            className={highlightedId === attr.operational_id ? "tr-highlighted" : ""}
            key={attr.operational_id}
            onMouseEnter={() => setHighlightedId(attr.operational_id)}
            onMouseLeave={() => setHighlightedId(null)}
            onClick={() => toggle(attr.operational_id)}
            aria-selected={selectedIds.has(attr.operational_id)}>
              <th className={"artist-column" + (attr.type === "accepted" ? " accepted-artist" : "")}>
                <ArrowLink
                target={`/artist/${attr.local_id}`}
                artistName={artist?.preferred_name || attr.author}
                isAnonym={attr.is_anonymous}
                onMouseEnter={() => setHighlightedId(null)}
                onMouseLeave={() => setHighlightedId(attr.operational_id)}
                />
              </th>
              <td>
                {attr.r_qualifier && <QuestionMarkTooltip author={artist?.preferred_name || attr.author} qualifier={attr.r_qualifier} />}
              </td>
              <td className="dating-column">
                {life ? (
                  <svg width="100%" height={height}>
                    {acceptedDating.map(
                      (d, i) =>
                        d.from &&
                        d.to && (
                          <Fragment key={i}>
                            <line
                              x1={timeScale(+d.from)}
                              y1={0}
                              x2={timeScale(+d.from)}
                              y2={height}
                              stroke="var(--color-text)"
                              strokeWidth={1}
                              strokeDasharray="4 4"
                              opacity={0.4}
                            />
                            <line
                              x1={timeScale(+d.to)}
                              y1={0}
                              x2={timeScale(+d.to)}
                              y2={height}
                              stroke="var(--color-text)"
                              strokeWidth={1}
                              strokeDasharray="4 4"
                              opacity={0.4}
                            />
                          </Fragment>
                        ),
                    )}

                    <TimeSpan
                      from={+life.birth}
                      to={+life.death}
                      fromQ={life.birth_qualifier}
                      toQ={life.death_qualifier}
                      scale={timeScale}
                      height={height}
                      barHeight={barHeight}
                      fill={colorScale(attr.type)}
                    />
                  </svg>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          );
        })}
        {/* Work of art dating rows */}
        <tr className="dating-row accepted-dating-row">
          <th className="artist-column work-dating">Work creation (accepted)</th>
          <td></td>
          <td>
            <svg width="100%" height={height}>
              {acceptedDating.map((d, i) => (
                <>
                  <Fragment key={i}>
                    <line
                      x1={timeScale(+d.from)}
                      y1={0}
                      x2={timeScale(+d.from)}
                      y2={height / 2 + barHeight / 2}
                      stroke="var(--color-text)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.4}
                    />
                    <line
                      x1={timeScale(+d.to)}
                      y1={0}
                      x2={timeScale(+d.to)}
                      y2={height / 2 + barHeight / 2}
                      stroke="var(--color-text)"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.4}
                    />

                    <TimeSpan
                      from={+d.from}
                      to={+d.to}
                      fromQ={d.from_approximation || ""}
                      toQ={d.to_approximation || ""}
                      scale={timeScale}
                      height={height}
                      barHeight={barHeight}
                      fill={"var(--color-text)"}
                    />
                  </Fragment>
                </>
              ))}
            </svg>
          </td>
        </tr>
        {discardedDating.length > 0 && (
          <tr className="dating-row discarded-dating-row">
            <th className="artist-column work-dating-discarded">Work creation (discarded)</th>
            <td>
              <svg width="100%" height={height}>
                {discardedDating.map((d) => (
                  <TimeSpan
                    from={+d.from}
                    to={+d.to}
                    fromQ={d.from_approximation || ""}
                    toQ={d.to_approximation || ""}
                    scale={timeScale}
                    height={height}
                    barHeight={barHeight}
                    fill={"var(--color-text)"}
                    fillOpacity={0.5}
                  />
                ))}
              </svg>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
