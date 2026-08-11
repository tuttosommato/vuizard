import { useState, useEffect } from "react";
import type { Attribution } from "@/types/attributions";
import type { Artist } from "@/types/artists";
import { getAuthor } from "@/data/api";

const useArtists = (attributions: Attribution[]) => {
  const [artists, setArtists] = useState<{ [key: string]: Artist }>({});

  useEffect(() => {
    let canceled = false;

    const fetchableIds = attributions
      .flatMap((attr) => attr.authors.map((author) => author.local_id))
      .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

    if (fetchableIds.length === 0) {
      return;
    }

    Promise.all(fetchableIds.map((id) => getAuthor(id)))
      .then((artistsArray) => {
        if (canceled) return;
        const artistsMap: { [key: string]: Artist } = {};
        fetchableIds.forEach((id, i) => {
          const a = artistsArray[i];
          if (a) artistsMap[id] = a;
        });
        setArtists(artistsMap);
      })
      .catch((e) => {
        if (canceled) return;
        console.error("Error fetching artist data:", e);
      });

    return () => {
      canceled = true;
    };
  }, [attributions]);

  return artists;
};

export default useArtists;
