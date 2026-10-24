import { Link } from "react-router-dom";
import ArrowIcon from "@/components/ArrowIcon";
import type { AttributionAuthor } from "@/types/attributions";
import { formatAuthorLabel } from "@/components/work/attributions/utils";

export default function ArrowLink({
  noLink = false,
  onMouseEnter,
  onMouseLeave,
  author,
}: {
  // just the name, not a link: for the artist whose own page this is (anonymous artists have
  // pages too, so they are linked like anyone else)
  noLink?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  author: AttributionAuthor;
}) {
  if (noLink) {
    return (
      <span className="anonymous-artist">
        {formatAuthorLabel(author)}
      </span>
    );
  }
  
  // the last word goes with the arrow in a no-break piece: the arrow never ends up alone on a
  // line of its own
  const label = formatAuthorLabel(author);
  const cut = label.lastIndexOf(" ") + 1;

  return (
    <Link
      to={`/artist/${author.local_id}`}
      className="arrow-link"
      onClick={(e) => e.stopPropagation()} /* don't toggle the row */
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {label.slice(0, cut)}
      <span className="arrow-link-tail">
        {label.slice(cut)}
        <span className="arrow-link-arrow" aria-hidden="true">
          <ArrowIcon />
        </span>
      </span>
    </Link>
  );
}
