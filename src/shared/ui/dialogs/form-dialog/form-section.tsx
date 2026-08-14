"use client"

import type { LucideIcon } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Props = {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  /** Extra al lado del título (p.ej. total piezas) */
  trailing?: React.ReactNode
}

/**
 * Desktop → mismo contrato visual que ExportDialog:
 *   label uppercase + panel rounded-xl bg-foreground/5
 * Mobile → form clásico (icono + título + border-b)
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
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon size={14} className="text-muted-foreground" />
          {title}
        </span>
        {trailing}
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-foreground/5 p-3">
        {children}
      </div>
    </section>
  )
}
