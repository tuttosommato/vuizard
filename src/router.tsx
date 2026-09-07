import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import WorkPage from "@/pages/WorkPage";
import SearchPage from "@/pages/SearchPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ErrorPage from "@/pages/ErrorPage";
import ArtistPage from "@/pages/ArtistPage";
import OverviewPage from "@/pages/OverviewPage";
import ArtistListPage from "@/pages/ArtistListPage";
import WorkListPage from "@/pages/WorkListPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
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
