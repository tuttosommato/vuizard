import AttributionCircle from "@/components/work/attributions/AttributionCircle";
import { Fragment } from "react";
import { useArtistFilter } from "@/stores/ArtistFilterContext";

// One relation qualifier: its English term from the Getty vocabulary (linked), then the Italian
// terms the catalogue uses for it, in italics
function Qualifier({
  term,
  aat,
  italian,
  children,
}: {
  term: string;
  aat: string;
  italian: string[];
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        className="in-text-a keyword"
        href={`http://vocab.getty.edu/page/aat/${aat}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {term}
      </a>{" "}
      (
      {italian.map((word, i) => (
        <Fragment key={word}>
          {i > 0 && ", "}
          <em>{word}</em>
        </Fragment>
      ))}
      ): {children}
    </li>
  );
}

const assistantTo = (
  <Qualifier
    term="assistant to"
    aat="300404278"
    italian={["e aiuti", "e collaboratori", "e scuola", "e seguaci"]}
  >
    the artist, recorded together with unidentified collaborators. The forms
    built with the Italian conjunction <em>e</em> (and) state that the work was
    made by the artist named, who was principally responsible for it, in
    collaboration with others of the workshop whose identity is unknown:
    assistants within the atelier, or someone who worked shortly after.
  </Qualifier>
);

const workshopOf = (
  <Qualifier term="workshop of" aat="300404274" italian={["bottega"]}>
    an unknown creator working under the master's name, generally within a
    system of apprenticeship.
  </Qualifier>
);

const circleOf = (
  <Qualifier
    term="circle of"
    aat="300404283"
    italian={["ambito", "cerchia", "collaboratore"]}
  >
    an unknown creator who appears to be associated with the named artist,
    living at the same time and probably in some contact, though not
    necessarily a pupil.
  </Qualifier>
);

const followerOf = (
  <Qualifier
    term="follower of"
    aat="300404282"
    italian={["seguace", "seguaci"]}
  >
    an unknown creator whose style is strongly influenced by the named artist,
    living at the same time or shortly after, though not necessarily a pupil.
  </Qualifier>
);

const schoolOf = (
  <Qualifier term="school of" aat="300404284" italian={["scuola"]}>
    an unknown creator whose style is influenced by the named artist or by that
    artist's associates, living at the same time or shortly after, and not
    known to be a pupil or direct follower.
  </Qualifier>
);

const mannerOf = (
  <Qualifier term="manner of" aat="300404288" italian={["maniera"]}>
    an unknown creator whose style, or elements of it, come somewhat close to
    that of the named artist without appearing to be a deliberate copy, and who
    generally lived later.
  </Qualifier>
);

const after = (
  <Qualifier term="after" aat="300404286" italian={["copia da"]}>
    an unknown creator who copied a known work of the named artist.
  </Qualifier>
);

const otherQualifiers = (
  <li>
    Other qualifiers are more marginal: <em>falso</em> is a deliberate
    imitation passed off as the work of the artist named, <em>calco da</em> a
    cast taken from one of that artist's works, and <em>stile</em> a work by an
    unidentified hand executed in that artist's style.
  </li>
);

export default function ArtistLegend({
  multiplier,
  nucleusOnly = false,
  outerRing = false,
}: {
  multiplier: number;
  // anonymous artists: no tier rings, so position only tells documented from interpreted
  nucleusOnly?: boolean;
  // anonymous artists whose vis has an outer ring for dots with a relation qualifier
  outerRing?: boolean;
}) {
  const {
    sizeValues,
    hiddenSizes,
    handleSizeFilter,
    handleUncertaintyFilter,
    uncertaintyRange,
    acceptanceRange,
    handleAcceptanceFilter,
  } = useArtistFilter();

  // same sqrt encoding (and * 2 for a meaningful size) the vis circles use, so
  // each toggle doubles as a size key
  const diameterOf = (value: number) => Math.sqrt(value) * multiplier * 2;
  // every toggle's circle sits in a slot as tall as the biggest one, so the
  // number labels line up on one row
  const slotPx = Math.max(0, ...sizeValues.map(diameterOf));

  return (
    <div className="artist-legend legend">
      <h2>Legend and filters</h2>
      <div className="legend-items-cnt">
        <div className="acceptance-legend-items">
          <h3>Attribution status</h3>
          <label className="accepted-legend-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={!acceptanceRange.has("accepted")}
              onChange={() => handleAcceptanceFilter("accepted")}
            />
            <div className="svg-span-cnt">
              <svg viewBox="0 0 16 16">
                <AttributionCircle
                  type="artist"
                  fill="var(--color-accepted)"
                  r={8}
                />
              </svg>
              <span className="legend-label">Accepted attribution</span>
            </div>
          </label>
          <label className="discarded-legend-item label-cnt">
            <input
              type="checkbox"
              className="legend-checkbox"
              checked={!acceptanceRange.has("discarded")}
              onChange={() => handleAcceptanceFilter("discarded")}
            />
            <div className="svg-span-cnt">
              <svg viewBox="0 0 16 16">
                <AttributionCircle
                  type="artist"
                  fill="var(--color-discarded)"
                  r={8}
                />
              </svg>
              <span className="legend-label">Discarded attribution</span>
            </div>
          </label>
        </div>

        <div className="uncertainty-legend-items">
          <h3>Attribution uncertainty</h3>
          <div className="uncertainty-items-cnt">
            <label className="uncertainty-legend-item label-cnt">
              <input
                type="checkbox"
                className="legend-checkbox"
                checked={!uncertaintyRange.has("certain")}
                onChange={() => handleUncertaintyFilter("certain")}
              />
              <div className="svg-span-cnt">
                <svg viewBox="0 0 16 16">
                  <AttributionCircle type="artist" fill="var(--color-text)" r={8} />
                </svg>
                <span className="legend-label">Confident identification</span>
              </div>
            </label>
            <label className="uncertainty-legend-item label-cnt">
              <input
                type="checkbox"
                className="legend-checkbox"

                checked={!uncertaintyRange.has("probably")}
                onChange={() => handleUncertaintyFilter("probably")}
              />
              <div className="svg-span-cnt">
                <svg viewBox="0 0 16 16">
                  <AttributionCircle
                    type="artist"
                    fill="url(#uncertain-legend-1)"
                    r={8}
                  />
                </svg>
                <span className="legend-label">Probable identification<br /><span className="legend-xs">(likely the artist)</span></span>
              </div>

            </label>
            <label className="uncertainty-legend-item label-cnt">
              <input
                type="checkbox"
                className="legend-checkbox"
                checked={!uncertaintyRange.has("uncertain")}
                onChange={() => handleUncertaintyFilter("uncertain")}
              />
              <div className="svg-span-cnt">
                <svg viewBox="0 0 16 16">
                  <AttributionCircle
                    type="artist"
                    fill="url(#uncertain-legend-2)"
                    r={8}
                  />
                </svg>
                <span className="legend-label">Uncertain identification<br /><span className="legend-xs">(possibly the artist)</span></span>
              </div>
            </label>
          </div>
        </div>

        <div className="size-legend-items">
          <h3>Number of attributions</h3>
          <div
            className="size-toggles"
            style={{ "--size-toggle-slot": `${slotPx}px` } as React.CSSProperties}
          >
            {sizeValues.map((value) => (
              <button
                key={value}
                type="button"
                className="size-toggle"
                aria-pressed={!hiddenSizes.has(value)}
                aria-label={`Works with ${value} attribution${value !== 1 ? "s" : ""}`}
                onClick={() => handleSizeFilter(value)}
              >
                <span className="size-toggle-circle-cnt">
                  <span
                    className="size-toggle-circle"
                    style={{ width: diameterOf(value), height: diameterOf(value) }}
                  />
                </span>
                <span className="size-toggle-label">{value}</span>
              </button>
            ))}
          </div>
          <p className="circle-legend-note">
            Each <span className="keyword">circle</span> is a single{" "}
            <span className="keyword">attribution record</span>. Its{" "}
            <span className="keyword">size</span> shows how many attribution
            records the related work has in total.
          </p>
        </div>
        <div className="position-legend-items">
          <h3>Position</h3>
          <p className="legend-caption">
            {nucleusOnly ? (
              <>
                A circle's <span className="keyword">position</span> shows
                whether the attribution rests on{" "}
                <span className="keyword">documentation</span> (above the dashed
                line) or on <span className="keyword">interpretation</span>{" "}
                (below it).
                {outerRing && (
                  <>
                    {" "}
                    The <span className="keyword">outer ring</span> holds the
                    attributions that carry a{" "}
                    <span className="keyword">relation qualifier</span>, explained
                    below.
                  </>
                )}
              </>
            ) : (
              <>
                The Zeri catalogue records attributions to {" "}
                <span className="keyword">known authors</span>, to whom <span className="keyword">qualifiers</span> are often attached, to say that the work is not exactly by them, but by an unknown creator recognised as having some relation to them. The visualisation maps these qualifiers onto rings: in the{" "}
                <span className="keyword">nucleus</span> are the attributions to
                the artist named on this page. The{" "}
                <span className="keyword">rings</span> around it hold the
                attributions to anonymous creators related to the artist, and the
                closer a ring is to the nucleus, the closer that creator is to the
                artist. From the nearest, the rings position attributions holding the following qualifiers:
              </>
            )}{" "}
            {nucleusOnly && (
              <>
                A work with several attributions naming the artist appears as{" "}
                <span className="keyword">several circles</span>, which are
                connected <span className="keyword">hovering</span> or{" "}
                <span className="keyword">selecting</span> one.
              </>
            )}
          </p>
          {nucleusOnly ? (
            <ul className="qualifier-list">
              {assistantTo}
              {workshopOf}
              {circleOf}
              {followerOf}
              {schoolOf}
              {mannerOf}
              {after}
              {otherQualifiers}
            </ul>
          ) : (
            <ol className="qualifier-list qualifier-levels">
              <li>
                <span className="keyword">The artist and collaborating anonyms</span>
                <ul>{assistantTo}</ul>
              </li>
              <li>
                <span className="keyword">
                  Anonyms who worked directly with the artist
                </span>
                <ul>{workshopOf}</ul>
              </li>
              <li>
                <span className="keyword">
                  Anonyms who didn't work directly with the artist
                </span>
                <ul>
                  {followerOf}
                  {schoolOf}
                  {circleOf}
                </ul>
              </li>
              <li>
                <span className="keyword">
                  Anonyms influenced by the known artist
                </span>
                : all the other qualifiers.
                <ul>
                  {mannerOf}
                  {after}
                  {otherQualifiers}
                </ul>
              </li>
            </ol>
          )}
          <p className="circle-legend-note">
            Any of these relations can also carry{" "}
            <span className="keyword">uncertainty</span>, when the unidentified
            hand is only probably related to the named artist. Such records are
            rarer, and are marked as in the{" "}
            <span className="keyword">attribution uncertainty</span> key above.
            {!nucleusOnly && (
              <>
                {" "}
                A work with several attributions naming the artist appears as{" "}
                <span className="keyword">several circles</span>, which are
                connected when you <span className="keyword">hover</span> or{" "}
                <span className="keyword">select</span> one.
              </>
            )}
          </p>
        </div>
      </div>
    </div>

  );
}
