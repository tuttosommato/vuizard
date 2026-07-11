import AttributionCircle from "../work/attributions/AttributionCircle";
import { useArtistFilter } from "@/stores/ArtistFilterContext";

export default function ArtistLegend({ multiplier }: {multiplier: number}) {
const { sizeRange, setSizeRange, sizeBounds } = useArtistFilter();
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
      <div className="acceptance-legend-items">
        <div className="accepted-legend-item">
          <svg>
            <AttributionCircle
              type="artist"
              fill="var(--color-accepted)"
              r={8}
            />
          </svg>
          <span>Accepted attributions</span>
        </div>
        <div className="discarded-legend-item">
          <svg>
            <AttributionCircle
              type="artist"
              fill="var(--color-discarded)"
              r={8}
            />
          </svg>
          <span>Discarded attributions</span>
        </div>
      </div>

      <div className="size-legend-items">
        <span>Number of attributions</span>
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

      <div className="uncertainty-legend-items">
        <span>Uncertainty</span>
        <div className="uncertainty-items-cnt">
          <div className="uncertainty-legend-item">
            <svg>
              <AttributionCircle
                type="artist"
                fill="url(#uncertain-legend-1)"
                r={8}
              />
            </svg>
            <span>Less uncertain</span>
          </div>
          <div className="uncertainty-legend-item">
            <svg>
              <AttributionCircle
                type="artist"
                fill="url(#uncertain-legend-2)"
                r={8}
              />
            </svg>
            <span>More uncertain</span>
          </div>
        </div>
      </div>
    </div>
  );
}
