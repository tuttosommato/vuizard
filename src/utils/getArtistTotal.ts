import type { Artist } from "@/types/artists";

// Total attribution-record count across every work type for a given artist.
export function getArtistTotal(artist: Artist): number {
  return Object.values(artist.stats).reduce(
    (total, stat) => total + stat.counts.total,
    0,
  );
}
