"use client"

import type {
  PropsWithChildren,
} from "react"

type Props =
  PropsWithChildren<{

    title: string

  }>

export function EntityExpandedSection({

  title,

  children,

}: Props) {

  return (

    <section className="flex h-full w-0 min-w-full flex-col">

      <div className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground">

        {title}

      </div>

      {children}

    </section>

  )

}