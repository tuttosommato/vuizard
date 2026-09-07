import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllAuthors } from "@/data/api";
import type { Artist } from "@/types/artists";
import "@/styles/shared.css";
import "@/styles/artist.css";
import ArtistCardBody from "@/components/ArtistCardBody";

const PAGE_SIZE = 100;

export default function ArtistsListPage() {
  const [artists, setArtists] = useState<Record<string, Artist> | null>(null);
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prevQuery, setPrevQuery] = useState(query);

  useEffect(() => {
    let canceled = false;
    getAllAuthors().then((a) => {
      if (!canceled) setArtists(a);
    });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery), 150);
    return () => clearTimeout(id);
  }, [rawQuery]);

  const filtered = useMemo(() => {
    if (!artists) return [];
    const q = query.trim().toLowerCase();
    const list = Object.values(artists);
    if (!q) return list;

    return list.filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      const altNames = [
        ...a.pseudonyms,
        ...a.pseudonym_alts,
        ...a.variant_names,
      ];
      return altNames.some((name) => name.toLowerCase().includes(q));
    });
  }, [artists, query]);


  if (query !== prevQuery) {
    setPrevQuery(query);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleFiltered = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <main className="list-page">
      <div className="list-page-header">
        <h1>
          Search and click on an artist <br /> to visualise their attribution
          data
        </h1>
        <input
          className="list-page-search"
          type="search"
          placeholder="Search artists..."
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
        />
      </div>
      <div className="list-page-content">
        <div className="card-grid-2col">
          {visibleFiltered.map((artist) => (
            <Link
              key={artist.id}
              to={`/artist/${artist.id}`}
              className="work-card"
            >
              <ArtistCardBody artist={artist} />
            </Link>
          ))}
        </div>
        {hasMore && (
          <button
            className="button-link load-more-button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Load more
          </button>
        )}
      </div>
    </main>
  );
}
