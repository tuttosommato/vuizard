import type { AttributionsBundle } from "@/types/attributions";
import AttributionsTable from "@/components/work/attributions/AttributionsTable";

function AttributionsSection({ currentAttributions, workTitle }: { currentAttributions: AttributionsBundle, workTitle: string }) {
      return <>
            <div>
                  <h3>Elements of attribution</h3>
                  <p>The attributions presented here are reflecting the hierarchy established in the original descriptive sheet. We emphasize the importance of reliability, author recognisability, and the certainty inherent in these attributions. This list dissects the elements that define the interpretive act of attribution, offering a clearer understanding of their significance.</p>
            </div>
            <AttributionsTable currentAttributions={currentAttributions} workTitle={workTitle} />
      </>
}

export default AttributionsSection