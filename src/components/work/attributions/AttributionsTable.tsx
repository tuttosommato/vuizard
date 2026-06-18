import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear } from "d3-scale";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "@/components/work/attributions/AttributionCircle.tsx";
import { Fragment, useState } from "react";
import useAuthors from "@/hooks/useAuthors";


type TableProps = {
    currentAttributions: AttributionsBundle;
    workTitle: string;
};

const CELLWIDTH = 250;
const CELLHEIGHT = 40;
const PADDING = 0;



export default function AttributionsTable({ currentAttributions, workTitle }: TableProps) {
    const rankScale = scaleLinear()
        .domain([0, 10])
        .range([CELLWIDTH - PADDING, PADDING]);

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const authors = useAuthors(currentAttributions.attributions);

    const toggle = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next
        })
    }





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
                    const opId = attr.operational_id
                    //const locId = attr.local_id
                    const isExpanded = expandedIds.has(opId)
                    const r = attr.r_qualifier;
                    const u = attr.u_qualifier;
                    const currentAuthor = authors[attr.local_id]

                    return (
                        <Fragment key={opId}>
                            <tr className="visible-row" onClick={() => toggle(opId)} tabIndex={0} aria-expanded={isExpanded} onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle(opId);
                                }
                            }}>
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
                            {
                                isExpanded && (
                                    <tr className="row-details">
                                        <td></td>
                                        <td>
                                            {currentAuthor && (
                                                <>
                                                    {currentAuthor.ulan && (
                                                        <a href={currentAuthor.ulan} target="_blank" rel="noopener noreferrer">
                                                            [ULAN]
                                                        </a>
                                                    )}
                                                    {currentAuthor.viaf && (
                                                        <a href={currentAuthor.viaf} target="_blank" rel="noopener noreferrer">
                                                            [VIAF]
                                                        </a>
                                                    )}
                                                    {currentAuthor.wikidata && (
                                                        <a href={currentAuthor.wikidata} target="_blank" rel="noopener noreferrer">
                                                            [WIKIDATA]
                                                        </a>
                                                    )}
                                                    {currentAuthor.dbpedia && (
                                                        <a href={currentAuthor.dbpedia} target="_blank" rel="noopener noreferrer">
                                                            [DBPEDIA]
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td>{attr.reasons.map((reason) => reason.original_text).join(", ")}</td>
                                    </tr>
                                )
                            }

                        </Fragment>
                    );
                })}
            </tbody>
        </table>
    );
}