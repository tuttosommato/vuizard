import { Link } from "react-router-dom";

type NotFoundPageProps = {
  title?: string;
  message?: string;
};

export default function NotFoundPage({
  title = "Page not found",
  message = "The page you’re looking for doesn’t exist.",
}: NotFoundPageProps) {
  return (
    <>
      <title>Work not found</title>
      <main>
        <h1>{title}</h1>
        <p>{message}</p>
        <Link to="/">← Back to search</Link>
      </main>
    </>
  );
}
