import { useEffect, useRef } from "react";
import useAboutOverlay from "@/hooks/useAboutOverlay";

export default function AboutOverlay() {
  const { open, closeAbout } = useAboutOverlay();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close, then hand the focus back to the nav button that opens the overlay
  const close = () => {
    closeAbout();
    document.querySelector<HTMLElement>(".nav-about")?.focus();
  };

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="about-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div className="about-overlay-content">
        <div className="about-overlay-text-cnt">
          <div className="about-overlay-title-cnt">
            <h1 id="about-title">Vuizard</h1>
            <p>
              Visualising uncertainty and interpretation in the Zeri
              Foundation’s attribution data
            </p>
            {/*Viewing Uncertainty In Zoomable Artworks’ Relations and Disputes*/}
            {/*View, Understand, Inspect, Zoom, Analyse, Read, Debate*/}
            {/*Verdicts, Uncertainty and Identities: Zooming into Attributions, Reasons and Disputes*/}

            <button
              type="button"
              className="button-link about-overlay-close"
              ref={closeButtonRef}
              onClick={close}
            >
              To the visualisation
            </button>
          </div>

          <div className="about-overlay-text">
            <h2>Context</h2>
            <p>
              The attribution of artworks to their authors is a central practice
              in art history. For a substantial part of the artistic heritage,
              the lack of signatures and documentary evidence has made
              authorship a matter of{" "}
              <span className="keyword">connoisseurship</span>. In this
              practice, the stylistic and qualitative features of a work are
              critically analysed to establish its author and the degree of
              autograph execution, or at least the historical and geographical
              context in which it was created. The same critical eye allows
              connoisseurs to distinguish authentic works from copies and
              forgeries. The hypotheses resulting from this practice, formulated
              by different scholars over time, frequently disagree with one
              another. Because this critical work has long relied on
              photographic reproductions,{" "}
              <span className="keyword">
                art historical photographic archives
              </span>{" "}
              remain a primary resource for attribution research today. In these
              archives, both the photographs of artworks and the attributions
              associated with them are classified and annotated.
            </p>
            <h2>Data</h2>
            <p>
              This platform presents attributions as recorded in the data of one
              such institution, the{" "}
              <a
                className="in-text-a"
                href="https://fondazionezeri.unibo.it/en/homepage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="keyword">Fondazione Federico Zeri</span>
              </a>
              . The Foundation preserves the photographic archive of the art
              historian Federico Zeri and catalogues the artworks it documents,
              for each of which, it records the{" "}
              <span className="keyword">accepted attribution</span> together
              with the <span className="keyword">discarded ones</span>, and the
              motivations supporting each. These data therefore embed a specific
              perspective on the artworks they describe:{" "}
              <span className="keyword">photographic</span> on one side, since
              the artworks are known and described through their reproductions;{" "}
              <span className="keyword">philological</span> on the other, since
              the catalogue takes Zeri's own work as its point of reference,
              giving his annotations and classifications a privileged weight.
            </p>
            <h2>The project</h2>
            <p>
              The platform was developed as part of a{" "}
              <a
                className="in-text-a"
                href="https://phd.unibo.it/chede/en"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="keyword">PhD project at the University of Bologna</span>
              </a>
              , using data kindly provided by the Fondazione Federico Zeri. It
              does not offer a complete or exhaustive representation of the Zeri
              catalogue, but focuses on{" "}
              <span className="keyword">attribution as a case study</span> for
              investigating how interpretive phenomena in the humanities can be
              visualised and used as a lens for exploring cultural heritage
              data.
            </p>
            <h2>The interface</h2>
            <p>
              The interface is organised into{" "}
              <span className="keyword">three views</span>, corresponding to
              three levels of granularity. The first view groups the artists in
              the dataset by the{" "}
              <span className="keyword">cultural context</span> reported by the
              Foundation. Their <span className="keyword">co-occurrence</span>{" "}
              in attributions of the same works reveals affinities between
              artists, and shows which were accepted or discarded in favour of
              others.
            </p>
            <p>
              The second view gathers all attributions related to a{" "}
              <span className="keyword">single artist</span>. It distinguishes
              attributions made directly to the artist from those made to
              related anonymous personalities, and{" "}
              <span className="keyword">interpretive attributions</span> from{" "}
              <span className="keyword">evidence-based</span> ones. It also
              shows the different{" "}
              <span className="keyword">degrees of certainty</span> with which
              the artist is identified.
            </p>
            <p>
              The third view presents the claims made on a{" "}
              <span className="keyword">single artwork</span>, together with the
              life dates of the artists involved and the dates proposed for the
              work. Here the attributions of different scholars appear as{" "}
              <span className="keyword">competing claims</span>, ordered through
              a <span className="keyword">ranking</span> originally developed to
              compare the attributions recorded by different institutions. The
              ranking brings to light the sources on which each attribution
              rests. It also shows that the weight of these sources is not
              absolute: it depends on context, and here it reflects the{" "}
              <span className="keyword">philological perspective</span> of the
              Foundation, in which Zeri's opinions carry greater weight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
