import { useCallback, useState } from "react";

// An image that shows the pulsing frame of the image previews until it has arrived, instead of
// the browser's alt text. Once loaded the wrapper steps out of the way (display: contents), so
// the image sits in its parent exactly as a plain <img> would; a failed image keeps the frame,
// still. While the frame is up its size comes from the place it is used in (see the
// .loading-image-pending rules in work.css); the styles are in shared.css.
export default function LoadingImage({
  src,
  alt,
  onClick,
  imgRef,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
  // for those who need the <img> itself; may return a cleanup, like a React ref
  imgRef?: (img: HTMLImageElement | null) => void | (() => void);
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  // stable (while the parent's imgRef is): a ref that changes on every render is called again
  // on every render, which for a parent that measures the image would never settle
  const handleRef = useCallback(
    (img: HTMLImageElement | null) => {
      // an image that is already there (loaded before) may not fire load again
      if (img?.complete && img.naturalWidth > 0) setStatus("ready");
      return imgRef?.(img);
    },
    [imgRef],
  );

  return (
    <div className={"loading-image loading-image-" + status}>
      {status !== "failed" && (
        <img
          src={src}
          alt={alt}
          onClick={onClick}
          ref={handleRef}
          onLoad={() => setStatus("ready")}
          onError={() => setStatus("failed")}
        />
      )}
    </div>
  );
}
