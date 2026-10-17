import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ArtistSelectionContextValue = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  triggerNewSelection: string | null;
  clear: () => void;
  hoveredWorkId: string | null;
  setHoveredWorkId: (id: string | null) => void;
};

const PRESERVE_SELECTION = ".attr-circle, .artist-legend, .work-card, .about-overlay";

const ArtistSelectionContext =
  createContext<ArtistSelectionContextValue | null>(null);

export function ArtistSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [triggerNewSelection, setTriggerNewSelection] = useState<string | null>(
    null,
  );
  const [hoveredWorkId, setHoveredWorkId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setTriggerNewSelection(null);
      } else {
        next.add(id);
        setTriggerNewSelection(id);
      }
      return next;
    });
  };

  const clear = () => setSelectedIds(() => new Set());

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(PRESERVE_SELECTION)) return;
      clear();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  });

  return (
    <ArtistSelectionContext
      value={{
        selectedIds,
        toggle,
        triggerNewSelection,
        clear,
        hoveredWorkId,
        setHoveredWorkId,
      }}
    >
      {children}
    </ArtistSelectionContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArtistSelection() {
  const context = useContext(ArtistSelectionContext);
  if (!context) {
    throw new Error(
      "useArtistSelection must be used within a ArtistSelectionProvider",
    );
  }
  return context;
}
