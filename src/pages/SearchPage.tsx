import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWorksIndex } from "@/data/api";
import type { WorksIndex } from "@/types/works"
import '@/styles/search.css'

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [worksIndex, setWorksIndex] = useState<WorksIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let canceled = false
    getWorksIndex()
      .then((index) => {
        if (!canceled) setWorksIndex(index)
      })
      .catch((err: unknown) => {
        if (!canceled) setIndexError(err instanceof Error ? err.message : "Failed to log catalogue index")
      });
    return () => {
      canceled = false
    }
  }, []);


  function handleSearch() {
    if (!worksIndex) return;
    const value = inputValue.trim();
    if (!value) {
      setError("Please enter a work ID.");
      return;
    }
    if (!(value in worksIndex)) {
      setError(`No work found with ID “${value}”.`);
      return;
    }
    setError(null);
    navigate(`/work/${value}`);
  };

  if (indexError) {
    return (
      <>
        <title>Search</title>
        <main>
          <p role="alert" style={{ color: "var(--color-discarded)" }}>
            Failed to load catalogue: {indexError}
          </p>
        </main>
      </>
    );
  }


  const isLoading = worksIndex === null;

  return (
    <>
      <title>Search</title>
      <main className="search-form">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }} noValidate
        >
          <input
            type="search"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null); // clean the error when the user starts typing
            }}
            placeholder={isLoading ? "Loading catalogue..." : "Search..."}
            disabled={isLoading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "search-error" : undefined}
          />
          <button type="submit" disabled={isLoading}>Search</button>
        </form>
        {error && (
          <p id="search-error" role="alert" style={{ color: "var(--color-discarded)" }}>
            {error}
          </p>
        )}
      </main>
    </>

  );
}
