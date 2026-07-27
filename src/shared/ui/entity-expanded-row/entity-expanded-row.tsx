"use client"

import type {
  PropsWithChildren,
} from "react"

type Props=
  PropsWithChildren<{
    rowId:string
  }>

export function EntityExpandedRow({
  rowId,
  children,
}:Props){

  return(

    <div
    >

      {children}

    </div>

  )

}