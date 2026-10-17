import { createBrowserRouter, redirect } from "react-router-dom";
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

const ABOUT_SEEN_KEY = "aboutSeen";

function openAboutOnFirstVisit({ request }: LoaderFunctionArgs) {
  try {
    if (sessionStorage.getItem(ABOUT_SEEN_KEY)) return null;
    sessionStorage.setItem(ABOUT_SEEN_KEY, "1");
  } catch {
    return null; // storage blocked (private mode…): skip the intro rather than fail
  }

  const url = new URL(request.url);
  if (url.searchParams.has("about")) return null; // already open
  url.searchParams.set("about", "");
  return redirect(url.pathname + url.search);
}


export const router = createBrowserRouter([
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
