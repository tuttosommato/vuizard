import type { AttributionsBundle } from "@/types/attributions";
import type { Work } from "@/types/works";
import ArtistsMetaTable from "./ArtistsMetaTable";
import useArtists from "@/hooks/useArtists";
import { useState } from "react";
import ArtistsLifeTable from "./ArtistsLifeTable";

type View = "attributions" | "artists";

function TableSwitcher({
  view,
  setView,
}: {
  view: View;
  setView: (view: View) => void;
}) {
  return (
    <div className="table-switch" data-active={view}>
      <button
        className="toggle-button"
        type="button"
        aria-pressed={view === "attributions"}
        onClick={() => setView("attributions")}
      >
        Attributions
      </button>
      <button
        className="toggle-button"
        type="button"
        aria-pressed={view === "artists"}
        onClick={() => setView("artists")}
      >
        Artists life
      </button>
    </div>
  );
}

function AttributionsSection({
  currentAttributions,
  workTitle,
  acceptedDating,
  discardedDating,
}: {
  currentAttributions: AttributionsBundle;
  workTitle: string;
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
}) {
  const artists = useArtists(currentAttributions.attributions);
  const [view, setView] = useState<View>("attributions");

  return (
    <>
      <div>
        <h3>The attribution debate</h3>
        <p> Attributing a painting to an artist is an interpretive act shaped by evidence, scholarly judgment, and frequently long-running debate. Each attribution recorded here surfaces four elements: <em>who</em> is proposed, <em>whether</em> the proposal is accepted or discarded today by the Federico Zeri Foundation, <em>what reason</em> supports it, and <em>how certain</em> the attributing source was. The visualisation on the right arranges these dimensions around the work, also showing potential similarities between the artists when available; the table below unpacks them them row by row.
        </p>
      </div>

      <div className="table-container">
        <h4>Switch table content</h4>
        <p>Interact with the tables below to expand and view different aspects of the attribution data and changes in the visualisation. Click on the artist names to go to their production view.</p>
        <TableSwitcher view={view} setView={setView} />
        {view === "attributions" ? (
          <ArtistsMetaTable
            artists={artists}
            workTitle={workTitle}
            currentAttributions={currentAttributions}
          />
        ) : (
          <ArtistsLifeTable
            artists={artists}
            currentAttributions={currentAttributions}
            acceptedDating={acceptedDating}
            discardedDating={discardedDating}
          />
        )}
      </div>
    </>
  );
}

export default AttributionsSection;
