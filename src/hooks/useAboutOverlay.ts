import { useSearchParams } from "react-router-dom";

// The About overlay is open while the URL has `about` making the overlay linkable
// while the page underneath is never unmounted

const PARAM = "about";

const useAboutOverlay = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.has(PARAM);

  const setOpen = (value: boolean) => 
    setSearchParams((prev) => {
      // copy, keeping all other params, and add/remove the `about` param
      const next = new URLSearchParams(prev);
      if (value) next.set(PARAM, "");
      else next.delete(PARAM);
      return next;
    });
    return {open, openAbout: () => setOpen(true), closeAbout: () => setOpen(false)};
};

export default useAboutOverlay;
