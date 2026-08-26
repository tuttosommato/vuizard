import { createContext, useState, useContext, type ReactNode } from "react";

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
};

const OverviewFilterContext = createContext<OverviewFilterContextValue | null>(
  null,
);

export function OverviewFilterProvider({
  children,
  tempBounds,
}: {
  children: ReactNode;
  tempBounds: [number, number];
}) {
  const present = tempBounds[1] + 100;
  const [tempRange, setTempRange] = useState<[number, number]>([
    tempBounds[0],
    present,
  ]);
  const [noDatesFilter, setNoDatesFilter] = useState<boolean>(true);

  const isArtistFilteredOut = (bucket: number | null) =>
    bucket === null
      ? !noDatesFilter
      : bucket < tempRange[0] || bucket > tempRange[1];

  const handleNoDatesFilter = (status: boolean) => {
    setNoDatesFilter(status);
  };

  return (
    <OverviewFilterContext
      value={{
        tempRange,
        setTempRange,
        tempBounds,
        present,
        isArtistFilteredOut,
        noDatesFilter,
        handleNoDatesFilter
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
