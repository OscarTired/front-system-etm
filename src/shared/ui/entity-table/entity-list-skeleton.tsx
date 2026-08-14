"use client"

import { cn } from "@/shared/utils/utils"

type Variant = "task" | "project" | "process"
/** row = lista desktop (ProcessMobileCard / TaskMobileCard). kanban = cards mobile de proceso. */
type Layout = "row" | "kanban"

type Props = {
  variant?: Variant
  layout?: Layout
  rows?: number
  className?: string
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3] as const

function RowSkeleton({
  variant,
  opacity,
}: {
  variant: Variant
  opacity: number
}) {
  return (
    <div
      className="flex w-full items-center gap-2.5 rounded-xl bg-foreground/5 px-3 py-3"
      style={{ opacity }}
    >
      <span className="h-5 w-10 shrink-0 rounded-md bg-foreground/10" />
      {variant === "process" && (
        <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-4 w-2/3 max-w-[12rem] rounded bg-foreground/10" />
        <span className="block h-3 w-1/3 max-w-[8rem] rounded bg-foreground/5" />
      </div>
      <span className="hidden size-4 shrink-0 rounded bg-foreground/10 sm:block" />
      <span className="h-5 w-5 shrink-0 rounded-full bg-foreground/10" />
    </div>
  )
}

/** Refleja KanbanCardView usado por TaskProcessColumn en mobile. */
function KanbanSkeleton({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-border/40 bg-card px-3 py-3 shadow-sm"
      style={{ opacity }}
    >
      <div className="flex items-center gap-2">
        <span className="h-5 w-12 shrink-0 rounded-md bg-foreground/10" />
        <span className="h-5 w-16 shrink-0 rounded-md bg-foreground/10" />
        <span className="ml-auto h-4 w-14 rounded bg-foreground/5" />
      </div>
      <span className="h-4 w-3/4 max-w-[14rem] rounded bg-foreground/10" />
      <div className="flex flex-wrap gap-1.5">
        <span className="h-3 w-16 rounded bg-foreground/5" />
        <span className="h-3 w-12 rounded bg-foreground/5" />
        <span className="h-3 w-10 rounded bg-foreground/5" />
      </div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="h-5 w-20 rounded-md bg-foreground/10" />
        <span className="h-5 w-16 rounded-md bg-foreground/10" />
      </div>
    </div>
  )
}

/**
 * Skeleton de lista.
 * - layout="row" (default): filas tipo task/project/process desktop.
 * - layout="kanban": cards tipo pipeline (process mobile).
 */
export function EntityListSkeleton({
  variant = "task",
  layout = "row",
  rows = 6,
  className,
}: Props) {
  const opacities = OPACITIES.slice(0, rows)

  return (
    <div
      className={cn("flex animate-pulse flex-col gap-2", className)}
      aria-hidden
    >
      {opacities.map((opacity, i) =>
        layout === "kanban" ? (
          <KanbanSkeleton key={i} opacity={opacity} />
        ) : (
          <RowSkeleton key={i} variant={variant} opacity={opacity} />
        ),
      )}
    </div>
  )
}
