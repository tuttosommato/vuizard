import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import { getArtistWorkItems, getAuthor } from "@/data/api";
import type { Artist } from "@/types/artists";
import type { WorkItem } from "@/types/works";
import NotFoundPage from "./NotFoundPage";
import ArtistVis, { type ArtistVisHandle } from "@/components/artist/ArtistVis";
import "@/styles/shared.css";
import "@/styles/artist.css";
import ArtistLegend from "../components/artist/ArtistLegend";
import WorkCard from "../components/artist/WorkCard";
import {
  ArtistSelectionProvider,
  useArtistSelection,
} from "@/stores/ArtistSelectionContext";
import { ArtistFilterProvider } from "@/stores/ArtistFilterContext";
import { getArtistDotSpecs, fitNucleusMultiplier } from "@/utils/artistDots";

type LoadState =
  | { status: "loading"; phase: "artist" }
  | {
      status: "loading";
      phase: "works";
      artist: Artist;
      workCount: number;
      loadedCount: number;
    }
  | {
      status: "loaded";
      artist: Artist;
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
          ...new Set(
            Object.values(
              artist.stats as Record<string, { works: string[] }>,
            ).flatMap((s) => s.works),
          ),
        ];
        setState({
          status: "loading",
          phase: "works",
          artist,
          workCount: workIds.length,
          loadedCount: 0,
        });

        return getArtistWorkItems(artistId, workIds, (loadedCount) => {
          if (canceled) return;
          // only touch the loading state: a late tick must not overwrite
          // "loaded" or "error"
          setState((prev) =>
            prev.status === "loading" && prev.phase === "works"
              ? { ...prev, loadedCount }
              : prev,
          );
        }).then((worksList) => {
          if (canceled) return;
          setState({ status: "loaded", artist, worksList, artistId });
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
          {/* a bundled artist loads as one request, so it never counts up */}
          <p>
            {state.phase === "artist"
              ? "Loading artist…"
              : state.loadedCount === 0
                ? `Loading ${state.workCount} works…`
                : `Loading works: ${state.loadedCount} out of ${state.workCount}`}
          </p>
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
    return w.attributions?.attributions.length ?? 0;
  });
  // distinct per-work attribution counts (0 = no attributions bundle, not a
  // meaningful size), each of which becomes a toggle in the legend
  const sizeValues = [...new Set(attributionsCounts)]
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  return (
    <>
      <ArtistSelectionProvider>
        <ArtistFilterProvider sizeValues={sizeValues}>
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

  const dotSpecs = useMemo(
    () => getArtistDotSpecs(state.worksList, artistId),
    [state.worksList, artistId],
  );
  const dotsLength = dotSpecs.length;

  // Ceiling from the overall dot count (keeps the tiers from crowding)...
  const thresholdMultiplier =
    dotsLength >= 500
      ? 2
      : dotsLength >= 450
        ? 2.35
        : dotsLength >= 400
          ? 2.75
          : dotsLength >= 300
            ? 3
            : dotsLength >= 200
              ? 3.25
              : 4;

  // ...which the nucleus fit can only shrink further: the nucleus is a hard-edged
  // space, so how many dots fit depends on their sizes, not just on how many there are
  const multiplier = useMemo(
    () => Math.min(thresholdMultiplier, fitNucleusMultiplier(dotSpecs)),
    [thresholdMultiplier, dotSpecs],
  );

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
    <main className="artist-layout page-layout">
      <div className="artist-left page-side-panel">
        <div className="artist-header">
          <p>Navigate the works with attributions to</p>
          <h1 className="artist-name">{state.artist.name}</h1>
          {state.artist.life.raw && state.artist.life.start ? (
            <p className="artist-life life-known">
              {state.artist.life.start +
                (state.artist.life.start_approx ? "ca." : "")}{" "}
              -{" "}
              {state.artist.life.end
                ? state.artist.life.end +
                  (state.artist.life.end_approx ? "ca." : "")
                : "present"}
            </p>
          ) : state.artist.life.raw ? (
            <p>{state.artist.life.raw}</p>
          ) : (
            <p className="artist-life life-unknown">Life dates unknown</p>
          )}

          {[
            ...state.artist.pseudonyms,
            ...state.artist.pseudonym_alts,
            ...state.artist.variant_names,
          ].length > 0 && (
            <p>
              Also known as{" "}
              {[
                ...state.artist.pseudonyms,
                ...state.artist.pseudonym_alts,
                ...state.artist.variant_names,
              ].map((name, i) => (
                <span key={name}>
                  {i > 0 && ", "}
                  <span className="alternative-name">{name}</span>
                </span>
              ))}
            </p>
          )}
        </div>
        <Link to={`/`} className="button-link">
          View in artists overview
        </Link>
        <ArtistLegend multiplier={multiplier} />
      </div>
      <ArtistVis
        ref={artistVisRef}
        key={artistId}
        artistId={artistId ?? ""}
        works={state.worksList}
        multiplier={multiplier}
      />
      <div className="works-list page-side-panel" ref={listRef}>
        {
          <div className="works-list-header">
            <h3 className="work-list-stats-title">
              {state.worksList.length} works with attributions to{" "}
              {state.artist.name}.
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
