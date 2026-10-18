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
  
  return (
    <Link
      to={`/artist/${author.local_id}`}
      className="arrow-link"
      onClick={(e) => e.stopPropagation()} /* don't toggle the row */
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {formatAuthorLabel(author)}
      <span className="arrow-link-arrow" aria-hidden="true">
        <ArrowIcon />
      </span>
    </Link>
  );
}
