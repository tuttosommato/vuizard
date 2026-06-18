import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import NotFoundPage from "@/pages/NotFoundPage";

export default function ErrorPage() {
  const error = useRouteError();

  // 404 thrown from a loader/component → show NotFound.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  return (
    <main style={{ padding: "var(--space-lg)" }}>
      <h1>Something went wrong</h1>
      <p>{message}</p>
      <Link to="/">← Back to search</Link>
    </main>
  );
}
