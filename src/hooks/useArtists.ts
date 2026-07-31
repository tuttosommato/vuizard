import { useState, useEffect } from "react";
import type { Attribution } from "@/types/attributions";
import type { Author } from "@/types/artists";
import { getAuthor } from "@/data/api";

const useArtists = (attributions: Attribution[]) => {
  const [artists, setArtists] = useState<{ [key: string]: Author }>({});

  useEffect(() => {
    let canceled = false;

    // Only fetch real artists. Anonymous attributions don't have an artist file.
    const fetchableIds = attributions
      .filter((a) => !a.is_anonymous && a.local_id)
      .map((a) => a.local_id);

    if (fetchableIds.length === 0) {
      return;
    }

    Promise.all(fetchableIds.map((id) => getAuthor(id)))
      .then((artistsArray) => {
        if (canceled) return;
        const artistsMap: { [key: string]: Author } = {};
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
