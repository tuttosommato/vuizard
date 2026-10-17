import {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Artist } from "@/types/artists";

// lower case and without accents, so "Gellée" is found by "gellee"
const normalise = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

type OverviewFilterContextValue = {
  tempRange: [number, number];
  setTempRange: (range: [number, number]) => void;
  tempBounds: [number, number];
  // Sentinel meaning "no upper limit" — one step past the real data max,
  // so the default range covers everything without needing to know the
  // exact max. Kept here (not recomputed in PackingLegend) since it's
  // also what tempRange defaults to.
  present: number;
  isArtistFilteredOut: (bucket: number | null) => boolean;
  noDatesFilter: boolean;
  handleNoDatesFilter: (status: boolean) => void;
  // search by name: the text typed, and the artists whose names match it
  // (null when nothing is typed, i.e. everyone)
  query: string;
  setQuery: (query: string) => void;
  matchingIds: Set<string> | null;
};

const OverviewFilterContext = createContext<OverviewFilterContextValue | null>(
  null,
);

export function OverviewFilterProvider({
  children,
  tempBounds,
  artists,
}: {
  children: ReactNode;
  tempBounds: [number, number];
  artists: Record<string, Artist>;
}) {
  const present = tempBounds[1] + 100;
  const [tempRange, setTempRange] = useState<[number, number]>([
    tempBounds[0],
    present,
  ]);
  const [noDatesFilter, setNoDatesFilter] = useState<boolean>(true);

  // stable until the century filter changes, so that it can be a dependency of memos
  const isArtistFilteredOut = useCallback(
    (bucket: number | null) =>
      bucket === null
        ? !noDatesFilter
        : bucket < tempRange[0] || bucket > tempRange[1],
    [noDatesFilter, tempRange],
  );

  const handleNoDatesFilter = (status: boolean) => {
    setNoDatesFilter(status);
  };

  // what each artist can be found by: the name and the other names it goes by, as in the
  // artist list's search. Built once.
  const searchableText = useMemo(() => {
    const text = new Map<string, string>();
    for (const artist of Object.values(artists)) {
      text.set(
        artist.id,
        normalise(
          [
            artist.name,
            ...artist.pseudonyms,
            ...artist.pseudonym_alts,
            ...artist.variant_names,
          ].join(" | "),
        ),
      );
    }
    return text;
  }, [artists]);

  const [query, setQuery] = useState("");
  const matchingIds = useMemo(() => {
    const needle = normalise(query.trim());
    if (!needle) return null;
    const ids = new Set<string>();
    for (const [id, text] of searchableText) {
      if (text.includes(needle)) ids.add(id);
    }
    return ids;
  }, [query, searchableText]);

  return (
    <OverviewFilterContext
      value={{
        tempRange,
        setTempRange,
        tempBounds,
        present,
        isArtistFilteredOut,
        noDatesFilter,
        handleNoDatesFilter,
        query,
        setQuery,
        matchingIds,
      }}
    >
      {children}
    </OverviewFilterContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOverviewFilter() {
  const context = useContext(OverviewFilterContext);
  if (!context) {
    throw new Error(
      "useOverviewFilter must be used within a OverviewFilterProvider",
    );
  }
  return context;
}
