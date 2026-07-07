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
        Timeline
      </button>
    </div>
  );
}

function AttributionsSection({
  currentAttributions,
  work,
  acceptedDating,
  discardedDating,
}: {
  currentAttributions: AttributionsBundle;
  work: Work;
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
}) {
  const artists = useArtists(currentAttributions.attributions);
  const [view, setView] = useState<View>("attributions");

  return (
    <>
      
      <div className="table-container">
        <div className="table-description">
          <h3>Attribution debate</h3>
          <p>
          Attributing a painting is an interpretive act. Each entry here records who proposed it, whether the Federico Zeri Foundation accepts it today, and how reliable the source was. The diagram maps the critical debate; the table below unpacks them row by row.<br/>
          <span className="keyword">Expand any row</span> to explore its evidence and sources. <span className="keyword">Toggle</span>{" "} between <span className="keyword">attribution records</span> and a{" "} <span className="keyword">timeline</span> comparing the artist's life with the work's proposed dates.
          
          </p>
        </div>
        <TableSwitcher view={view} setView={setView} />
        {view === "attributions" ? (
          <ArtistsMetaTable
            artists={artists}
            workTitle={work.title}
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
      <div>
        <h3>Bibliography</h3>
        <p>
          Bibliographic references for attributions and debate related to this work:
        </p>
        <ul>
          {work.bibliography.map((ref, index) => (
            <li key={index}>{ref.author + ", " + ref.title + ", " + ref.date}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default AttributionsSection;
