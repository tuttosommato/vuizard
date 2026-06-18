import { useState, useEffect } from "react";
import type { Attribution } from "@/types/attributions";
import type { Author } from "@/types/authors"; 
import { getAuthor } from "@/data/api";

const useAuthors = (attributions: Attribution[]) => {
    const [authors, setAuthors] = useState<{ [key: string]: Author }>({});

    useEffect(() => {
            let canceled = false;
    
            // Only fetch real authors. Anonymous attributions don't have an author file.
            const fetchableIds = attributions
                .filter((a) => !a.is_anonymous && a.local_id)
                .map((a) => a.local_id);
    
            if (fetchableIds.length === 0) {
                return;
            }
    
            Promise.all(fetchableIds.map((id) => getAuthor(id)))
                .then((authorsArray) => {
                    if (canceled) return;
                    const authorsMap: { [key: string]: Author } = {};
                    fetchableIds.forEach((id, i) => {
                        const a = authorsArray[i];
                        if (a) authorsMap[id] = a;
                    });
                    setAuthors(authorsMap);
                })
                .catch((e) => {
                    if (canceled) return;
                    console.error("Error fetching author data:", e);
                });
    
            return () => {
                canceled = true;
            };
        }, [attributions]);

        return authors
    }

export default useAuthors