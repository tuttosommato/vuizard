import type { Attribution } from "@/types/attributions";

export function circleTypeFor(attr: Attribution): "anonym" | "author" | "recognised" | "unrecognised" {
  if (attr.is_anonymous) return "anonym"
  if (!attr.r_qualifier) return "author"
  if (attr.r_qualifier.trimStart().startsWith("e ")) return "recognised"
  return "unrecognised"
}

export function labelText(attr: Attribution): string {
  return attr.author
    + (attr.r_qualifier ? " " + attr.r_qualifier : "")
    + (attr.u_qualifier ? " " + attr.u_qualifier : "")
}