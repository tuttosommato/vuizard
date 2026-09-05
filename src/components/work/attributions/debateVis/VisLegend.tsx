import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import type { ReactNode } from "react";

const w = 14;
const h = 14;
const rB = 7;
/* const rS = 5; */ // for mean reliability dot (now not used)

type LegendItem = {
  el: ReactNode;
  label: string;
  key: string;
  description?: string; // optional second line
};

function ColorDot({ fill }: { fill: string }) {
  return (
    <svg viewBox={`-${w / 2} -${h / 2} ${w} ${h}`} width={w} height={h}>
      <circle r={rB} fill={fill} />
    </svg>
  );
}

/* function MeanReliabilityDot() {
  return (
    <svg viewBox={`-${w / 2} -${h / 2} ${w} ${h}`} width={w} height={h}>
      <circle
        r={rS}
        fill="var(--color-text)"
        stroke="var(--color-text)"
        strokeWidth={0.75}
        fillOpacity={0.1}
        strokeOpacity={0.7}
      />
    </svg>
  )
} */

function Symbolel({
  type,
}: {
  type: "artist" | "anonym" | "recognised" | "unrecognised";
}) {
  return (
    <svg
      viewBox={`-${w / 2} -${h / 2} ${w} ${h}`}
      width={w}
      height={h}
      overflow="visible"
    >
      <AttributionCircle type={type} fill={"var(--color-text)"} r={rB} />
    </svg>
  );
}

function Lineel({ kind }: { kind: "confidence" | "uncertainty" | "strong" }) {
  const stroke = "var(--color-text)";
  return (
    <svg viewBox="0 0 50 16" width={40} height={16}>
      {kind === "confidence" ? (
        <line x1={4} y1={8} x2={46} y2={8} stroke={stroke} strokeWidth={1.5} />
      ) : (
        <path
          d={uncertaintyLine([4, 8, 46, 8], kind === "strong" ? 0.6 : 0.85)}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

function Curveel({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 40 40" width={40} height={40}>
      <text
        x={0}
        y={4}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={7}
        fill={"var(--color-text)"}
      >
        {"Artist"}
      </text>
      <path
        d="M 18,4 C 40,4 40,36 18,36"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        opacity={0.7}
      />
      <text
        x={0}
        y={36}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={7}
        fill={"var(--color-text)"}
      >
        {"Artist"}
      </text>
    </svg>
  );
}

const sections: LegendItem[][] = [
  [
    {
      el: <ColorDot fill="var(--color-accepted)" />,
      label: "Accepted attribution",
      key: "accepted",
    },
    {
      el: <ColorDot fill="var(--color-discarded)" />,
      label: "Discarded attribution",
      key: "discarded",
    },
    /*     {
      el: <MeanReliabilityDot />,
      label: "Mean reliability for the artist in the dataset",
    }, */
  ],
  [
    {
      el: <Symbolel type="artist" />,
      label: "Recognised artist",
      key: "artist",
    },
    {
      el: <Symbolel type="recognised" />,
      label: "Recognised artist and collaborating anonyms",
      key: "recognised",
    },
    {
      el: <Symbolel type="unrecognised" />,
      label: "Anonymous with a connection to a recognised artist",
      key: "unrecognised",
    },
    {
      el: <Symbolel type="anonym" />,
      label: "Generic anonymous artist",
      key: "anonym",
    },
  ],
  [
    {
      el: <Lineel kind="confidence" />,
      label: "Confident identification",
      key: "confident",
    },
    {
      el: <Lineel kind="uncertainty" />,
      label: "Probable identification",
      description: "(likely the artist)",
      key: "probable",
    },
    {
      el: <Lineel kind="strong" />,
      label: "Uncertain identification",
      description: "(possibly the artist)",
      key: "uncertain",
    },
  ],
  [
    {
      el: <Curveel stroke="var(--color-text)" />,
      label: "Similar artists",
      description:
        "(artists that frequently co-occur in attributions for the same works)",
      key: "similar",
    },
    {
      el: <Curveel stroke="var(--color-link-1)" />,
      label: "Same recognised artist",
      key: "same-artist",
    },
    {
      el: <Curveel stroke="var(--color-link-2)" />,
      label: "Artist linked to their anonyms",
      key: "artist-anonym",
    },
  ],
];

export default function VisLegend({ keys }: { keys: string[] }) {
  return (
    <div className="vis-legend">
      {sections.map((row, i) => (
        <div key={i} className="vis-legend-col">
          {row.map(
            (item, j) =>
              keys.includes(item.key) && (
                <div key={j} className="vis-legend-item">
                  <div className="vis-legend-icon">{item.el}</div>
                  <div className="vis-legend-label">
                    {item.label}
                    {item.description && (
                      <span className="vis-legend-description">
                        {" "}
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              ),
          )}
        </div>
      ))}
    </div>
  );
}
