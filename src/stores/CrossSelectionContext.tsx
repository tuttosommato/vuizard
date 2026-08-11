import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";

type SelectionContextValue = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
};

const CrossSelectionContext = createContext<SelectionContextValue | null>(null);
const PRESERVE_SELECTION = "tbody, .attribution-group, .table-switch";

export function CrossSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clear = useCallback(() => setSelectedIds(() => new Set()), []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const path = e.composedPath();
      const preserved = path.some(
        (el) => el instanceof Element && el.matches(PRESERVE_SELECTION),
      );
      if (preserved) return;
      clear();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clear]);

  const value = {
    selectedIds,
    toggle,
    clear,
  };

  return (
    <CrossSelectionContext value={value}>{children}</CrossSelectionContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrossSelection() {
  const context = useContext(CrossSelectionContext);
  if (!context) {
    throw new Error(
      "useCrossSelection must be used within a CrossSelectionProvider",
    );
  }
  return context;
}
