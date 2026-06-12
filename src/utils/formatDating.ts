import type { Work } from "@/types/works"

type DatingEntry = Work["dating"][number]

export function formatDating(d: DatingEntry): string {
  let s = String(d.from)
  if (d.from_approximation) s += d.from_approximation
  if (d.to) s += "-" + d.to
  if (d.to_approximation) s += d.to_approximation
  return s
}