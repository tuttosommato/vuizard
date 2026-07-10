const TILE_SIZE_1 = 3;
const DOT_R1 = TILE_SIZE_1 / 2.5;
const TILE_SIZE_2 = 2;
const DOT_R2 = TILE_SIZE_2 / 4;

function UncertaintyPattern({ id, base, uncertaintyLevel }: { id: string; base: string; uncertaintyLevel: number }) {
    return (
        <pattern id={id} patternUnits="userSpaceOnUse" width={uncertaintyLevel === 1 ? TILE_SIZE_1 : TILE_SIZE_2} height={uncertaintyLevel === 1 ? TILE_SIZE_1 : TILE_SIZE_2}>
            <rect width={uncertaintyLevel === 1 ? TILE_SIZE_1 : TILE_SIZE_2} height={uncertaintyLevel === 1 ? TILE_SIZE_1 : TILE_SIZE_2} fill="var(--color-bg)" />
            <circle cx={uncertaintyLevel === 1 ? TILE_SIZE_1 / 2 : TILE_SIZE_2 / 2} cy={uncertaintyLevel === 1 ? TILE_SIZE_1 / 2 : TILE_SIZE_2 / 2} r={uncertaintyLevel === 1 ? DOT_R1 : DOT_R2} fill={base} />
        </pattern>
    )
}

export default function UncertaintyPatternDefs() {
    return (
        <defs>
            <UncertaintyPattern id="uncertain-accepted-1" base="var(--color-accepted)" uncertaintyLevel={1} />
            <UncertaintyPattern id="uncertain-discarded-1" base="var(--color-discarded)" uncertaintyLevel={1} />
            <UncertaintyPattern id="uncertain-accepted-2" base="var(--color-accepted)" uncertaintyLevel={2} />
            <UncertaintyPattern id="uncertain-discarded-2" base="var(--color-discarded)" uncertaintyLevel={2} />
            <UncertaintyPattern id="uncertain-legend-1" base="var(--color-text)" uncertaintyLevel={1} />
            <UncertaintyPattern id="uncertain-legend-2" base="var(--color-text)" uncertaintyLevel={2} />
        </defs>
    )
}