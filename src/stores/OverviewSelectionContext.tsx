import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Differently from ArtistSelectionContext, this handles selection only, since
// hovering is handled by hoverBus in order to not touch react state on every mousemove with 5000+ dots.

type OverviewSelectionContextValue = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  triggerNewSelection: string | null;
  clear: () => void;
};

const PRESERVE_SELECTION = ".author-dot, .packing-legend, .work-card, .about-overlay";

const OverviewSelectionContext =
  createContext<OverviewSelectionContextValue | null>(null);

export function OverviewSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [triggerNewSelection, setTriggerNewSelection] = useState<string | null>(
    null,
  );

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
    <OverviewSelectionContext
      value={{
        selectedIds,
        toggle,
        triggerNewSelection,
        clear,
      }}
    >
      {children}
    </OverviewSelectionContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOverviewSelection() {
  const context = useContext(OverviewSelectionContext);
  if (!context) {
    throw new Error(
      "useOverviewSelection must be used within a OverviewSelectionProvider",
    );
  }
  return context;
}
