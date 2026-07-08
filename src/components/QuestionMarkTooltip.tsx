import { useState, useRef } from "react";
import { createPortal } from "react-dom";

type TooltipPos = {
  top: number;
  left: number;
};

function Tooltip({
  qualifier,
  author,
  coord,
}: {
  qualifier: string;
  author: string;
  coord: TooltipPos;
}) {
  return createPortal(
    <div
      className="info-tooltip"
      style={{
        position: "fixed",
        bottom: `calc(100vh - ${coord.top}px + 0.5rem)`,
        left: `calc(${coord.left}px + 1rem)`,
      }}
    >
      <p>
        This attribution refers to{" "}
        <span className="keyword">
          "{author}
          {", "}
          {qualifier}"
        </span>
        . Life dates shown are <span className="keyword">{author}</span>'s only.
      </p>
    </div>,
    document.body,
  );
}

export default function QuestionMarkTooltip({
  qualifier,
  author,
}: {
  qualifier: string;
  author: string;
}) {
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!spanRef.current) return;
    const rect = spanRef.current.getBoundingClientRect();
    setPos({
      top: rect.top,
      left: rect.left,
    });
  };

  return (
    <>
      {pos && (
        <Tooltip
          qualifier={qualifier}
          author={author}
          coord={pos} /*pass boundingbox position*/
        />
      )}
      <span
        ref={spanRef}
        className="info-tooltip-act"
        data-tooltip={author + ": " + qualifier}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseEnter={() => {
          handleMouseEnter();
        }}
        onMouseLeave={() => {
          setPos(null);
        }}
      >
        ?
      </span>
    </>
  );
}
