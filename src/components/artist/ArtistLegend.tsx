import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import { useArtistFilter } from "@/stores/ArtistFilterContext";

export default function ArtistLegend({
  multiplier,
  nucleusOnly = false,
  outerRing = false,
}: {
  multiplier: number;
  // anonymous artists: no tier rings, so position only tells documented from interpreted
  nucleusOnly?: boolean;
  // anonymous artists whose vis has an outer ring for dots with a relation qualifier
  outerRing?: boolean;
}) {
  const {
    sizeValues,
    hiddenSizes,
    handleSizeFilter,
    handleUncertaintyFilter,
    uncertaintyRange,
    acceptanceRange,
    handleAcceptanceFilter,
  } = useArtistFilter();

  // same sqrt encoding (and * 2 for a meaningful size) the vis circles use, so
  // each toggle doubles as a size key
  const diameterOf = (value: number) => Math.sqrt(value) * multiplier * 2;
  // every toggle's circle sits in a slot as tall as the biggest one, so the
  // number labels line up on one row
  const slotPx = Math.max(0, ...sizeValues.map(diameterOf));

  return (
    <div className="artist-legend legend">
      <h2>Legend and filters</h2>
      <div className="legend-items-cnt">
      <div className="acceptance-legend-items">
        <h3>Attribution status</h3>
        <label className="accepted-legend-item label-cnt">
          <input
            type="checkbox"
            className="legend-checkbox"
            checked={!acceptanceRange.has("accepted")}
            onChange={() => handleAcceptanceFilter("accepted")}
          />
          <div className="svg-span-cnt">
          <svg viewBox="0 0 16 16">
            <AttributionCircle
              type="artist"
              fill="var(--color-accepted)"
              r={8}
            />
          </svg>
          <span className="legend-label">Accepted attribution</span>
          </div>
        </label>
        <label className="discarded-legend-item label-cnt">
          <input
            type="checkbox"
            className="legend-checkbox"
            checked={!acceptanceRange.has("discarded")}
            onChange={() => handleAcceptanceFilter("discarded")}
          />
          <div className="svg-span-cnt">
          <svg viewBox="0 0 16 16">
            <AttributionCircle
              type="artist"
              fill="var(--color-discarded)"
              r={8}
            />
          </svg>
          <span className="legend-label">Discarded attribution</span>
          </div>
        </label>
      </div>

      <div className="uncertainty-legend-items">
        <h3>Attribution uncertainty</h3>
        <div className="uncertainty-items-cnt">
          <label className="uncertainty-legend-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={!uncertaintyRange.has("certain")}
              onChange={() => handleUncertaintyFilter("certain")}
            />
            <div className="svg-span-cnt">
            <svg viewBox="0 0 16 16">
              <AttributionCircle type="artist" fill="var(--color-text)" r={8} />
            </svg>
            <span className="legend-label">Confident identification</span>
            </div>
          </label>
          <label className="uncertainty-legend-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"

              checked={!uncertaintyRange.has("probably")}
              onChange={() => handleUncertaintyFilter("probably")}
            />
            <div className="svg-span-cnt">
              <svg viewBox="0 0 16 16">
              <AttributionCircle
                type="artist"
                fill="url(#uncertain-legend-1)"
                r={8}
              />
            </svg>
            <span className="legend-label">Probable identification<br/><span className="legend-xs">(likely the artist)</span></span>
            </div>

          </label>
          <label className="uncertainty-legend-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={!uncertaintyRange.has("uncertain")}
              onChange={() => handleUncertaintyFilter("uncertain")}
            />
            <div className="svg-span-cnt">
            <svg viewBox="0 0 16 16">
              <AttributionCircle
                type="artist"
                fill="url(#uncertain-legend-2)"
                r={8}
              />
            </svg>
            <span className="legend-label">Uncertain identification<br/><span className="legend-xs">(possibly the artist)</span></span>
            </div>
          </label>
        </div>
      </div>

      <div className="size-legend-items">
        <h3>Number of attributions</h3>
        <div
          className="size-toggles"
          style={{ "--size-toggle-slot": `${slotPx}px` } as React.CSSProperties}
        >
          {sizeValues.map((value) => (
            <button
              key={value}
              type="button"
              className="size-toggle"
              aria-pressed={!hiddenSizes.has(value)}
              aria-label={`Works with ${value} attribution${value !== 1 ? "s" : ""}`}
              onClick={() => handleSizeFilter(value)}
            >
              <span className="size-toggle-circle-cnt">
                <span
                  className="size-toggle-circle"
                  style={{ width: diameterOf(value), height: diameterOf(value) }}
                />
              </span>
              <span className="size-toggle-label">{value}</span>
            </button>
          ))}
        </div>
      </div>
<p className="legend-caption"><span className="keyword">Each circle represents a single attribution record</span>. {nucleusOnly ? (
    <>Its <span className="keyword">position</span> shows whether the attribution is based on documentation (above the dashed line) or on interpretation (below it).{outerRing && <> The <span className="keyword">outer ring</span> holds the attributions that carry a relation qualifier (e.g. falso, copia da).</>}</>
  ) : (
    <>Its <span className="keyword">position</span> reflects how closely the artist named in that record relates to this page's artist (from their own hand to looser connections).</>
  )}{" "}
  The <span className="keyword">size</span> reflects the total number of attribution records for the related work. When a work carries more than one attribution naming the artist, it appears as <span className="keyword">several circles</span> that <span className="keyword">get eventually connected</span> on hover or selection.</p>
    </div>
    </div>
    
  );
}
