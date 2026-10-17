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
