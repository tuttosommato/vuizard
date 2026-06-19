import type { Author } from "@/types/authors";
import type { AttributionsBundle } from "@/types/attributions";
import { scaleLinear, extent } from "d3";
import { colorScale } from "../debateVis/constants";
import type { Work } from "@/types/works";

export default function AuthorsLifeTable({
  authors,
  currentAttributions,
  acceptedDating,
  discardedDating,
}: {
  authors: Record<string, Author>;
  currentAttributions: AttributionsBundle;
  acceptedDating: Work["dating"];
  discardedDating: Work["dating"];
}) {

  let domain = currentAttributions.attributions.flatMap((attr) => {
      const author = authors[attr.local_id];
      return author?.life ? [+author.life.birth, +author.life.death] : [];
    });

  acceptedDating.forEach((d) => {
    if (d.from) domain.push(+d.from);
    if (d.to) domain.push(+d.to);
  });

  discardedDating.forEach((d) => {
    if (d.from) domain.push(+d.from);
    if (d.to) domain.push(+d.to);
  });

  domain = extent(domain) as [number, number];
  

  const tempPadding = 10;
  const tempScale = scaleLinear()
    .domain([
      domain && domain[0] !== undefined ? domain[0] - tempPadding : 0,
      domain && domain[1] !== undefined ? domain[1] + tempPadding : 1,
    ])
    .nice()
    .range([0, 400]);

  console.log(authors);

  return (
    <table
      className="authors-life-table"
      aria-label="Life data of attributed artists"
    >
      <thead>
        <tr>
          <th scope="col">Artist</th>
          <th scope="col">Life data</th>
        </tr>
      </thead>
      <tbody>
        {currentAttributions.attributions.map((attr) => {
            const author = authors[attr.local_id];
            const life = author?.life;
          return (
            <tr key={attr.operational_id}>
              <th>{attr.author}</th>
              <td style={{ width: 400 }}>
                {life ? (
                  <svg width={400} height={20}>
                    <rect
                      x={tempScale(+life.birth)}
                      y={0}
                      width={
                        tempScale(+life.death) -
                        tempScale(+life.birth)
                      }
                      height={20}
                      fill={colorScale(attr.type)}
                    />
                  </svg>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          );
        })}
        <tr className="dating-row accepted-dating-row">
            <td>Accepted datings</td>
            <td style={{ width: 400 }}>
                <svg width={400} height={20}>
                {acceptedDating.map((d, i) => (
                        <rect
                            key={i}
                            x={tempScale(d.from ? +d.from : domain[0])}
                            y={0}
                            width={
                                tempScale(d.to ? +d.to : domain[1]) -
                                tempScale(d.from ? +d.from : domain[0])
                            }
                            height={20}
                            fill="var(--color-text)"
                        />
                ))}
                </svg>
            </td>
        </tr>
        {discardedDating.length > 0 && (
        <tr className="dating-row discarded-dating-row">
            <td>Discarded datings</td>
            <td style={{ width: 400 }}>
                <svg width={400} height={20}>
                {discardedDating.map((d, i) => (
                        <rect
                            key={i}
                            x={tempScale(d.from ? +d.from : domain[0])}
                            y={0}
                            width={
                                tempScale(d.to ? +d.to : domain[1]) -
                                tempScale(d.from ? +d.from : domain[0])
                            }
                            height={20}
                            fill="var(--color-text)"
                            fillOpacity={0.5}
                        />
                ))}
                </svg>
            </td>
        </tr>
        )}
      </tbody>
    </table>
  );
}
