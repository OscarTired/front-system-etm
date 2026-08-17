import type { ReactNode } from "react"

export type ProcessBoardColumn<TId extends string = string> = {
  id: TId
  content: ReactNode
}
