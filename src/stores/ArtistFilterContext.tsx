import { createContext, useState, useContext, type ReactNode } from "react"

type ArtistFilterContextValue = {
  sizeRange: [number, number];
  setSizeRange: (range: [number, number]) => void
  sizeBounds: [number, number]
  isFilteredOut: (size: number) => boolean
}



const ArtistFilterContext = createContext<ArtistFilterContextValue | null>(null)

export function ArtistFilterProvider( { children, sizeBounds }: { children: ReactNode, sizeBounds: [number, number] }){
  const [sizeRange, setSizeRange] = useState<[number, number]>(sizeBounds)
  const isFilteredOut = (size: number) => size < sizeRange[0] || size > sizeRange[1];



  return (
    <ArtistFilterContext value={{sizeRange, setSizeRange, sizeBounds, isFilteredOut}}>
      {children}
    </ArtistFilterContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useArtistFilter(){
  const context = useContext(ArtistFilterContext);
  if (!context) {
    throw new Error ("useArtistSelection must be used within a ArtistSelectionProvider")
  };
  return context;
}
