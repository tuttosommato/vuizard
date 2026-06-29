import { Link } from "react-router-dom";

export default function ArrowLink({
  target,
  artistName,
  relation = "",
  uncertainty = "",
  isAnonym = false,
}: {
  target: string;
  artistName: string;
  relation?: string;
  uncertainty?: string;
  isAnonym?: boolean;
}) {
  if (isAnonym) {
    return (
      <span className="anonymous-artist">
        {artistName +
          (relation ? ", " + relation : "") +
          (uncertainty ? " " + uncertainty : "")}
      </span>
    );
  }

  return (
    <Link
      to={target}
      className="arrow-link"
      onClick={(e) => e.stopPropagation()} /* don't toggle the row */
    >
      {artistName +
        (relation ? ", " + relation : "") +
        (uncertainty ? " " + uncertainty : "")}
      <span className="arrow-link-arrow" aria-hidden="true">
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
