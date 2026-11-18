import type { Artist } from "@/types/artists";

// An artist's life dates as the artist cards write them: "1518 - 1594", "1490 ca. - 1576",
// "1900 - present"; the raw text when it couldn't be parsed, or a note when there's none.
export function formatLife(life: Artist["life"]): string {
  if (life.raw && life.start) {
    const start = `${life.start}${life.start_approx ? " ca." : ""}`;
    const end = life.end
      ? `${life.end}${life.end_approx ? " ca." : ""}`
      : "present";
    return `${start} - ${end}`;
  }
  return life.raw || "Life dates unknown";
}

// What the dates are about, in the words the card and the tooltips use. Dates known only to the
// century are "Approx. century"; otherwise it is the kind of the dates.
const TYPE_LABELS: Record<Artist["life"]["type"], string> = {
  life: "Life",
  activity: "Activity",
  information: "Documented", // the years in which the artist is attested in the sources
};

// The kind of the dates in words ("Life", "Activity", "Documented"); "" when the catalogue gives
// none.
export function lifeTypeLabel(life: Artist["life"]): string {
  return TYPE_LABELS[life.type] ?? "";
}

// The label before the dates ("Life", "Activity"...); null when there's nothing to say about the
// dates: they couldn't be parsed, or there are none.
export function formatLifeLabel(life: Artist["life"]): string | null {
  if (!(life.raw && life.start)) return null;
  if (life.precision === "century") return "Approx. century";
  return TYPE_LABELS[life.type] ?? null;
}

// The two together: "Life: 1518 - 1594"
export function formatLifeWithLabel(life: Artist["life"]): string {
  const label = formatLifeLabel(life);
  return label ? `${label}: ${formatLife(life)}` : formatLife(life);
}
