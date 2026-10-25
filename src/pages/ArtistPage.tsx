import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import { getArtistWorkItems, getAuthor } from "@/data/api";
import type { Artist } from "@/types/artists";
import type { WorkItem } from "@/types/works";
import NotFoundPage from "./NotFoundPage";
import LoadingScreen from "@/components/LoadingScreen";
import ArtistVis, { type ArtistVisHandle } from "@/components/artist/ArtistVis";
import "@/styles/shared.css";
import "@/styles/artist.css";
import ArtistLegend from "../components/artist/ArtistLegend";
import WorkCard from "../components/artist/WorkCard";
import {
  ArtistSelectionProvider,
  useArtistSelection,
} from "@/stores/ArtistSelectionContext";
import {
  ArtistFilterProvider,
  useArtistFilter,
} from "@/stores/ArtistFilterContext";
import {
  getArtistDotSpecs,
  fitNucleusMultiplier,
  fitNucleusRadius,
  fitOuterRingRadius,
} from "@/utils/artistDots";
import { isWorkItemFilteredOut } from "@/utils/workCardFilter";
import { VIS_NUCLEUS_RADIUS } from "@/utils/constants.ts";

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
        <main>
          <LoadingScreen />
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
        <LoadingScreen />
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
  const artistVisRef = useRef<ArtistVisHandle>(null);
  const { selectedIds, triggerNewSelection } = useArtistSelection();
  const { isWorkFilteredOut, isAttributionFilteredOut } = useArtistFilter();

  // the works selected in the visualisation come first, in the order they were selected (as the
  // overview's artists do); then the others, with the ones the filters leave out last, each
  // group in its own order
  const orderedWorks = useMemo(() => {
    const byId = new Map(state.worksList.map((w) => [w.id, w]));
    const selected = [...selectedIds].flatMap((id) => byId.get(id) ?? []);
    const kept: WorkItem[] = [];
    const filteredOut: WorkItem[] = [];
    for (const w of state.worksList) {
      if (selectedIds.has(w.id)) continue;
      (isWorkItemFilteredOut(
        w,
        artistId,
        isWorkFilteredOut,
        isAttributionFilteredOut,
      )
        ? filteredOut
        : kept
      ).push(w);
    }
    return [...selected, ...kept, ...filteredOut];
  }, [
    state.worksList,
    artistId,
    isWorkFilteredOut,
    isAttributionFilteredOut,
    selectedIds,
  ]);


  // a new selection puts its card at the top of the list: go up to it, whatever the scroll
  useEffect(() => {
    if (!triggerNewSelection) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    listRef.current?.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [triggerNewSelection]);

  const dotSpecs = useMemo(
    () => getArtistDotSpecs(state.worksList, artistId),
    [state.worksList, artistId],
  );
  const dotsLength = dotSpecs.length;

  // Ceiling from the overall dot count (keeps the tiers from crowding)...
  const thresholdMultiplier =
    dotsLength >= 500
      ? 2.25
      : dotsLength >= 450
        ? 2.5
        : dotsLength >= 400
          ? 2.75
          : dotsLength >= 300
            ? 3
            : dotsLength >= 200
              ? 3.25
              : 4;

  // Anonymous artists have thousands of dots and almost none outside the nucleus, so
  // their vis is nucleus-only and the nucleus grows until the dots fit at the standard
  // size (as far as the canvas allows).
  const isAnonymous = dotSpecs.length > 0 && dotSpecs[0].isAnonymousArtist;
  const nucleusRadius = useMemo(
    () => (isAnonymous ? fitNucleusRadius(dotSpecs) : VIS_NUCLEUS_RADIUS),
    [isAnonymous, dotSpecs],
  );

  // the single outer ring of an anonymous artist's vis (always drawn, for dots with a
  // relation qualifier, e.g. "falso"); everyone else keeps the four tiers
  const outerRingRadius = useMemo(
    () => fitOuterRingRadius(dotSpecs, nucleusRadius),
    [dotSpecs, nucleusRadius],
  );

  const multiplier = useMemo(
    () =>
      isAnonymous
        ? // no tier rings to protect, so the ladder doesn't apply: only shrink the dots
          // if even the biggest nucleus the canvas allows can't hold them
          fitNucleusMultiplier(dotSpecs, nucleusRadius)
        : // ...which the nucleus fit can only shrink further: the nucleus is a
          // hard-edged space, so how many dots fit depends on their sizes, not just
          // on how many there are
          Math.min(thresholdMultiplier, fitNucleusMultiplier(dotSpecs)),
    [isAnonymous, nucleusRadius, thresholdMultiplier, dotSpecs],
  );

  return (
    <main className="artist-layout page-layout">
      <div className="artist-left page-side-panel side-panel-glass">
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
        <Link to={`/?artist=${artistId}`} className="button-link">
          View in artists overview
        </Link>
        <ArtistLegend
          multiplier={multiplier}
          nucleusOnly={isAnonymous}
          outerRing={outerRingRadius !== null}
        />
      </div>
      <ArtistVis
        ref={artistVisRef}
        key={artistId}
        artistId={artistId ?? ""}
        works={state.worksList}
        multiplier={multiplier}
        nucleusRadius={nucleusRadius}
        nucleusOnly={isAnonymous}
        outerRingRadius={outerRingRadius}
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
        {orderedWorks.map((workItem) => (
          <WorkCard
            key={workItem.id}
            workItem={workItem}
            artistId={artistId ?? ""}
          />
        ))}
      </div>
    </main>
  );
}
