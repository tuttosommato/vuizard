import { useOverviewFilter } from "@/stores/OverviewFilterContext";
import { useEffect, useMemo, useState } from "react";
import { getCoOccurrenceColor } from "@/utils/coOccurrenceColor";

// The two variables the circles show, drawn as rows of examples: an artist's number of
// attributions as the size (diameters in px, only meant to grow), and, for the artists who
// appear with a selected one, the acceptance rate of what they share as the colour, from
// all discarded to all accepted, in one size.
const SIZE_EXAMPLES = [3, 5, 8, 11, 15, 19, 24];
const COLOUR_EXAMPLES = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1];
const COLOUR_EXAMPLE_SIZE = 14;

export default function PackingLegend() {
  const {
    tempRange,
    setTempRange,
    tempBounds,
    present,
    noDatesFilter,
    handleNoDatesFilter,
    query,
    setQuery,
    matchingIds,
  } = useOverviewFilter();

  // the box answers at once; the filter follows a moment after the typing stops, since it
  // re-draws thousands of circles
  const [text, setText] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 150);
    return () => clearTimeout(timer);
  }, [text, setQuery]);
  const [min] = tempBounds;
  const formatUpperLabel = (value: number) =>
    value === present ? "Present" : String(value - 1);

  const steps = useMemo(() => {
    const out: number[] = [];
    for (let v = min; v <= present; v += 100) out.push(v);
    return out;
  }, [min, present]);

  return (
    <div className="packing-legend legend">
      {/* Filters */}
      <div className="legend-items-cnt">
        <div className="search-legend-items">
          <h3>Filter by name</h3>
          <input
            type="search"
            className="legend-search"
            placeholder="Search artists…"
            aria-label="Search artists by name"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {matchingIds && (
            <span className="legend-label">
              {matchingIds.size} {matchingIds.size === 1 ? "artist" : "artists"}{" "}
              match
            </span>
          )}
        </div>
        <div className="temp-legend-items">
          <h3>Filter by century</h3>
          <label className="no-dates-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={noDatesFilter}
              onChange={() => handleNoDatesFilter(!noDatesFilter)}
            />
            <div className="svg-span-cnt">
              <span className="legend-label">
                Include artists with unknown dating
              </span>
            </div>
          </label>
          <div className="temp-range-cnt">
            <div className="temp-range-slider">
              <div className="temp-range-track" />
              <div className="temp-range-ticks">
                {steps.map((v) => (
                  <div
                    key={v}
                    className="temp-range-tick"
                    style={{ left: `${((v - min) / (present - min)) * 100}%` }}
                  />
                ))}
              </div>
              <div
                className="temp-range-fill"
                style={{
                  left: `${((tempRange[0] - min) / (present - min)) * 100}%`,
                  right: `${100 - ((tempRange[1] - min) / (present - min)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={min}
                max={present}
                step={100}
                value={tempRange[0]}
                onChange={(e) =>
                  setTempRange([
                    Math.min(Number(e.target.value), tempRange[1] - 100),
                    tempRange[1],
                  ])
                }
                className="temp-range-input"
              />
              <input
                type="range"
                min={min}
                max={present}
                step={100}
                value={tempRange[1]}
                onChange={(e) =>
                  setTempRange([
                    tempRange[0],
                    Math.max(Number(e.target.value), tempRange[0] + 100),
                  ])
                }
                className="temp-range-input"
              />
            </div>
            <div className="temp-range-labels">
              <span className="temp-range-label">{tempRange[0]}</span>
              <span className="temp-range-label">
                {formatUpperLabel(tempRange[1])}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <h2 className="legend-section-gap">Legend</h2>
      <div className="legend-items-cnt">
        <div className="circle-legend-item">
          <span className="legend-label">Attributions to the artist</span>
          <div className="circle-legend-block">
            <div className="circle-legend-circles" aria-hidden="true">
              {SIZE_EXAMPLES.map((size) => (
                <span
                  key={size}
                  className="circle-legend-circle"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: "var(--color-text)",
                  }}
                />
              ))}
            </div>
            <div className="circle-legend-ends">
              <span>fewer</span>
              <span>more</span>
            </div>
          </div>
        </div>
        <div className="circle-legend-item">
          <span className="legend-label">Acceptance rate in co-occurrence</span>
          <div className="circle-legend-block">
            <div className="circle-legend-circles" aria-hidden="true">
              {COLOUR_EXAMPLES.map((ratio) => (
                <span
                  key={ratio}
                  className="circle-legend-circle"
                  style={{
                    width: COLOUR_EXAMPLE_SIZE,
                    height: COLOUR_EXAMPLE_SIZE,
                    backgroundColor: getCoOccurrenceColor(ratio),
                  }}
                />
              ))}
            </div>
            <div className="circle-legend-ends">
              <span>discarded</span>
              <span>accepted</span>
            </div>
          </div>
          <p className="circle-legend-note">
            When a coloured artist co-occurs with the selected one, its colour
            tends towards <span className="legend-accepted">green</span> when it
            was accepted in spite of the selected artist, and towards{" "}
            <span className="legend-discarded">red</span> when it was discarded,
            either in favour of the selected artist or together with it. A
            colour in between means it was about as often accepted as discarded.
          </p>
        </div>
      </div>
      {/* Legend caption */}
      <p className="legend-caption">
        <span className="keyword">Hover</span> an artist to see who appears with
        them in attributions, and <span className="keyword">select</span> it to
        keep that view, with the colour showing the{" "}
        <span className="keyword">acceptance rate</span> of what they share.
        Select <span className="keyword">more than one</span> connected artist
        to also list the <span className="keyword">works of art</span> where
        they were all attributed.
      </p>
    </div>
  );
}
