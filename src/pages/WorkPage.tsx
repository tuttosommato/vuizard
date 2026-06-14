import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getWork } from '@/data/api'
import type { Work } from '@/types/works'
import WorkHeader from '@/components/work/WorkHeader'
import AttributionsSection from '@/components/work/attributions/AttributionsSection'
import NotFoundPage from '@/pages/NotFoundPage'
import '@/styles/work.css'


type LoadState =
  | { status: "loading" }
  | { status: "loaded"; work: Work }
  | { status: "not-found" }
  | { status: "error"; message: string }


function WorkPage() {
  const { workId } = useParams<{ workId: string }>()
  const [state, setState] = useState<LoadState>({ status: "loading" })


  useEffect(() => {
    if (!workId) return
    let canceled = false

    getWork(workId)
      .then((work) => {
        if (canceled) return
        setState(work === null ? { status: "not-found" } : { status: "loaded", work })
      })
      .catch((err: unknown) => {
        if (canceled) return
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load work.",
        })
      })

    return () => {
      canceled = true // clean up: if another workId is loaded before this one finishes, we ignore the result of this load to prevent showing the wrong work or an error message from a previous load
    }
  }, [workId])



  if (!workId) {
    return (
      <NotFoundPage
        title="Work not found"
        message={`No work exists with ID “${workId}”.`}
      />
    )
  }

  if (state.status === "loading") {
    return (
      <>
        <title>Loading…</title>
        <main className="work-layout">
          <p>Loading work…</p>
        </main>
      </>
    )
  }

  if (state.status === "not-found") {
    return (
      <NotFoundPage
        title="Work not found"
        message={`No work exists with ID “${workId}”.`}
      />
    )
  }

  if (state.status === "error") {
    return (
      <>
        <title>Error</title>
        <main>
          <h1>Could not load work</h1>
          <p role="alert" style={{ color: "var(--color-discarded)" }}>
            {state.message}
          </p>
        </main>
      </>
    )
  }

  const currentWork = state.work




  return (
    <>
      <title>{currentWork.title}</title>
      <meta name="description" content={`Catalogue entry for ${currentWork.title}.`} />

      <main className="work-layout">
        <section className="work-left">
          <WorkHeader currentWork={currentWork} />
          <AttributionsSection currentWork={currentWork} />
          {/* <CriticalDebatePanel /> */}
        </section>
        <section className="work-right">
          {/* <VisLegend /> <AttributionsVis /> */}
        </section>
      </main>
    </>
  )
}

export default WorkPage;