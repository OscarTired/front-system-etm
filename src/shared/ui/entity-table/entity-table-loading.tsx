"use client"

import {
  LoaderCircle,
} from "lucide-react"

type Props = {

  label: string

}

export function EntityTableLoading({
  label,
}: Props) {

  return (

    <div className="relative flex h-[calc(100vh-240px)] flex-col overflow-hidden rounded-2xl bg-muted ring-1 ring-white/6">

      <div className="flex flex-1 items-center justify-center">

        <div className="flex flex-col items-center gap-4">

          <LoaderCircle
            size={28}
            className="animate-spin text-muted-foreground"
          />

          <p className="text-sm font-medium tracking-[0.12em] text-muted-foreground">

            {label}

          </p>

        </div>

      </div>

    </div>

  )

}