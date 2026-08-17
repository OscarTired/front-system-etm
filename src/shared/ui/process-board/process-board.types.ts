import type { ReactNode } from "react"

/** Columna genérica de un board por proceso (pipeline o ingeniería). */
export type ProcessBoardColumn<TId extends string = string> = {
  id: TId
  content: ReactNode
}
