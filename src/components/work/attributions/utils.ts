import type { Attribution } from "@/types/attributions";
type AttributionAuthor = Attribution["authors"][number];

// it picks the first author to represent the attribution when u_qualifier and r_qualifier are needed since they are the same for all authors in an attribution
export function representativeAuthor(attr: Attribution): AttributionAuthor {
  return attr.authors[0];
}

// by now it selects just a single representativeAuthor but it's a simplification. I may have attributions with reconised authors collaborating with anonyms unrelated to the author itself. However, the cases are so limited this euristics is temporarily fine
export function circleTypeFor(
  attr: Attribution,
): "anonym" | "artist" | "recognised" | "unrecognised" {
  const author = representativeAuthor(attr);
  if (author.is_anonymous) return "anonym";
  if (!author.r_qualifier) return "artist";
  if (author.r_qualifier.trimStart().startsWith("e ")) return "recognised";
  return "unrecognised";
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatAttributionLabel(attr: Attribution): string {
  return attr.authors.map(formatAuthorLabel).join(" & ");
}

export function formatAuthorLabel(a: AttributionAuthor): string {
  const label =
    (a.r_qualifier && !a.r_qualifier.includes("e ")
      ? a.r_qualifier + " di "
      : "") +
    a.name +
    (a.r_qualifier && a.r_qualifier.includes("e ") ? " " + a.r_qualifier : "") +
    (a.u_qualifier ? ` (${a.u_qualifier})` : "");
  return capitalize(label);
}

// composite_id -> every attribution_id that has an author with that composite_id
export function attributionIdsByCompositeId( attributions: Attribution[] ): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  attributions.forEach((attr) => {
    attr.authors.forEach((author) => {
      (map[author.composite_id] ??= []).push(attr.attribution_id);
    });
  });
  return map;
}
