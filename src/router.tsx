import { createHashRouter, redirect } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";
import App from "@/App";
import WorkPage from "@/pages/WorkPage";
import SearchPage from "@/pages/SearchPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ErrorPage from "@/pages/ErrorPage";
import ArtistPage from "@/pages/ArtistPage";
import OverviewPage from "@/pages/OverviewPage";
import ArtistListPage from "@/pages/ArtistListPage";
import WorkListPage from "@/pages/WorkListPage";
import {
  enteredSiteAtRoot,
  hasSeenAbout,
  markAboutSeen,
} from "@/utils/aboutSeen";

// decided once, as the app starts: was the site entered at "/", asking for nothing in particular?
const ENTERED_AT_ROOT = enteredSiteAtRoot();

// About opens by itself only for that kind of entry, once per session: not when moving to the
// overview from inside the app (the nav, a link from an artist page), which would put a
// welcome over the page someone just asked for. Others are invited by a hint on the button.
function openAboutOnFirstVisit({ request }: LoaderFunctionArgs) {
  if (!ENTERED_AT_ROOT || hasSeenAbout()) return null;
  markAboutSeen();

  const url = new URL(request.url);
  if (url.searchParams.has("about")) return null; // already open
  url.searchParams.set("about", "");
  return redirect(url.pathname + url.search);
}

// A hash router (addresses like .../vuizard/#/artist/6): the route sits after the "#", which
// is never sent to the server and doesn't change what relative paths resolve against. So the
// app works from any folder, needs no server rule for deep links, and every path in it
// (the data, the built files) can be relative.
export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
        loader: openAboutOnFirstVisit,
      },
      {
        path: "search-work",
        element: <SearchPage />,
      },
      {
        path: "work/",
        element: <WorkListPage />,
      },
      {
        path: "work/:workId",
        element: <WorkPage />,
      },
      {
        path: "artist/",
        element: <ArtistListPage />,
      },
      {
        path: "artist/:artistId",
        element: <ArtistPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
