import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorksIndex } from "@/data/api";
import type { WorksIndex } from "@/types/works";
import "@/styles/shared.css";
import "@/styles/artist.css";

const PAGE_SIZE = 100;

export default function WorksListPage() {
  const [index, setIndex] = useState<WorksIndex | null>(null);
  const [query, setQuery] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prevQuery, setPrevQuery] = useState(query);

  useEffect(() => {
    let canceled = false;
    getWorksIndex().then((i) => {
      if (!canceled) setIndex(i);
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
    if (!index) return [];
    const q = query.trim().toLowerCase();
    return Object.entries(index).filter(([, label]) =>
      label.toLowerCase().includes(q),
    );
  }, [index, query]);

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
          Search and click on an artwork <br /> to visualise its attribution
          data
        </h1>
        <input
          className="list-page-search"
          type="search"
          placeholder="Search artwork..."
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
        />
      </div>
      <div className="list-page-content">
        <div className="card-grid-2col">
          {visibleFiltered.map(([id, label]) => (
            <Link key={id} to={`/work/${id}`} className="work-card">
              <h4 className="work-card-title">{label}</h4>
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