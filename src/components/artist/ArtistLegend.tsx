import AttributionCircle from "../work/attributions/AttributionCircle";

export default function ArtistLegend() {
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
        <div className="size-items-cnt">
          <div className="size-legend-item">
            <svg>
              <AttributionCircle type="artist" fill="var(--color-text)" r={4} />
            </svg>
            <span>1</span>
          </div>
          <div className="size-legend-item">
            <svg>
              <AttributionCircle type="artist" fill="var(--color-text)" r={6} />
            </svg>
            <span>3</span>
          </div>
          <div className="size-legend-item">
            <svg>
              <AttributionCircle type="artist" fill="var(--color-text)" r={8} />
            </svg>
            <span>5</span>
          </div>
          <div className="size-legend-item">
            <svg>
              <AttributionCircle
                type="artist"
                fill="var(--color-text)"
                r={10}
              />
            </svg>
            <span>7</span>
          </div>
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
