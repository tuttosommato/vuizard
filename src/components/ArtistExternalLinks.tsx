import type { Artist } from "@/types/artists";

// The links to the external authorities an artist has (ULAN, VIAF, Wikidata, DBpedia), when
// there are any. Shown on the artist's page and in the artwork view's table of artists.
export default function ArtistExternalLinks({
  artist,
  stopPropagation = false, // inside a row that reacts to clicks (the table)
}: {
  artist: Pick<Artist, "ulan" | "viaf" | "wikidata" | "dbpedia">;
  stopPropagation?: boolean;
}) {
  const links = [
    { label: "ULAN", href: artist.ulan },
    { label: "VIAF", href: artist.viaf },
    { label: "Wikidata", href: artist.wikidata },
    { label: "DBpedia", href: artist.dbpedia },
  ].filter((l) => l.href);

  if (links.length === 0) return null;

  return (
    <div className="artist-links-cnt">
      External links:{" "}
      {links.map((l, i) => (
        <span key={l.label}>
          <a
            href={l.href!}
            onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
            className="in-text-a"
            target="_blank"
            rel="noopener noreferrer"
          >
            {l.label}
          </a>
          {i < links.length - 1 && ", "}
        </span>
      ))}
    </div>
  );
}
