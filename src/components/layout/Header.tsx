import { Link } from "react-router-dom";
import AttributionCircle from "../work/attributions/AttributionCircle";

export default function Header() {
  return (
    <nav id="nav">
      <Link to={`/`}>
      <svg width="40" height="20" viewBox="0 0 40 20">
        <g transform="translate(10, 10)">
                    <AttributionCircle type="artist" fill="var(--color-accepted)" r={10} />
          </g>

          <g transform="translate(20, 10)">
          <AttributionCircle type="artist" fill="var(--color-discarded)" r={10} />
        </g>
      
      </svg>
       </Link>
    </nav>
  );
}
