import type { Work } from "@/types/works.tsx";
import { BASE_URL } from "@/utils/constants.ts";
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import LoadingImage from "@/components/LoadingImage";
import type { Photos } from "@/types/works.tsx";

const closeIconSize = 24;

type WorkImagesProps = {
  photos: Work["photos"];
};

function FullScreenImage({
  photo,
  onClose,
}: {
  photo: Photos;
  onClose: () => void;
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

  return createPortal(
    <div className="full-screen-image">
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
        imgRef={imageRef}
        alt={photo.alt}
        src={BASE_URL + photo.image_path}
      />
    </div>,
    document.body,
  );
}

export default function WorkImages({ photos }: WorkImagesProps) {
  const [selectedImage, setSelectedImage] = useState<Photos | null>(null);

  // filter out photos without image_path, as they cannot be rendered. Note that the lack of image_path is a problem coming from the data source
  // eventually, other images are still rendered and available at the original catalog link
  const renderablePhotos = photos.filter((ph) => ph.image_path);

  const handleFullScreen = (photo: Photos) => {
    if (!photo) return;
    setSelectedImage(photo);
  };

  return (
    <>
      {selectedImage && (
        <FullScreenImage
          photo={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <div className="img-cnt">
        {renderablePhotos.map((ph) => (
          <LoadingImage
            key={ph.image_path}
            alt={ph.alt}
            src={BASE_URL + ph.image_path}
            onClick={() => {
              handleFullScreen(ph);
            }}
          />
        ))}
      </div>
    </>
  );
}
