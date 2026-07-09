import { Link } from "react-router-dom";
import ArrowIcon from "./ArrowIcon";

export default function ArrowLink({
  target,
  artistName = "",
  relation = "",
  uncertainty = "",
  isAnonym = false,
  onMouseEnter,
  onMouseLeave,
}: {
  target: string;
  artistName?: string;
  relation?: string;
  uncertainty?: string;
  isAnonym?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  if (isAnonym) {
    return (
      <span className="anonymous-artist">
        {artistName && artistName +
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {artistName +
        (relation ? ", " + relation : "") +
        (uncertainty ? " " + uncertainty : "")}
      <span className="arrow-link-arrow" aria-hidden="true">
        <ArrowIcon />
      </span>
    </Link>
  );
}
