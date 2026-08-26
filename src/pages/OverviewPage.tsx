import type { Artist } from "@/types/artists";
import type { AuthorsCoBundle } from "@/types/coOccurrences";
import { useState, useEffect, useMemo } from "react";
import { getAllAuthors, getAllAuthorsCo } from "@/data/api";
import PackingVis from "@/components/overview/PackingVis";
import PackingLegend from "@/components/overview/PackingLegend";
import "@/styles/shared.css";
import "@/styles/overview.css";
import { OverviewFilterProvider } from "@/stores/OverviewFilterContext";
import ArtistCard from "@/components/overview/ArtistCard";
import { getArtistTotal } from "@/utils/getArtistTotal";

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
      <OverviewFilterProvider tempBounds={tempBounds}>
        <OverviewPageContent
          artists={loadState.artists}
          coOccurrences={loadState.coOccurrences}
        />
      </OverviewFilterProvider>
    </>
  );
}

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
        (a, b) => getArtistTotal(b) - getArtistTotal(a),
      ),
    [artists],
  );

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
        <div className="overview-cards-cnt page-side-panel">
          <h3 className="work-list-stats-title">Artists</h3>
          {sortedArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </main>
    </>
  );
}
