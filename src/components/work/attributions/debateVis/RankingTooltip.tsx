import { useEffect } from "react";
import { createPortal } from "react-dom";
import Switch from "@/components/work/Switch";

// The explanation opened by the "?" next to the visualisation. Two tabs: how the sources of an
// attribution are ranked (which sets the distance from the centre, and the order when the
// attributions are ordered by source authoritativeness) and what governs the order in which the
// catalogue lists them. Both panels are laid out on top of each other so the tooltip keeps the
// height of the taller one when the tab changes.
export type RankingTab = "authoritativeness" | "catalogue";

// A link that switches the tab, set like the links in the text of the About overlay: in the text
// colour, underlined, and in the highlight colour on hover (see .ranking-tab-link in work.css).
function TabLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="in-text-a ranking-tab-link"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function RankingTooltip({
  tab,
  setTab,
  x,
  onClose,
}: {
  tab: RankingTab;
  setTab: (tab: RankingTab) => void;
  onClose: () => void;
  x: number; // where the trigger's right edge is: the tooltip opens just after it
}) {
  // Escape, or a click anywhere outside it, closes it. (The "?" circles that open it close it
  // themselves, and the page behind is dimmed and inert, see work.css.)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          ".ranking-explanation-tooltip, .axis-info-trigger, .ordering-info-trigger",
        )
      )
        return;
      onClose();
    };
    // the page behind doesn't scroll while it is open (the tooltip's own scrolling is left alone)
    const blockScroll = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(".ranking-explanation-tooltip"))
        event.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("wheel", blockScroll, { passive: false });
    document.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("wheel", blockScroll);
      document.removeEventListener("touchmove", blockScroll);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="ranking-explanation-tooltip"
        style={{ position: "fixed", left: x + 10 }}
      >
        <Switch
          currentState={tab}
          setNewState={setTab}
          options={[
            { value: "catalogue", label: "About the catalogue order" },
            {
              value: "authoritativeness",
              label: "About source authoritativeness",
            },
          ]}
        />
        <div className="ranking-explanation-panels">
          <div
            className="ranking-explanation-panel"
            aria-hidden={tab !== "authoritativeness"}
            data-active={tab === "authoritativeness"}
          >
            <p className="ranking-explanation-p">
              Each <span className="keyword">attribution</span> is positioned
              according to{" "}
              <span className="keyword">how authoritative its sources are</span>{" "}
              (the closer to the centre, the more authoritative). The{" "}
              <span className="keyword">ranking</span> we used was built with
              the Fondazione Zeri, and separates{" "}
              <span className="keyword">objective evidence</span> from{" "}
              <span className="keyword">subjective attributions</span>.
            </p>
            <p className="ranking-explanation-p ranking-explanation-note">
              The <span className="keyword">ranking</span> itself is an{" "}
              <span className="keyword">interpretation</span>, built to make
              attributions comparable, not to measure truth. Roughly grouped
              from most to least authoritative, the categories include:
            </p>

            <div className="reason-type-groups">
              <div className="reason-type-cnt">
                <p className="reason-type-item-label">Objective evidence</p>
                <div className="objective-list-cnt">
                  <p>
                    Artist's signature; <br />
                    Documentation
                  </p>
                </div>
              </div>

              <div className="reason-type-cnt">
                <p className="reason-type-item-label">
                  Subjective attributions
                </p>
                <div className="reason-type-list-cnt">
                  <div className="zeri-list-cnt">
                    <p>F. Zeri attribution; F. Zeri bibliography</p>
                    <p>
                      F. Zeri note on the photograph; F. Zeri classification
                    </p>
                  </div>
                  <div className="subjective-list-cnt">
                    <p>Bibliography</p>
                    <p>Archival classification</p>
                    <p>Scholar's attribution</p>
                    <p>
                      Scholar's note on the photograph; Sigla; Museum
                      attribution; Inscription
                    </p>
                    <p>
                      Collection attribution; Traditional attribution; Auction
                      attribution; Market attribution
                    </p>
                    <p>Anonymous note on the photograph; Stylistic analysis</p>
                    <p>False signature; Caption on photograph; Other</p>
                    <p>None</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="ranking-explanation-p">
              Among subjective attributions,{" "}
              <span className="keyword">Zeri's own judgment</span> carries the
              most weight, reflecting a convention in connoisseurship archives,
              where the archive's own creator, whose eye and method shaped the
              collection in the first place, is treated as a{" "}
              <span className="keyword">privileged interpretive voice</span>{" "}
              when objective evidence is lacking, often enough to tip an
              attribution toward being accepted.
            </p>
            <p className="ranking-explanation-p ranking-explanation-note">
              This ranking also sets the order of the attributions when{" "}
              <span className="keyword">By source authoritativeness</span> is
              selected. For the order in which the catalogue lists them, see{" "}
              <TabLink
                label="Catalogue order"
                onClick={() => setTab("catalogue")}
              />
              .
            </p>
          </div>

          <div
            className="ranking-explanation-panel"
            aria-hidden={tab !== "catalogue"}
            data-active={tab === "catalogue"}
          >
            <p className="ranking-explanation-p">
              In the <span className="keyword">catalogue order</span>, the
              attributions follow the sequence in which the catalogue records
              them, with the accepted attribution first. The grounds behind each
              attribution are recorded as the cataloguing standards require, but
              nothing in them establishes how to choose between such grounds, so
              the decision ultimately rests on the{" "}
              <span className="keyword">cataloguer's own judgement</span>, which
              is often based on research done during the cataloguing process.
            </p>
            <p className="ranking-explanation-p">
              The discarded attributions follow, listed in the{" "}
              <span className="keyword">implicit order</span> found in the
              Foundation's records. The internal rules prescribe reporting the
              alternative attributions{" "}
              <span className="keyword">
                from the most recent to the oldest
              </span>
              , above all where the year an attribution was made can be
              established (for example because it is tied to a text cited in the
              bibliography, to a dated expert opinion, or to the passage of the
              work through an auction). In practice, the rule has not always
              been followed, and where the motivation behind an attribution is
              generic (for example recording bibliography without naming an
              author and a year), cataloguers tend to enter the attributions
              resting on <span className="keyword">bibliography</span> first,
              followed by the ones considered{" "}
              <span className="keyword">less authoritative</span>.
            </p>
            <p className="ranking-explanation-p ranking-explanation-note">
              The sequence that can be encountered therefore mixes a{" "}
              <span className="keyword">chronological intention</span> with a{" "}
              <span className="keyword">judgement of authority</span>. For an
              explicit ranking of the motivations, see{" "}
              <TabLink
                label="Source authoritativeness"
                onClick={() => setTab("authoritativeness")}
              />
              .
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
