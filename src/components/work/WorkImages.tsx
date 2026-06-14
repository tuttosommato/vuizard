import type { Work } from "@/types/works.tsx";

type WorkImagesProps = {
  photos: Work["photos"];
};

const BASE_URL = "https://catalogo.fondazionezeri.unibo.it/foto/";

export default function WorkImages({ photos }: WorkImagesProps) {
  return (
    <div className="img-cnt">
      {photos.map((ph) => (
        <img key={ph.alt} alt={ph.alt} src={BASE_URL + ph.link} loading="lazy" />
      ))}
    </div>
  );
}