import { useOverviewFilter } from "@/stores/OverviewFilterContext";
import { useEffect, useMemo, useState } from "react";

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
      <h2>Filters</h2>
      <div className="legend-items-cnt">
        <div className="search-legend-items">
          <h3>By name</h3>
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
          <h3>By century</h3>
          <label className="no-dates-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={noDatesFilter}
              onChange={() => handleNoDatesFilter(!noDatesFilter)}
            />
            <div className="svg-span-cnt">
              <span className="legend-label">Artists with no dates</span>
            </div>
          </label>
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

        <p className="legend-caption">
          <span className="keyword">
            Each artist may belong to one or more cultural contexts that define
            their artistic practice
          </span>
          . Selecting one artist will show co-occurring artists in their
          cultural contexts, uncovering relations and showing their
          co-occurrence quantity and accetance rate when both are disputed.
          Selecting more than one connected artist will also show the works of
          art where they were attributed.{" "}
        </p>
      </div>
    </div>
  );
}
