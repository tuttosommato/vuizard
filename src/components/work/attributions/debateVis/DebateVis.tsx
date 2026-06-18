import type { AttributionsBundle } from "@/types/attributions";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { getAuthor } from "@/data/api";
import type { Author } from "@/types/authors";
import BackgroundArcs from "@/components/work/attributions/debateVis/BackgroundArcs";
import AttributionsGroup from "@/components/work/attributions/debateVis/AttributionsGroup";
import {
    center,
    height,
    width,
    labelsFontSize,
    min,
    max,
    radius,
    rankScale,
    curveGap,
    outerX
} from "./constants";
import { verticalCenterOffset, slotRotationDeg } from "./geometry";


type VisProps = {
    currentAttributions: AttributionsBundle;
};



export default function DebateVis({ currentAttributions }: VisProps) {

    const attributions = currentAttributions.attributions;

    const [authors, setAuthors] = useState<{ [key: string]: Author }>({});

    const rotations = attributions.map((_, i) =>
        slotRotationDeg(i, attributions.length),
    );

    const labelsRef = useRef<Map<string, SVGTextElement>>(new Map());

    const [labelsGeometry, setLabelsGeometry] = useState<
        Record<string, { textWidth: number }>
    >({});

    useLayoutEffect(() => {
        const next: Record<string, { textWidth: number }> = {};
        for (const [id, el] of labelsRef.current.entries()) {
            next[id] = { textWidth: el.getBBox().width };
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLabelsGeometry(next);
    }, [attributions]);

    const labelsEnd = useMemo(() => {
        const result: Record<string, { x: number; y: number }> = {};
        attributions.forEach((d, i) => {
            const g = labelsGeometry[d.operational_id];
            if (!g) return;
            const rotDeg = rotations[i];
            const rotRad = (rotDeg * Math.PI) / 180;
            result[d.operational_id] = {
                x: rankScale(-0.2) * Math.cos(rotRad) + g.textWidth + curveGap,
                y: rankScale(-0.2) * Math.sin(rotRad) + verticalCenterOffset(rotDeg),
            };
        });
        return result;
    }, [labelsGeometry, rotations, attributions]);



    function curvePath(idA: string, idB: string): string | null {
        const a = labelsEnd[idA];
        const b = labelsEnd[idB];
        if (!a || !b) return null;
        return `M ${a.x},${a.y} C ${outerX},${a.y} ${outerX},${b.y} ${b.x},${b.y}`;
    }

    useEffect(() => {
        let canceled = false;

        // Only fetch real authors. Anonymous attributions don't have an author file.
        const fetchableIds = attributions
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
    }, [attributions]);




    return (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>

            <BackgroundArcs min={min} max={max} center={center} />

            {attributions.map((attr, i) => (
                <AttributionsGroup
                    key={attr.operational_id}
                    attr={attr}
                    center={center}
                    rotation={rotations[i]}
                    rankScale={rankScale}
                    radius={radius}
                    labelsRef={labelsRef}
                    authors={authors}
                    verticalCenterOffset={verticalCenterOffset}
                    labelsFontSize={labelsFontSize}
                />
            ))}

            {/* Authors connections */}
            {currentAttributions.author_similarities.map((link, j) => {
                const d = curvePath(link.a, link.b)
                if (!d) return null
                return <path key={j} className="similarity author-connection" transform={center}
                    d={d} stroke="var(--color-text)"
                    strokeWidth={link.npmi > 0.34 ? link.npmi * 5 : 0}
                    fill="none" opacity={0.2} />
            })}

            {currentAttributions.implicit_relations.map((link, j) => {
                const d = curvePath(link[0], link[1])
                if (!d) return null
                return <path key={j} className="same-author author-connection" transform={center}
                    d={d} stroke="red" strokeWidth={1} fill="none" opacity={0.2} />
            })}

            {currentAttributions.master_relations.map((link, j) => {
                const d = curvePath(link[0], link[1])
                if (!d) return null
                return <path key={j} className="master-relations author-connection" transform={center}
                    d={d} stroke="yellow" strokeWidth={1} fill="none" opacity={0.2} />
            })}
        </svg>
    );
}