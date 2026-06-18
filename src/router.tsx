import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import WorkPage from "@/pages/WorkPage";
import SearchPage from "@/pages/SearchPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ErrorPage from "@/pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <SearchPage />,
      },
      {
        path: "work/:workId",
        element: <WorkPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
