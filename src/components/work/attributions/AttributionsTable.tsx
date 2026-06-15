import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear } from "d3-scale";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle.tsx";


type TableProps = {
    currentAttributions: AttributionsBundle;
    workTitle: string;
};


const CELLWIDTH = 200;
const CELLHEIGHT = 40;
const PADDING = 5;

export default function AttributionsTable({ currentAttributions, workTitle }: TableProps) {
    const rankScale = scaleLinear()
        .domain([0, 10])
        .range([CELLWIDTH - PADDING, PADDING]);

    return (
        <table
            className="attributions-table"
            aria-label={`Attributional data for ${workTitle}`}
        >
            <thead>
                <tr>
                    <th scope="col">Attribution type</th>
                    <th scope="col">Artist</th>
                    <th scope="col">Reason reliability</th>
                </tr>
            </thead>
            <tbody>
                {currentAttributions.attributions.map((attr) => {
                    const r = attr.r_qualifier;
                    const u = attr.u_qualifier;
                    return (
                        <tr>
                            <td>{attr.type}</td>
                            <th>{attr.author + (r ? ", " + r : "") + (u ? " " + u : "")}</th>
                            <td>
                                <svg width={CELLWIDTH} height={CELLHEIGHT}>
                                    {u
                                        ? attr.reasons.map((reason, i) => (
                                            <path
                                                key={i}
                                                d={uncertaintyLine(
                                                    [
                                                        rankScale(0),
                                                        CELLHEIGHT / 2,
                                                        rankScale(reason.rank),
                                                        CELLHEIGHT / 2,
                                                    ],
                                                    u === "?" ? 0.85 : 0.6,
                                                )}
                                                stroke="var(--color-text)"
                                                strokeWidth={1.5}
                                                fill="none"
                                            ></path>
                                        ))
                                        : attr.reasons.map((reason, i) => (
                                            <line
                                                key={i}
                                                x1={rankScale(0)}
                                                y1={CELLHEIGHT / 2}
                                                x2={rankScale(reason.rank)}
                                                y2={CELLHEIGHT / 2}
                                                stroke="var(--color-text)"
                                                strokeWidth={1.5}
                                            ></line>
                                        ))}

                                    {attr.reasons.map((reason, i) => {

                                        const circleType = attr.is_anonymous
                                            ? "anonym"
                                            : !attr.r_qualifier
                                                ? "author"
                                                : attr.r_qualifier.trimStart().startsWith("e ")
                                                    ? "recognised"
                                                    : "unrecognised";

                                        return (
                                            <g key={i} transform={`translate(${rankScale(reason.rank)}, ${CELLHEIGHT / 2})`}>
                                            <AttributionCircle type={circleType} fill={
                                                attr.type === "accepted"
                                                    ? "var(--color-accepted)"
                                                    : "var(--color-discarded)"
                                            } r={CELLHEIGHT / 4} />
                                            <title>{reason.reason}</title>
                                            </g>
                                        );
                                    })}
                                </svg>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}