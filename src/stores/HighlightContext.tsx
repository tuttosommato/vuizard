import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type HighlightContextValue = {
  highlightedId: string | null;
  setHighlightedId: React.Dispatch<React.SetStateAction<string | null>>;
};

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const value = {
    highlightedId,
    setHighlightedId,
  };

  return (
    <HighlightContext value={value}>
      {children}
    </HighlightContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHighlight() {
  const context = useContext(HighlightContext);
  if (!context) {
    throw new Error("useHighlight must be used within a HighlightProvider");
  }
  return context;
}
