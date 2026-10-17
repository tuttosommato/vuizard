import type { Artist } from "@/types/artists";
import type { AuthorsCoBundle } from "@/types/coOccurrences";
import { useState, useEffect, useMemo } from "react";
import { getAllAuthors, getAllAuthorsCo } from "@/data/api";
import PackingVis from "@/components/overview/PackingVis";
import PackingLegend from "@/components/overview/PackingLegend";
import "@/styles/shared.css";
import "@/styles/overview.css";
import {
  OverviewFilterProvider,
  useOverviewFilter,
} from "@/stores/OverviewFilterContext";
import ArtistCard from "@/components/overview/ArtistCard";
import { getArtistTotal } from "@/utils/getArtistTotal";
import {
  OverviewSelectionProvider,
  useOverviewSelection,
} from "@/stores/OverviewSelectionContext";
import SelectedWorksList from "@/components/overview/SelectedWorksList";
import { getHighlightedIds } from "@/utils/coOccurrences";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      artists: Record<string, Artist>;
      coOccurrences: AuthorsCoBundle;
    }
  | { status: "error"; message: string };

export default function OverviewPage() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
  });

  useEffect(() => {
    let canceled = false;
    Promise.all([getAllAuthors(), getAllAuthorsCo()])
      .then(([allAuthors, authorsCo]) => {
        if (canceled) return;
        setLoadState({
          status: "loaded",
          artists: allAuthors,
          coOccurrences: authorsCo,
        });
      })
      .catch((e: unknown) => {
        if (canceled) return;
        setLoadState({
          status: "error",
          message:
            e instanceof Error
              ? e.message
              : "Failed to load artists and co-occurrence data.",
        });
      });
    return () => {
      canceled = true;
    };
  }, []);

  if (loadState.status === "error") {
    return (
      <>
        <title>Error</title>
        <main>
          <h1>Could not load artist and co-occurrences</h1>
          <p role="alert" style={{ color: "var(--color-discarded)" }}>
            {loadState.message}
          </p>
        </main>
      </>
    );
  }

  if (loadState.status === "loading") {
    return (
      <main>
        <p>Loading artists...</p>
      </main>
    );
  }

  const temps = Object.values(loadState.artists)
    .map((w) => w.cultural_context_info.century_bucket)
    .filter((temp): temp is number => temp !== null);
  const tempBounds = [Math.min(...temps), Math.max(...temps)] as [
    number,
    number,
  ];

  return (
    <>
      <OverviewFilterProvider
        tempBounds={tempBounds}
        artists={loadState.artists}
      >
        <OverviewSelectionProvider>
          <OverviewPageContent
            artists={loadState.artists}
            coOccurrences={loadState.coOccurrences}
          />
        </OverviewSelectionProvider>
      </OverviewFilterProvider>
    </>
  );
}

const isAnonimo = (artist: Artist) => /^anonimo\b/i.test(artist.name);

function OverviewPageContent({
  artists,
  coOccurrences,
}: {
  artists: Record<string, Artist>;
  coOccurrences: AuthorsCoBundle;
}) {
  const sortedArtists = useMemo(
    () =>
      Object.values(artists).sort(
        (a, b) =>
          Number(isAnonimo(a)) - Number(isAnonimo(b)) || // "Anonimo ..." last
          getArtistTotal(b) - getArtistTotal(a),
      ),
    [artists],
  );

  const { selectedIds } = useOverviewSelection();
  const { isArtistFilteredOut, matchingIds } = useOverviewFilter();

  const highlightedIds = useMemo(
    () => getHighlightedIds(selectedIds, coOccurrences),
    [selectedIds, coOccurrences],
  );

  const visibleArtists = useMemo(() => {
    // The century filter and the search apply to the list as they do to the circles. The
    // selected artists stay whatever the filters say, so they can still be deselected here.
    const passesFilters = (artist: Artist) =>
      selectedIds.has(artist.id) ||
      (!isArtistFilteredOut(
        artist.cultural_context_info.century_bucket ?? null,
      ) &&
        (matchingIds === null || matchingIds.has(artist.id)));

    if (selectedIds.size === 0) return sortedArtists.filter(passesFilters);

    const selectionOrder = [...selectedIds]; // insertion order = selection order
    const rankOf = (id: string) => selectionOrder.indexOf(id); // -1 if not selected

    return sortedArtists
      .filter(
        (artist) => highlightedIds.has(artist.id) && passesFilters(artist),
      )
      .sort((a, b) => {
        const rankA = rankOf(a.id);
        const rankB = rankOf(b.id);
        if (rankA !== -1 && rankB !== -1) return rankA - rankB; // both selected: earlier-selected first
        if (rankA !== -1) return -1; // a selected, b isn't: a goes first
        if (rankB !== -1) return 1; // b selected, a isn't: b goes first
        return 0; // neither selected: leave as-is
      });
  }, [
    sortedArtists,
    selectedIds,
    highlightedIds,
    isArtistFilteredOut,
    matchingIds,
  ]);

  // with one artist selected: how many others appear with them; with several, the list
  // holds the selected ones followed by who appears with all of them, so both are counted
  const nOthers = visibleArtists.length - selectedIds.size;
  const artistsTitle =
    selectedIds.size === 0
      ? `${visibleArtists.length} artist${visibleArtists.length !== 1 ? "s" : ""}`
      : selectedIds.size === 1
        ? `${nOthers} artist${nOthers !== 1 ? "s" : ""} appearing in works with ${
            artists[[...selectedIds][0]]?.name
          }`
        : `${selectedIds.size} selected + ${nOthers} appearing in works with all the selected`;

  return (
    <>
      <title>Artists overview</title>
      <meta
        name="description"
        content="Overview of all artists in the catalogue."
      />

      <main className="overview-layout page-layout">
        <div className="overview-left page-side-panel">
          <div className="overview-header">
            <h1>Artists and cultural contexts</h1>
          </div>
          <PackingLegend />
        </div>
        <div className="overview-vis-cnt">
          <PackingVis artists={artists} coOccurrences={coOccurrences} />
        </div>
        <div className="overview-right">
          <div
            className={
              "overview-cards-cnt page-side-panel" +
              (selectedIds.size > 0 ? " overview-cards-cnt-faded" : "")
            }
          >
            <h3 className="work-list-stats-title">{artistsTitle}</h3>
            {visibleArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
          {/* with a selection the artist list gives its bottom half to the works */}
          {selectedIds.size > 0 && (
            <div className="overview-cards-cnt overview-works-cnt page-side-panel">
              <SelectedWorksList
                key={[...selectedIds].join(",")}
                artists={artists}
                selectedIds={selectedIds}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
