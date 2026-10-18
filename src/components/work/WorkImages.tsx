import type { Work } from "@/types/works.tsx";
import { BASE_URL } from "@/utils/constants.ts";
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import LoadingImage from "@/components/LoadingImage";
import ArrowIcon from "@/components/ArrowIcon";
import type { Photos } from "@/types/works.tsx";

const closeIconSize = 24;

type WorkImagesProps = {
  photos: Work["photos"];
};

function FullScreenImage({
  photo,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: Photos;
  onClose: () => void;
  // undefined at the first / last image: there is nowhere to go
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const [buttonPos, setButtonPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // The close button sits at the image's corner: measured when it appears and again whenever the
  // image changes size (the loading frame gives way to the picture, whose size is its own)
  const imageRef = useCallback((node: HTMLImageElement | null) => {
    if (!node) return;
    const measure = () => {
      const box = node.getBoundingClientRect();
      const next = { top: box.y, right: window.innerWidth - box.right };
      // the same place: keep the old object, so measuring again changes nothing
      setButtonPos((prev) =>
        prev && prev.top === next.top && prev.right === next.right
          ? prev
          : next,
      );
    };
    measure();
    node.addEventListener("load", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("load", measure);
      observer.disconnect();
    };
  }, []);

  // the keyboard moves between the images and closes the view
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") onPrevious?.();
      else if (event.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrevious, onNext]);

  return createPortal(
    <div className="full-screen-image">
      {onPrevious && (
        <button
          type="button"
          className="full-screen-nav full-screen-nav-previous"
          aria-label="Previous image"
          onClick={onPrevious}
        >
          <ArrowIcon size={20} stroke={1.5} />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          className="full-screen-nav full-screen-nav-next"
          aria-label="Next image"
          onClick={onNext}
        >
          <ArrowIcon size={20} stroke={1.5} />
        </button>
      )}
      {buttonPos && (
        <button
          style={{
            position: "absolute",
            top: buttonPos?.top,
            right: buttonPos?.right - closeIconSize * 2,
          }}
          onClick={onClose}
        >
          <svg
            viewBox={`0 0 ${closeIconSize} ${closeIconSize}`}
            width={closeIconSize}
            height={closeIconSize}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d={`M${closeIconSize / 4} ${closeIconSize / 4} l${closeIconSize / 2} ${closeIconSize / 2} M${(closeIconSize / 4) * 3} ${closeIconSize / 4} l-${closeIconSize / 2} ${closeIconSize / 2}`}
            />
          </svg>
        </button>
      )}

      <LoadingImage
        key={photo.image_path} // a new image starts from its own loading frame
        imgRef={imageRef}
        alt={photo.alt}
        src={BASE_URL + photo.image_path}
      />
    </div>,
    document.body,
  );
}

export default function WorkImages({ photos }: WorkImagesProps) {
  // the image open in the full-screen view (its index among the renderable ones)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // filter out photos without image_path, as they cannot be rendered. Note that the lack of image_path is a problem coming from the data source
  // eventually, other images are still rendered and available at the original catalog link
  const renderablePhotos = photos.filter((ph) => ph.image_path);

  const closeFullScreen = useCallback(() => setSelectedIndex(null), []);
  const showPrevious = useCallback(
    () => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    [],
  );
  const showNext = useCallback(
    () =>
      setSelectedIndex((i) =>
        i !== null && i < renderablePhotos.length - 1 ? i + 1 : i,
      ),
    [renderablePhotos.length],
  );

  // The strip scrolls sideways when its images don't fit; with the scrollbars hidden, arrows at
  // its ends (shown only on the side that has more) move it by most of a screenful.
  const stripRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const update = () => {
      const left = strip.scrollLeft > 1;
      const right =
        strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
      setMore((prev) =>
        prev.left === left && prev.right === right ? prev : { left, right },
      );
    };
    // its size, the images arriving (they change how wide the strip's content is) and scrolling
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    strip.addEventListener("scroll", update, { passive: true });
    strip.addEventListener("load", update, true); // load doesn't bubble: captured
    return () => {
      observer.disconnect();
      strip.removeEventListener("scroll", update);
      strip.removeEventListener("load", update, true);
    };
  }, [photos]);
  const slide = (direction: -1 | 1) =>
    stripRef.current?.scrollBy({
      left: direction * stripRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  return (
    <>
      {selectedIndex !== null && renderablePhotos[selectedIndex] && (
        <FullScreenImage
          photo={renderablePhotos[selectedIndex]}
          onClose={closeFullScreen}
          onPrevious={selectedIndex > 0 ? showPrevious : undefined}
          onNext={
            selectedIndex < renderablePhotos.length - 1 ? showNext : undefined
          }
        />
      )}

      <div className="img-strip">
        {/* the images' own area, which fades out on the right while there is more (see work.css) */}
        <div className={"img-viewport" + (more.right ? " img-fade-right" : "")}>
          <div className="img-cnt" ref={stripRef}>
            {renderablePhotos.map((ph, index) => (
              <LoadingImage
                key={ph.image_path}
                alt={ph.alt}
                src={BASE_URL + ph.image_path}
                onClick={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        </div>
        {more.left && (
          <button
            type="button"
            className="img-strip-arrow img-strip-arrow-left"
            aria-label="Show the previous images"
            onClick={() => slide(-1)}
          >
            <ArrowIcon size={20} stroke={1.5} />
          </button>
        )}
        {more.right && (
          <button
            type="button"
            className="img-strip-arrow img-strip-arrow-right"
            aria-label="Show the next images"
            onClick={() => slide(1)}
          >
            <ArrowIcon size={20} stroke={1.5} />
          </button>
        )}
      </div>
    </>
  );
}
