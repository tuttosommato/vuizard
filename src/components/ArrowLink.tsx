import { Link } from "react-router-dom";

export default function ArrowLink( { target, artistName, relation = "", uncertainty = "" } : { target: string; artistName: string; relation?: string; uncertainty?: string } ) {
  return (
    <Link
      to={target}
      className="artist-link"
      onClick={(e) => e.stopPropagation()} /* don't toggle the row */
    >
      {artistName + (relation ? ", " + relation : "") + (uncertainty ? " " + uncertainty : "")}
      <span className="artist-link-arrow" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
