import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { range } from "d3-array";
import { arc } from "d3-shape";
import uncertaintyLine from "@/utils/uncertaintyLine";
import AttributionCircle from "./AttributionCircle";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { getAuthor } from "@/data/api";
import type { Author } from "@/types/authors";

type VisProps = {
    currentAttributions: AttributionsBundle;
};

const height = 800;
const width = 1000;
const centerX = width / 4;
const centerY = height / 2;
const curveGap = 10;

const labelsFontSize = 14;
const offsetAmplitude = labelsFontSize * 0.35; // visual half-height for most sans-serif fonts

// I compute the rotation for a <g> and then append all the attribution elements without recomputing angles with sine and cosine
function slotRotationDeg(slot: number, total: number) {
    return 90 - (180 * (total - slot)) / (total + 1);
}
// I divide the space (180 degrees) evely based on the number of slots i need to fit (180 / (n+1))
// For every n-slot i walk up placing my elements in the semicircle:
// "starting from the bottom of the arc, walk upward by (n - slot) slot-widths"
// In SVG, my semi-circle extends from -90deg (top) to 90deg(bottom), so, a range of 180deg centered on 0deg
// the formula should output a value in the range [-90deg, 90deg], that is why "90 -" befpre the degree computation



export default function DebateVis({ currentAttributions }: VisProps) {

    const [authors, setAuthors] = useState<{ [key: string]: Author }>({});

    const min = height / 25;
    const max = min * 11 + 1;
    const increment = min;
    const r = min / 2.5;

    const rankScale = useMemo(
        () => scaleLinear().domain([0, 10]).range([max, min]),
        [min, max],
    );

    const colorScale = scaleOrdinal(
        ["accepted", "discarded"],
        ["var(--color-accepted)", "var(--color-discarded)"],
    );


    // creates a continuous offset value to place elements at labes' right based on rotation angle
    function verticalCenterOffset(rotDeg: number) {
        // Smooth interpolation: −amp at top (rot = −90°), 0 at middle, +amp at bottom (+90°).
        return offsetAmplitude * Math.sin((rotDeg * Math.PI) / 180);
    }

    const center = `translate(${width / 4}, ${height / 2})`;
    const radii = range(min, max, increment);
    const arcGenerator = arc<null>()
        .innerRadius(0)
        .startAngle(0)
        .endAngle(Math.PI);
    const rotations = currentAttributions.attributions.map((_, i) =>
        slotRotationDeg(i, currentAttributions.attributions.length),
    );
    const labelsRef = useRef<Map<string, SVGTextElement>>(new Map());

    const [labelsGeometry, setLabelsGeometry] = useState<Record<string, { textWidth: number }>>({});




    useLayoutEffect(() => {
    const next: Record<string, { textWidth: number }> = {};
    for (const [id, el] of labelsRef.current.entries()) {
        next[id] = { textWidth: el.getBBox().width };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabelsGeometry(next);
    }, [currentAttributions.attributions]);



    const labelsEnd = useMemo(() => {
        const result: Record<string, { x: number; y: number }> = {};
        currentAttributions.attributions.forEach((d, i) => {
            const g = labelsGeometry[d.operational_id]
            if (!g) return
            const rotDeg = rotations[i]
            const rotRad = (rotDeg * Math.PI) / 180
            result[d.operational_id] = {
                x: rankScale(-0.2) * Math.cos(rotRad) + g.textWidth + curveGap,
                y: rankScale(-0.2) * Math.sin(rotRad) + verticalCenterOffset(rotDeg),
            }
        })
        return result
    }, [labelsGeometry, rotations, currentAttributions, rankScale]);

    const outerX = rankScale(0) * 2.25; // the reference point i need to draw the curves

    function curvePath(idA: string, idB: string): string | null {
        const a = labelsEnd[idA]
        const b = labelsEnd[idB]
        if (!a || !b) return null
        return `M ${a.x},${a.y} C ${outerX},${a.y} ${outerX},${b.y} ${b.x},${b.y}`
    }

    useEffect(() => {
        let canceled = false;

        // Only fetch real authors. Anonymous attributions don't have an author file.
        const fetchableIds = currentAttributions.attributions
            .filter((a) => !a.is_anonymous && a.local_id)
            .map((a) => a.local_id);

        if (fetchableIds.length === 0) {
            return;
        }

        Promise.all(fetchableIds.map((id) => getAuthor(id)))
            .then((authorsArray) => {
                if (canceled) return;
                const authorsMap: { [key: string]: Author } = {};
                fetchableIds.forEach((id, i) => {
                    const a = authorsArray[i];
                    if (a) authorsMap[id] = a;
                });
                setAuthors(authorsMap);
            })
            .catch((e) => {
                if (canceled) return;
                console.error("Error fetching author data:", e);
            });

        return () => {
            canceled = true;
        };
    }, [currentAttributions.attributions]);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
            {/* Semi-circle arcs */}
            {radii.map((rad) => {
                const isMaxRadius = rad >= max - 1;
                return (
                    <path
                        key={rad}
                        transform={center}
                        d={arcGenerator.outerRadius(rad)(null) ?? undefined}
                        fill="none"
                        stroke="var(--color-text)"
                        opacity={isMaxRadius ? 1 : 0.5}
                        strokeWidth={isMaxRadius ? "1.5px" : "0.5px"}
                        strokeDasharray={
                            rad <= min ? undefined : isMaxRadius ? undefined : "6, 8"
                        }
                    ></path>
                );
            })}

            {/* Attribution groups */}
            {currentAttributions.attributions.map((attr, i) => {
                return (
                    <g
                        key={attr.operational_id}
                        transform={`translate(${centerX}, ${centerY}) rotate(${rotations[i]})`}
                        fill={colorScale(attr.type)}
                    >
                        {/* Attribution edged */}
                        {attr.u_qualifier
                            ? attr.reasons.map((reason) => {
                                const x1 = rankScale(reason.rank);
                                const x2 = rankScale(0);
                                return (
                                    <path
                                        key={`${attr.operational_id}-${reason.reason}`}
                                        d={uncertaintyLine(
                                            [x1, 0, x2, 0],
                                            attr.u_qualifier === "?" ? 0.85 : 0.6,
                                        )}
                                        fill="none"
                                        stroke="var(--color-text)"
                                        strokeWidth="1.5px"
                                    ></path>
                                );
                            })
                            : attr.reasons.map((reason) => {
                                const x1 = rankScale(reason.rank);
                                const x2 = rankScale(0);
                                return (
                                    <line
                                        key={`${attr.operational_id}-${reason.reason}`}
                                        x1={x1}
                                        y1={0}
                                        x2={x2}
                                        y2={0}
                                        stroke="var(--color-text)"
                                        strokeWidth={1.5}
                                    ></line>
                                );
                            })}
                        {/* Author symbol */}
                        {attr.reasons.map((reason, ri) => {
                            const circleType = attr.is_anonymous
                                ? "anonym"
                                : !attr.r_qualifier
                                    ? "author"
                                    : attr.r_qualifier.trimStart().startsWith("e ")
                                        ? "recognised"
                                        : "unrecognised";
                            return (
                                <g
                                    key={`${attr.operational_id}-${ri}`}
                                    transform={`translate(${rankScale(reason.rank)}, 0)`}
                                >
                                    <AttributionCircle
                                        type={circleType}
                                        fill={
                                            attr.type === "accepted"
                                                ? "var(--color-accepted)"
                                                : "var(--color-discarded)"
                                        }
                                        r={r}
                                    />
                                    <title>{reason.reason}</title>
                                </g>
                            );
                        })}

                        {/* Average motvation value */}
                        {authors[attr.local_id] &&
                            authors[attr.local_id].stats[attr.operational_id] && (
                                <circle
                                    cx={rankScale(
                                        authors[attr.local_id].stats[attr.operational_id].counts
                                            .mean,
                                    )}
                                    cy="0"
                                    r={r / 1.5}
                                    fill="var(--color-text)"
                                    stroke="var(--color-text)"
                                    strokeWidth={0.75}
                                    fillOpacity={0.1}
                                    strokeOpacity={0.7}
                                ></circle>
                            )}

                        {/* Labels - counter rotated to be read normally */}
                        {(() => {
                            return (
                                <text
                                    ref={(el) => {
                                        if (el) labelsRef.current.set(attr.operational_id, el);
                                        else labelsRef.current.delete(attr.operational_id);
                                    }}
                                    className="vis-author-label"
                                    transform={`translate(${rankScale(-0.2)}, 0) rotate(${-rotations[i]}) translate(0, ${verticalCenterOffset(rotations[i])})`}
                                    dominantBaseline="middle"
                                    fill="var(--color-text)"
                                    fontSize={labelsFontSize}
                                >
                                    {attr.author +
                                        (attr.r_qualifier ? " " + attr.r_qualifier : "") +
                                        (attr.u_qualifier ? " " + attr.u_qualifier : "")}
                                </text>
                            );
                        })()}
                    </g>
                );
            })}
                        {/* Similarity connections */}
                        {currentAttributions.author_similarities.map((link, j) => {
                            const d = curvePath(link.a, link.b)
                            if (!d) return null
                            return <path key={j} className="similarity link" transform={center}
                                d={d} stroke="var(--color-text)"
                                strokeWidth={link.npmi > 0.34 ? link.npmi * 5 : 0}
                                fill="none" opacity={0.2} />
                        })}

                        {currentAttributions.implicit_relations.map((link, j) => {
                            const d = curvePath(link[0], link[1])
                            if (!d) return null
                            return <path key={j} className="same-author link" transform={center}
                                d={d} stroke="red" strokeWidth={1} fill="none" opacity={0.2} />
                        })}

                        {currentAttributions.master_relations.map((link, j) => {
                            const d = curvePath(link[0], link[1])
                            if (!d) return null
                            return <path key={j} className="master-relations link" transform={center}
                                d={d} stroke="yellow" strokeWidth={1} fill="none" opacity={0.2} />
                        })}
        </svg>
    );
}
