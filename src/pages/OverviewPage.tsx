import type { Artist } from "@/types/artists";
import type { AuthorsCoBundle } from "@/types/coOccurrences";
import { useState, useEffect } from "react";
import { getAllAuthors, getAllAuthorsCo } from "@/data/api";

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

  return (
    <>
      <title>Artists overview</title>
      <meta
        name="description"
        content="Overview of all artists in the catalogue."
      />

      <main className="overview-layout">
        <p>Carichi</p>
      </main>
    </>
  );
}
