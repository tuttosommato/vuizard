import { Link } from "react-router-dom";
import ArrowIcon from "@/components/ArrowIcon";
import type { ReactNode } from "react";

// A card's real link: the card's title is an ordinary <a>, stretched by CSS over the whole card
// (see .work-card-link in artist.css), so the card is a link for the keyboard, the context menu
// and "open in a new tab", without the nested anchors a card-wide <a> would make around the
// artist links inside it. Without `to` (a card that isn't a link) it is just the title.
export function CardTitle({
  to,
  className = "work-card-title",
  children,
}: {
  to?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h4 className={className}>
      {to ? (
        <Link to={to} className="work-card-link">
          {children}
        </Link>
      ) : (
        children
      )}
    </h4>
  );
}

// the arrow that comes in on hovering a card that is a link
export function CardOpenArrow() {
  return (
    <span className="work-card-open-arrow" aria-hidden="true">
      <ArrowIcon size={20} stroke={1.5} />
    </span>
  );
}
