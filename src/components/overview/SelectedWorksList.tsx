import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAttributions, getWork } from "@/data/api";
import type { Artist } from "@/types/artists";
import type { WorkItem } from "@/types/works";
import WorkCardBody from "@/components/WorkCardBody";

const PAGE_SIZE = 100;

// The works all the selected artists appear in together, a page at a time: an artist can
// have ~1,000 of them. Remounted (keyed) by the parent whenever the selection changes.
export default function SelectedWorksList({
  artists,
  selectedIds,
}: {
  artists: Record<string, Artist>;
  selectedIds: Set<string>;
}) {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [worksById, setWorksById] = useState<Map<string, WorkItem>>(new Map());

  // only the works every selected artist appears in
  const workIds = useMemo(() => {
    let shared: string[] | null = null;
    for (const id of selectedIds) {
      const own = new Set(
        Object.values(artists[id]?.stats ?? {}).flatMap((s) => s.works),
      );
      shared = shared ? shared.filter((w) => own.has(w)) : [...own];
    }
    return shared ?? [];
  }, [artists, selectedIds]);

  const visibleIds = useMemo(
    () => workIds.slice(0, visibleCount),
    [workIds, visibleCount],
  );
  const hasMore = visibleCount < workIds.length;

  useEffect(() => {
    const idsToFetch = visibleIds.filter((id) => !worksById.has(id));
    if (idsToFetch.length === 0) return;

    let canceled = false;
    Promise.all(
      idsToFetch.map(async (id) => {
        const [work, attributions] = await Promise.all([
          getWork(id),
          getAttributions(id),
        ]);
        return { id, work, attributions };
      }),
    ).then((items) => {
      if (canceled) return;
      setWorksById((prev) => {
        const next = new Map(prev);
        items.forEach((item) => next.set(item.id, item));
        return next;
      });
    });
    return () => {
      canceled = true;
    };
  }, [visibleIds, worksById]);

  // with one artist selected the cards can highlight their attributions
  const singleArtistId = selectedIds.size === 1 ? [...selectedIds][0] : "";
  const singleArtist = singleArtistId ? artists[singleArtistId] : null;

  return (
    <>
      <h3 className="work-list-stats-title">
        {workIds.length} work{workIds.length !== 1 ? "s" : ""}{" "}
        {singleArtist
          ? `with attributions to ${singleArtist.name}`
          : `shared by the ${selectedIds.size} selected artists`}
      </h3>
      {visibleIds.map((id) => {
        const workItem = worksById.get(id);
        return (
          <div key={id} className="work-card-container">
            <div className="work-card" onClick={() => navigate(`/work/${id}`)}>
              {workItem ? (
                <WorkCardBody workItem={workItem} artistId={singleArtistId} />
              ) : (
                <h4 className="work-card-title">Loading…</h4>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button
          className="button-link load-more-button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          Load more
        </button>
      )}
    </>
  );
}
