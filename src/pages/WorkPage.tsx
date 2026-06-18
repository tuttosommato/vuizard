import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getWork, getAttributions } from "@/data/api";
import type { Work } from "@/types/works";
import type { AttributionsBundle } from "@/types/attributions";
import WorkHeader from "@/components/work/WorkHeader";
import AttributionsSection from "@/components/work/attributions/AttributionsSection";
import DebateVis from "@/components/work/attributions/debateVis/DebateVis";
import NotFoundPage from "@/pages/NotFoundPage";
import "@/styles/work.css";

type FetchOrigin = "work" | "attributions";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; work: Work; attributions: AttributionsBundle }
  | { status: "not-found" }
  | { status: "error"; origin: FetchOrigin; message: string };

function WorkPage() {
  const { workId } = useParams<{ workId: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!workId) return;
    let canceled = false;

    // define fetching Promises
    const workP = getWork(workId).catch((e: unknown) => {
      throw {
        origin: "work" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    });
    const attrP = getAttributions(workId).catch((e: unknown) => {
      throw {
        origin: "attributions" as const,
        message: e instanceof Error ? e.message : String(e),
      };
    });

    Promise.all([workP, attrP])
      .then(([work, attributions]) => {
        if (canceled) return;
        if (work === null || attributions === null) {
          setState({ status: "not-found" });
        } else {
          setState({ status: "loaded", work, attributions });
        }
      })
      .catch((e: { origin: FetchOrigin; message: string }) => {
        if (canceled) return;
        setState({
          status: "error",
          origin: e.origin,
          message: e.message,
        });
      });

    return () => {
      canceled = true; // clean up: if another workId is loaded before this one finishes, we ignore the result of this load to prevent showing the wrong work or an error message from a previous load
    };
  }, [workId]);

  if (!workId) {
    return (
      <NotFoundPage
        title="Work not found"
        message={`No work exists with ID “${workId}”.`}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <>
        <title>Loading…</title>
        <main className="work-layout">
          <p>Loading work…</p>
        </main>
      </>
    );
  }

  if (state.status === "not-found") {
    return (
      <NotFoundPage
        title="Work not found"
        message={`No work exists with ID “${workId}”.`}
      />
    );
  }

  if (state.status === "error") {
    return (
      <>
        <title>Error</title>
        <main>
          <h1>Could not load work</h1>
          <p role="alert" style={{ color: "var(--color-discarded)" }}>
            {state.message}
          </p>
        </main>
      </>
    );
  }

  const currentWork = state.work;
  const currentAttributions = state.attributions;

  return (
    <>
      <title>{currentWork.title}</title>
      <meta
        name="description"
        content={`Catalogue entry for ${currentWork.title}.`}
      />

      <main className="work-layout">
        <section className="work-left">
          <WorkHeader currentWork={currentWork} />
          <AttributionsSection
            workTitle={currentWork.title}
            currentAttributions={currentAttributions}
          />
          {/* <CriticalDebateTimeline /> */}
        </section>
        <section className="work-right">
          {/* <VisLegend />*/}
          <DebateVis currentAttributions={currentAttributions} />
        </section>
      </main>
    </>
  );
}

export default WorkPage;
