type SymbolProps = {
  type: "artist" | "anonym" | "recognised" | "unrecognised";
  fill: string;
  r: number;
};
export default function AttributionCircle({ type, fill, r }: SymbolProps) {
  switch (type) {
    case "artist":
      return <circle r={r} fill={fill} />;

    case "anonym":
      return (
        <g>
          <circle r={r} fill={fill} />
          <circle r={r - r / 4} fill="var(--color-bg)" />
        </g>
      );

    case "recognised":
      return (
        <g>
          <circle r={r} fill={fill} />
          <circle cx={-r - 4} cy={-r - 2} r={r / 2} fill={fill} />
          <circle cx={-r - 4} cy={-r - 2} r={r / 3} fill="var(--color-bg)" />
        </g>
      );

    case "unrecognised":
      return (
        <g>
          <circle r={r} fill={fill} />
          <circle r={r - r / 4} fill="var(--color-bg)" />
          <circle r={r - r / 1.5} fill={fill} />
        </g>
      );
  }
}
