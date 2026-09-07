import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const isArtist = location.pathname.includes("artist");
  const isWork = location.pathname.includes("work");

  return (
    <nav id="nav">
      <div className="nav-toolbar-cnt">
        <div title="About" className="about-icon">
          i
        </div>
        <div title="How to read" className="helper-icon">
          ?
        </div>
      </div>
      <div className="nav-levels-cnt">
        <Link to="/">
          <div
            className={`nav-level nav-level-1${!isArtist && !isWork ? " level-active" : ""}`}
          >
            I
          </div>
        </Link>
        <Link to="/artist">
          <div
            className={`nav-level nav-level-2${isArtist ? " level-active" : ""}`}
          >
            II
          </div>
        </Link>
        <Link to="/work">
          <div
            className={`nav-level nav-level-3${isWork ? " level-active" : ""}`}
          >
            III
          </div>
        </Link>
      </div>
      {/*placeholder*/}
      <div></div>
    </nav>
  );
}
