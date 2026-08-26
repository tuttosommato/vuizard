import { createContext, useState, useContext, type ReactNode } from "react";

type OverviewFilterContextValue = {
  tempRange: [number, number];
  setTempRange: (range: [number, number]) => void;
  tempBounds: [number, number];
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
  const [tempRange, setTempRange] = useState<[number, number]>(tempBounds);
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
