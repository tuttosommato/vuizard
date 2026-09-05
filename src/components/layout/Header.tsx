import { Link } from "react-router-dom";
import AttributionCircle from "@/components/work/attributions/AttributionCircle";

export default function Header() {
  return (
    <nav id="nav">
      <Link to={`/`}>
      <svg width="20" height="40" viewBox="0 0 20 40">
        <g transform="translate(10, 15)">
          <AttributionCircle type="artist" fill="var(--color-accepted)" r={10} />
        </g>

          <g transform="translate(10, 25)">
          <AttributionCircle type="artist" fill="var(--color-discarded)" r={10} />
        </g>
      
      </svg>
       </Link>
    </nav>
  );
}
