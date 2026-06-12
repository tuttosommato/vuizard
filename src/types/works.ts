export interface Dating {
  type: "accepted" | "discarded"
  from: string
  to: string
  from_approximation: string
  to_approximation: string
}

export interface Bibliography {
  type: string
  author: string
  title: string
  date: string
}

export interface Work {
  title: string
  link: string
  dating: Dating[]
  bibliography: Bibliography[]
}

export interface WorksData {
  [key: string]: Work
}

export type WorksIndex = Record<string, string>