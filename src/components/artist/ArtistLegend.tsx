import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import { useArtistFilter } from "@/stores/ArtistFilterContext";

export default function ArtistLegend({ multiplier }: { multiplier: number }) {
  const {
    sizeRange,
    setSizeRange,
    sizeBounds,
    handleUncertaintyFilter,
    uncertaintyRange,
    acceptanceRange,
    handleAcceptanceFilter,
  } = useArtistFilter();
  const [min, max] = sizeBounds;

  const thumbSizePx = (value: number) => Math.sqrt(value) * 8;

  const labelLeft = (value: number) => {
    // computes the offset for the changing size input thumb to place the label correctly under the thumb
    const percent = (value - min) / (max - min || 1);
    const size = thumbSizePx(value);
    return `calc(${size / 2}px + (100% - ${size}px) * ${percent})`;
  };

  return (
    <div className="artist-legend">
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
        <div className="size-range-slider">
          <div className="size-range-track" />
          <div
            className="size-range-fill"
            style={{
              left: `${((sizeRange[0] - min) / (max - min)) * 100}%`,
              right: `${100 - ((sizeRange[1] - min) / (max - min)) * 100}%`,
            }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={sizeRange[0]}
            onChange={(e) =>
              setSizeRange([
                Math.min(Number(e.target.value), sizeRange[1]),
                sizeRange[1],
              ])
            }
            className="size-range-input"
            style={
              {
                "--thumb-size": `${Math.sqrt(sizeRange[0]) * multiplier * 2}px`, // * 2 for meaningful size
              } as React.CSSProperties
            }
          />
          <input
            type="range"
            min={min}
            max={max}
            value={sizeRange[1]}
            onChange={(e) =>
              setSizeRange([
                sizeRange[0],
                Math.max(Number(e.target.value), sizeRange[0]),
              ])
            }
            className="size-range-input"
            style={
              {
                "--thumb-size": `${Math.sqrt(sizeRange[1]) * multiplier * 2}px`,
              } as React.CSSProperties
            }
          />
        </div>
        <div className="size-range-labels">
          <span
            className="size-range-label"
            style={
              {
                left: labelLeft(sizeRange[0]),
                "--thumb-size": `${Math.sqrt(sizeRange[0]) * 8}px`,
              } as React.CSSProperties
            }
          >
            {sizeRange[0]}
          </span>
          <span
            className="size-range-label"
            style={
              {
                left: labelLeft(sizeRange[1]),
                "--thumb-size": `${Math.sqrt(sizeRange[1]) * 8}px`,
              } as React.CSSProperties
            }
          >
            {sizeRange[1]}
          </span>
        </div>
      </div>
<p className="legend-caption"><span className="keyword">Each circle represents a single attribution record</span>. Its <span className="keyword">position</span> reflects how closely the artist named in that record relates to this page's artist (from their own hand to looser connections). The <span className="keyword">size</span> reflects the total number of attribution records for the related work. When a work carries more than one attribution naming the artist, it appears as <span className="keyword">several circles</span> that <span className="keyword">get eventually connected</span> on hover or selection.</p>
    </div>
    </div>
    
  );
}
