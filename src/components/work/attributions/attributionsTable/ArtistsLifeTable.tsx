import type { Artist } from "@/types/artists";
import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear, extent } from "d3";
import { labelsFontSize } from "@/components/work/attributions/debateVis/constants";
import { colorScale } from "@/utils/constants.ts";
import type { Work } from "@/types/works";
import useMeasuredSize from "@/hooks/useMeasuredSize";
import TimeSpan from "@/components/work/attributions/attributionsTable/TimeSpan";
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
  artists: Record<string, Artist>;
  currentAttributions: AttributionsBundle;
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
}) {
  const { ref, width, height } = useMeasuredSize<HTMLTableCellElement>();

  const { selectedIds, toggle } = useCrossSelection();
  const { highlightedId, setHighlightedId } = useHighlight();

  const domain = useMemo(() => {
    const values = currentAttributions.attributions.flatMap((attr) =>
      attr.authors.flatMap((author) => {
        const artist = artists[author.local_id];
        if (!artist.life) return [];
        return [
          ...(artist.life.start ? [+artist.life.start] : []),
          ...(artist.life.end ? [+artist.life.end] : []),
        ];
      }),
    );

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
          <th scope="col" className="uncertain-column"></th>
          <th scope="col" className="dating-type-column">
            Type
          </th>
          <th ref={ref} scope="col">
            Biographical dates
          </th>
        </tr>
      </thead>
      <tbody>
        {currentAttributions.attributions.map((attr) => {
          return (
            <tr
              className={
                highlightedId === attr.attribution_id ? "tr-highlighted" : ""
              }
              key={attr.attribution_id}
              onMouseEnter={() => setHighlightedId(attr.attribution_id)}
              onMouseLeave={() => setHighlightedId(null)}
              onClick={() => toggle(attr.attribution_id)}
              aria-selected={selectedIds.has(attr.attribution_id)}
            >
              <th
                className={
                  "artist-column" +
                  (attr.type === "accepted" ? " accepted-artist" : "")
                }
              >
                {attr.authors.map((author) => {
                  return (
                    <div className="arrow-link-cnt">
                      <ArrowLink
                        onMouseEnter={() => setHighlightedId(null)}
                        onMouseLeave={() =>
                          setHighlightedId(attr.attribution_id)
                        }
                        author={author}
                      />
                    </div>
                  );
                })}
              </th>

              <td>
                {attr.authors.map((author) => {
                  const artist = artists[author.local_id];
                  if (author.r_qualifier)
                    return (
                      <QuestionMarkTooltip
                        author={artist.name}
                        qualifier={author.r_qualifier}
                      />
                    );
                })}
              </td>
              <td className="dating-type-column">
                {attr.authors.map((author) => {
                  const artist = artists[author.local_id];
                  return (
                    <span>
                      {author.is_anonymous ? "approx. century" : artist.life.type}
                    </span>
                  );
                })}
              </td>
              <td className="dating-column">
                {attr.authors.map((author) => {
                  const artist = artists[author.local_id];
                  const life = artist.life;

                  if (life.start) {
                    return (
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
                          from={+life.start}
                          to={life.end ? +life.end : +life.start}
                          fromQ={life.start_approx}
                          toQ={life.end ? life.end_approx : ""}
                          scale={timeScale}
                          height={height}
                          barHeight={author.is_anonymous ? barHeight * 0.6 : barHeight}
                          fillOpacity={author.is_anonymous ? 0.5 : 1}
                          fill={colorScale(attr.type)}
                          raw={author.is_anonymous ? life.raw : ''}
                          fontSize={barHeight}
                        />
                      </svg>
                    );
                  } else {
                    return life.raw;
                  }
                })}
              </td>
            </tr>
          );
        })}

        {/* Work of art dating rows */}
        <tr className="dating-row accepted-dating-row">
          <th className="artist-column work-dating">
            Work creation (accepted)
          </th>
          <td></td>
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
                      raw={''}
                    />
                  </Fragment>
                </>
              ))}
            </svg>
          </td>
        </tr>
        {discardedDating.length > 0 && (
          <tr className="dating-row discarded-dating-row">
            <th className="artist-column work-dating-discarded">
              Work creation (discarded)
            </th>
            {/* the same four cells as the other rows: the dates go in the last one */}
            <td></td>
            <td></td>
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
                    raw={''}
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
