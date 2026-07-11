import { createContext, useState, useContext, type ReactNode } from "react";

type ArtistFilterContextValue = {
  sizeRange: [number, number];
  setSizeRange: (range: [number, number]) => void;
  sizeBounds: [number, number];
  isWorkFilteredOut: (size: number) => boolean;
  uncertaintyRange: Set<"certain" | "probably" | "uncertain" | null>;
  handleUncertaintyFilter: (
    status: "certain" | "probably" | "uncertain",
  ) => void;
  isAttributionFilteredOut: (
    status: "certain" | "probably" | "uncertain",
  ) => boolean;
};

const ArtistFilterContext = createContext<ArtistFilterContextValue | null>(
  null,
);

export function ArtistFilterProvider({
  children,
  sizeBounds,
}: {
  children: ReactNode;
  sizeBounds: [number, number];
}) {
  const [sizeRange, setSizeRange] = useState<[number, number]>(sizeBounds);
  const isWorkFilteredOut = (size: number) =>
    size < sizeRange[0] || size > sizeRange[1];

  const [uncertaintyRange, setUncertaintyRange] = useState<
    Set<"certain" | "probably" | "uncertain" | null>
  >(new Set(null));

  const isAttributionFilteredOut = (
    status: "certain" | "probably" | "uncertain",
  ) => uncertaintyRange && uncertaintyRange.has(status);

  const handleUncertaintyFilter = (
    status: "certain" | "probably" | "uncertain",
  ) => {
    setUncertaintyRange((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <ArtistFilterContext
      value={{
        sizeRange,
        setSizeRange,
        sizeBounds,
        isWorkFilteredOut,
        uncertaintyRange,
        handleUncertaintyFilter,
        isAttributionFilteredOut,
      }}
    >
      {children}
    </ArtistFilterContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArtistFilter() {
  const context = useContext(ArtistFilterContext);
  if (!context) {
    throw new Error(
      "useArtistSelection must be used within a ArtistSelectionProvider",
    );
  }
  return context;
}
