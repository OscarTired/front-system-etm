"use client"

import type {
  ReactNode,
} from "react"

type Props={
  left?:ReactNode
  right?:ReactNode
}

export function EntityToolbar({
  left,
  right,
}:Props){

  return(

    <div className="flex min-h-15 items-center justify-between py-2">

      <div className="min-w-0 flex-1">
        {left}
      </div>

      <div className="flex shrink-0 items-center">
        {right}
      </div>

    </div>

  )

}