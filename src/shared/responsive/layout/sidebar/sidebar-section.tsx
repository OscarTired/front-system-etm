"use client"

import type { ReactNode } from "react"

import { cn } from "@/shared/utils/utils"

type Props = {
  title: string
  children: ReactNode
  collapsed?: boolean
  isDrawer?: boolean
}

export function SidebarSection({
  title,
  children,
  collapsed,
  isDrawer = false,
}: Props) {

  if (isDrawer) {

    return (

      <section className="mb-6">

        <div className="mb-2 px-4">

          <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            {title}
          </span>

        </div>

        <div className="space-y-0.5">
          {children}
        </div>

      </section>

    )

  }

  return (

    <section className="mb-5">

      <div className={cn("mb-2 px-3 h-4")}>

        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">
            {title}
          </span>
        )}

      </div>

      <div className="space-y-0.5">
        {children}
      </div>

    </section>

  )

}