import { createContext, useState, useContext, type ReactNode } from "react";

type ArtistFilterContextValue = {
  // distinct per-work attribution counts present for this artist, one legend toggle each
  sizeValues: number[];
  hiddenSizes: Set<number>;
  handleSizeFilter: (size: number) => void;
  isWorkFilteredOut: (size: number) => boolean;
  uncertaintyRange: Set<"certain" | "probably" | "uncertain" | null>;
  handleUncertaintyFilter: (
    status: "certain" | "probably" | "uncertain",
  ) => void;
  isAttributionFilteredOut: (
    uncertaintyStatus: "certain" | "probably" | "uncertain",
    acceptanceStatus: "accepted" | "discarded",
  ) => boolean;
  acceptanceRange: Set<"accepted" | "discarded" | null>;
  handleAcceptanceFilter: (status: "accepted" | "discarded") => void;
};

const ArtistFilterContext = createContext<ArtistFilterContextValue | null>(
  null,
);

export function ArtistFilterProvider({
  children,
  sizeValues,
}: {
  children: ReactNode;
  sizeValues: number[];
}) {
  // Same exclusion-set model as the status/uncertainty filters below: a size
  // is hidden while it's in the set, so an empty set means nothing is filtered.
  const [hiddenSizes, setHiddenSizes] = useState<Set<number>>(new Set());
  const isWorkFilteredOut = (size: number) => hiddenSizes.has(size);

  const handleSizeFilter = (size: number) => {
    setHiddenSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  };

  const [uncertaintyRange, setUncertaintyRange] = useState<
    Set<"certain" | "probably" | "uncertain" | null>
  >(new Set(null));

  const isAttributionFilteredOut = (
    uncertaintyStatus: "certain" | "probably" | "uncertain",
    acceptanceStatus: "accepted" | "discarded",
  ) =>
    uncertaintyRange.has(uncertaintyStatus) ||
    acceptanceRange.has(acceptanceStatus);

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

  const [acceptanceRange, setAcceptanceRange] = useState<
    Set<"accepted" | "discarded" | null>
  >(new Set(null));

  const handleAcceptanceFilter = (status: "accepted" | "discarded") => {
    setAcceptanceRange((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <ArtistFilterContext
      value={{
        sizeValues,
        hiddenSizes,
        handleSizeFilter,
        isWorkFilteredOut,
        uncertaintyRange,
        handleUncertaintyFilter,
        isAttributionFilteredOut,
        acceptanceRange,
        handleAcceptanceFilter,
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
