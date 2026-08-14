"use client"

import type { LucideIcon } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Props = {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  trailing?: React.ReactNode
}

/**
 * Desktop = ExportDialog:
 *   label uppercase tracking-wide + panel rounded-xl bg-foreground/5 p-3 gap-2
 * Mobile = form clásico con icono + border-b
 */
export function FormSection({
  title,
  icon: Icon,
  children,
  trailing,
}: Props) {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <section className="space-y-4 border-b border-border pb-5 last:border-none">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-muted-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-[0.20em] text-muted-foreground">
            {title}
          </h3>
          {trailing && <div className="ml-auto">{trailing}</div>}
        </div>
        {children}
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {trailing}
      </div>
      <div className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-3">
        {children}
      </div>
    </section>
  )
}
