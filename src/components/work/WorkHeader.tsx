import type { Work } from "@/types/works";
import { formatDating } from "@/utils/formatDating";

type WorkHeaderProps = {
  currentWork: Work;
};

type WorkMetaProps = {
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
  objectType: Work["object"];
  material: Work["medium_material"];
  subject: Work["subject"];
};

type WorkImagesProps = {
  photos: Work["photos"];
};

const BASE_URL = "https://catalogo.fondazionezeri.unibo.it/foto/";

// ––––––– WorkMeta
function WorkMeta({
  acceptedDating,
  discardedDating,
  objectType,
  material,
  subject,
}: WorkMetaProps) {
  const accepted = acceptedDating.map(formatDating);
  const discarded = discardedDating.map(formatDating);

  return (
    <div className="work-meta">
      {accepted.length > 0 && (
        <p className="accepted-dating">{accepted.join(" and ")}</p>
      )}
      {discarded.length > 0 && (
        <p className="discarded-dating">
          Discarded datings: {discarded.join(", ")}
        </p>
      )}
      <dl className="work-details">
        <dt>Type</dt>
        <dd>{objectType}</dd>
        <dt>Material</dt>
        <dd>{material}</dd>
        <dt>Subject</dt>
        <dd>{subject}</dd>
      </dl>
    </div>
  );
}

// ––––––– WorkImages
function WorkImages({ photos }: WorkImagesProps) {
  return (
    <div className="img-cnt">
      {photos.map((ph) => (
        <img key={ph.alt} alt={ph.alt} src={BASE_URL + ph.link} loading="lazy" />
      ))}
    </div>
  );
}

// ––––––– WorkHeader
function WorkHeader({ currentWork }: WorkHeaderProps) {
  console.log(currentWork);

  const acceptedDating = currentWork.dating.filter(
    (d) => d.type === "accepted",
  );
  const discardedDating = currentWork.dating.filter(
    (d) => d.type === "discarded",
  );
  const photos = currentWork.photos;
  const objectType = currentWork.object;
  const material = currentWork.medium_material;
  const subject = currentWork.subject;

  return (
    <div className="work-info">
      <h1>{currentWork.subject}</h1>
      <WorkMeta
        acceptedDating={acceptedDating}
        discardedDating={discardedDating}
        objectType={objectType}
        material={material}
        subject={subject}
      />
      <a href={currentWork.link} target="_blank">
        ↼ See the original catalogue page
      </a>
      <WorkImages photos={photos} />
    </div>
  );
}

export default WorkHeader;
