import type { AttributionsBundle } from "@/types/attributions";
import type { Work } from "@/types/works";
import AuthorsMetaTable from "./AuthorsMetaTable";
import useAuthors from "@/hooks/useAuthors";
import { useState } from "react";
import AuthorsLifeTable from "./AuthorsLifeTable";

type View = "attributions" | "authors";

function TableSwitcher({
  view,
  setView,
}: {
  view: View;
  setView: (view: View) => void;
}) {
  return (
    <div className="table-switch">
      <button
        type="button"
        aria-pressed={view === "attributions"}
        onClick={() => setView("attributions")}
      >
        Attributions info
      </button>
      <button
        type="button"
        aria-pressed={view === "authors"}
        onClick={() => setView("authors")}
      >
        Authors life info
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
  acceptedDating: Work["dating"]
  discardedDating: Work["dating"];
}) {
  const authors = useAuthors(currentAttributions.attributions);
  const [view, setView] = useState<View>("attributions");

  return (
    <>
      <div>
        <h3>Elements of attribution</h3>
        <p>
          The attributions presented here are reflecting the hierarchy established in the original descriptive sheet. We emphasize the importance of reliability, author recognisability, and the certainty inherent in these attributions. This list dissects the elements that define the interpretive act of attribution, offering a clearer understanding of their significance.
        </p>
      </div>

      <TableSwitcher view={view} setView={setView} />
      {view === "attributions" ? (
        <AuthorsMetaTable
          authors={authors}
          workTitle={workTitle}
          currentAttributions={currentAttributions}
        />
      ) : (
        <AuthorsLifeTable authors={authors} currentAttributions={currentAttributions} acceptedDating={acceptedDating} discardedDating={discardedDating} />
      )}
    </>
  );
}

export default AttributionsSection;
