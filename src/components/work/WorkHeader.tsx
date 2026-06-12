import type { Work } from "@/types/works"
import { formatDating } from "@/utils/formatDating";


type WorkHeaderProps = {
    currentWork: Work;
}

type WorkMetaProps = {
    acceptedDating: Work["dating"];
    discardedDating: Work["dating"];
}


function WorkMeta({ acceptedDating, discardedDating }: WorkMetaProps) {

    const accepted = acceptedDating.map(formatDating)
    const discarded = discardedDating.map(formatDating)

    return <div className="dating-info">
        {accepted.length > 0 && <p className="accepted-dating">
            {accepted.join(" and ")}
        </p>}
        {discarded.length > 0 && <p className="discarded-dating">
            Discarded datings: {discarded.join(", ")}
        </p>}
    </div>
}


function WorkHeader({ currentWork }: WorkHeaderProps) {

    const acceptedDating = currentWork.dating.filter(d => d.type === "accepted")
    const discardedDating = currentWork.dating.filter(d => d.type === "discarded")

    return <div className="work-info">
        <h1>{currentWork.title}</h1>
        <WorkMeta acceptedDating={acceptedDating} discardedDating={discardedDating} />
        <a href={currentWork.link} target="_blank">See the original catalogue page</a>
    </div>
}

export default WorkHeader