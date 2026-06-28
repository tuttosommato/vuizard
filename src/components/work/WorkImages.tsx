import type { Work } from "@/types/works.tsx";
import { BASE_URL } from "@/utils/constants.ts";

type WorkImagesProps = {
  photos: Work["photos"];
};



export default function WorkImages({ photos }: WorkImagesProps) {
  return (
    <div className="img-cnt">
      {photos.map((ph) => (
        <img
          key={ph.link}
          alt={ph.alt}
          src={BASE_URL + ph.link}
          loading="lazy"
        />
      ))}
    </div>
  );
}
