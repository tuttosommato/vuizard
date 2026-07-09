import { createContext, useState, useContext } from "react";

type SelectionContextValue = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
};

const CrossSelectionContext = createContext<SelectionContextValue | null>(null);

export function CrossSelectionProvider({children} : {children: React.ReactNode}) {

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

    const value = {
      selectedIds,
      toggle
    }


    return (
    <CrossSelectionContext.Provider value={value}>
      {children}
    </CrossSelectionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCrossSelection() {
  const context = useContext(CrossSelectionContext);
  if (!context) {
    throw new Error("useCrossSelection must be used within a CrossSelectionProvider");
  }
  return context;
}