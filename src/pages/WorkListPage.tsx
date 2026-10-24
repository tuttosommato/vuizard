import { useMemo, useEffect, useState } from "react";
import { getWorksIndex, getWork, getAttributions } from "@/data/api";
import type { WorksIndex, WorkItem } from "@/types/works";
import "@/styles/shared.css";
import "@/styles/artist.css";
import WorkCardBody from "@/components/WorkCardBody";
import { CardTitle } from "@/components/CardLink";

const PAGE_SIZE = 100;

export default function WorksListPage() {
  const [index, setIndex] = useState<WorksIndex | null>(null);
  const [query, setQuery] = useState("");
  const [rawQuery, setRawQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [prevQuery, setPrevQuery] = useState(query);
  const [worksById, setWorksById] = useState<Map<string, WorkItem>>(new Map());

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

  const visibleFiltered = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const idsToFetch = visibleFiltered
      .map(([id]) => id)
      .filter((id) => !worksById.has(id));
    if (idsToFetch.length === 0) return;

    let canceled = false;
    Promise.all([
      Promise.all(idsToFetch.map((id) => getWork(id))),
      Promise.all(idsToFetch.map((id) => getAttributions(id))),
    ]).then(([works, attributions]) => {
      if (canceled) return;
      setWorksById((prev) => {
        const next = new Map(prev);
        idsToFetch.forEach((id, i) => {
          next.set(id, { id, work: works[i], attributions: attributions[i] });
        });
        return next;
      });
    });

    return () => {
      canceled = true;
    };
  }, [visibleFiltered, worksById]);

  return (
    <main className="list-page">
      <div className="list-page-header">
        <h1>
          Search and click on an artwork to visualise its attribution data
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
          {visibleFiltered.map(([id, label]) => {
            const workItem = worksById.get(id);
            return (
              <div key={id} className="work-card">
                {workItem ? (
                  <WorkCardBody
                    workItem={workItem}
                    isList={true}
                    to={`/work/${id}`}
                  />
                ) : (
                  <CardTitle to={`/work/${id}`}>{label}</CardTitle>
                )}
              </div>
            );
          })}
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
