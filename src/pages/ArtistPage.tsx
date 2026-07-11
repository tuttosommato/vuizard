import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getAttributions, getAuthor, getWork } from "@/data/api";
import type { Author } from "@/types/authors";
import type { WorkItem } from "@/types/artists";
import NotFoundPage from "./NotFoundPage";
import ArtistVis, { type ArtistVisHandle } from "@/components/artist/ArtistVis";
import "@/styles/artist.css";
import ArtistLegend from "../components/artist/ArtistLegend";
import WorkCard from "../components/artist/WorkCard";
import {
  ArtistSelectionProvider,
  useArtistSelection,
} from "@/stores/ArtistSelectionContext";
import { ArtistFilterProvider } from "@/stores/ArtistFilterContext";

type LoadState =
  | { status: "loading"; phase: "artist" }
  | { status: "loading"; phase: "works"; artist: Author; workCount: number }
  | {
      status: "loaded";
      artist: Author;
      worksList: WorkItem[];
      artistId: string;
    }
  | { status: "not-found" }
  | { status: "error"; message: string };

export default function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const [state, setState] = useState<LoadState>({
    status: "loading",
    phase: "artist",
  });

  useEffect(() => {
    if (!artistId) return;
    let canceled = false;

    getAuthor(artistId)
      .then((artist) => {
        if (canceled) return;
        if (!artist) {
          setState({ status: "not-found" });
          return;
        }
        const workIds = [
          ...new Set(Object.values(artist.stats).flatMap((s) => s.works)),
        ];
        setState({
          status: "loading",
          phase: "works",
          artist,
          workCount: workIds.length,
        });

        return Promise.all([
          Promise.all(workIds.map((id) => getWork(id))),
          Promise.all(workIds.map((id) => getAttributions(id))),
        ]).then(([works, attributions]) => {
          if (canceled) return;
          if (works && attributions) {
            const worksList = workIds.map((id, i) => ({
              id,
              work: works[i],
              attributions: attributions[i],
            }));
            setState({ status: "loaded", artist, worksList, artistId });
          }
        });
      })
      .catch((e: unknown) => {
        if (canceled) return;
        setState({
          status: "error",
          message:
            e instanceof Error ? e.message : "Failed to load artist data",
        });
      });
    return () => {
      canceled = true;
    };
  }, [artistId]);

  if (state.status === "loading") {
    return (
      <>
        <title>Loading…</title>
        <main className="work-layout">
          <p>Loading artist works...</p>
        </main>
      </>
    );
  }

  if (state.status === "not-found") {
    return (
      <NotFoundPage
        title="Artist not found"
        message={`No artist exists with ID “${artistId}”.`}
      />
    );
  }

  if (state.status === "error") {
    return (
      <>
        <title>Error</title>
        <main>
          <h1>Could not load artist and works</h1>
          <p role="alert" style={{ color: "var(--color-discarded)" }}>
            {state.message}
          </p>
        </main>
      </>
    );
  }

  // if artistId in the URL changes --> loading state until the new data is fetched
  // this prevents showing data from the previous artist while the new data is being loaded.
  if (state.status === "loaded" && state.artistId !== artistId) {
    return (
      <main>
        <p>Loading artist works...</p>
      </main>
    );
  }

    const attributionsCounts = state.worksList.map((w) => {
    return w.attributions?.attributions.length ?? 0
  })
  const sizeBounds = [
    Math.min(...attributionsCounts),
    Math.max(...attributionsCounts)
  ] as [number, number]

  return (
    <>
      <ArtistSelectionProvider>
        <ArtistFilterProvider sizeBounds={sizeBounds}>
          <ArtistPageContent state={state} artistId={artistId ?? ""} />
        </ArtistFilterProvider>
      </ArtistSelectionProvider>
    </>
  );
}

function ArtistPageContent({
  state,
  artistId,
}: {
  state: Extract<LoadState, { status: "loaded" }>;
  artistId: string;
}) {
  const discardedWorksCount = Object.values(state.artist.stats).reduce(
    (acc, s) => acc + s.counts.discarded,
    0,
  );
  const acceptedWorksCount = Object.values(state.artist.stats).reduce(
    (acc, s) => acc + s.counts.accepted,
    0,
  );

  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const artistVisRef = useRef<ArtistVisHandle>(null);
  const { triggerNewSelection, selectedIds } = useArtistSelection();

  const dotsLength = state.worksList.flatMap((work) => {
      const attributions = work.attributions?.attributions ?? [];
      return attributions.filter((attr) => attr.local_id === artistId);
    }).length;
  
    const multiplier =
      dotsLength >= 400
        ? 2
        : dotsLength >= 300
          ? 3
          : dotsLength >= 200
            ? 3.25
            : 4;
  

  useEffect(() => {
    if (!triggerNewSelection) return;
    const workId = triggerNewSelection as string;
    const card = cardRefs.current.get(workId);
    const container = listRef.current;
    if (!card || !container) return;

    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isFullyVisible =
      cardRect.top >= containerRect.top &&
      cardRect.bottom <= containerRect.bottom;

    if (isFullyVisible) return;

    const isCutOffAtBottom =
      cardRect.top >= containerRect.top &&
      cardRect.bottom >= containerRect.bottom;

    if (isCutOffAtBottom) {
      const scrollDelta = cardRect.bottom - containerRect.bottom;
      container.scrollBy({ top: scrollDelta + 40, behavior: "smooth" });
      return;
    }

    const scrollDelta = cardRect.top - containerRect.top;
    container.scrollBy({ top: scrollDelta - 40, behavior: "smooth" });
  }, [triggerNewSelection]);

  useEffect(() => {
    if (selectedIds.size === 0) return;
    artistVisRef.current?.focusOnWorks([...selectedIds]);
  }, [selectedIds]);

  return (
    <main className="artist-layout">
      <div className="artist-left">
        <div className="artist-header">
          <p>Navigate the works with attributions to</p>
          <h1 className="artist-name">{state.artist.names[0]}</h1>
          {state.artist.life ? (
            <p className="artist-life life-known">
              {state.artist.life.birth +
                (state.artist.life.birth_qualifier ? "ca." : "")}{" "}
              -{" "}
              {state.artist.life.death +
                (state.artist.life.death_qualifier ? "ca." : "")}
            </p>
          ) : (
            <p className="artist-life life-unknown">Life dates unknown</p>
          )}

          {state.artist.names.length > 1 && (
            <p>
              Also known as{" "}
              {state.artist.names.slice(1).map((name, i) => (
                <span key={name}>
                  {i > 0 && ", "}
                  <span className="alternative-name">{name}</span>
                </span>
              ))}
            </p>
          )}
        </div>
        <ArtistLegend multiplier={multiplier} />
      </div>
<ArtistVis
  ref={artistVisRef}
  key={artistId}
  artistId={artistId ?? ""}
  works={state.worksList}
  multiplier={multiplier}
/>
      <div className="works-list" ref={listRef}>
        {
          <div className="works-list-header">
            <h3 className="work-list-stats-title">
              {state.worksList.length} works with attributions to{" "}
              {state.artist.names[0]}.
            </h3>
            <p className="work-list-stats">
              Includes{" "}
              <span className="work-list-n-accepted">
                {acceptedWorksCount} accepted
              </span>{" "}
              and{" "}
              <span className="work-list-n-discarded">
                {discardedWorksCount} discarded
              </span>{" "}
              attributions.
            </p>
          </div>
        }
        {state.worksList.map((workItem) => (
          <div
            ref={(el) => {
              if (el) cardRefs.current.set(workItem.id, el);
              else cardRefs.current.delete(workItem.id);
            }}
          >
            <WorkCard
              key={workItem.id}
              workItem={workItem}
              artistId={artistId ?? ""}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
