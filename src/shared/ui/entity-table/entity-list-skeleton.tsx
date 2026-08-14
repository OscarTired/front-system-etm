"use client"

import { cn } from "@/shared/utils/utils"

type Variant = "task" | "project" | "process"
/**
 * row → mismo shell que TaskMobileCard / ProjectMobileCard / ProcessMobileCard
 * kanban → mismo shell que KanbanCardView (process mobile via TaskProcessColumn)
 */
type Layout = "row" | "kanban"

type Props = {
  variant?: Variant
  layout?: Layout
  rows?: number
  className?: string
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3] as const

/**
 * Misma estructura que el row real:
 * overflow-hidden rounded-xl bg-foreground/5
 *   flex items-center gap-1 px-1
 *     flex … gap-2.5 py-3 pr-2 pl-2
 *       badge · (dot) · col título/meta · trailing
 */
function RowCardSkeleton({
  variant,
  opacity,
}: {
  variant: Variant
  opacity: number
}) {
  return (
    <div
      className="overflow-hidden rounded-xl bg-foreground/5"
      style={{ opacity }}
    >
      <div className="flex items-center gap-1 px-1">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 py-3 pr-2 pl-2">
          {/* displayProjectCode / taskNumber badge */}
          <span className="h-5 w-10 shrink-0 rounded-md bg-foreground/10 md:h-6 md:w-11" />

          {variant === "process" && (
            <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
          )}

          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="flex min-w-0 max-w-full items-center gap-1.5">
              <span className="h-3.5 w-28 max-w-full rounded bg-foreground/10 sm:w-36" />
              {/* md+: iconos prio/estado */}
              <span className="hidden size-4 shrink-0 rounded bg-foreground/10 md:block" />
              <span className="hidden size-4 shrink-0 rounded bg-foreground/10 md:block" />
            </div>
            {/* meta: cliente · … */}
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
              <span className="h-3 w-16 rounded bg-foreground/5" />
              <span className="h-3 w-12 rounded bg-foreground/5 md:hidden" />
            </div>
          </div>

          {/* fecha / chips desktop */}
          <span className="hidden h-3 w-14 shrink-0 rounded bg-foreground/5 md:block" />
        </div>
      </div>
    </div>
  )
}

/**
 * Misma estructura que KanbanCardView:
 * flex h-43.5 w-full flex-col justify-between rounded-xl bg-foreground/5 p-4
 */
function KanbanCardSkeleton({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex h-43.5 w-full flex-col justify-between rounded-xl bg-foreground/5 p-4"
      style={{ opacity }}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-10 rounded bg-foreground/10" />
            <span className="size-1.5 rounded-full bg-foreground/15" />
            <span className="h-3.5 w-14 rounded bg-foreground/10" />
          </div>
          <span className="h-3.5 w-16 rounded bg-foreground/5" />
        </div>

        <span className="mt-2 block h-4 w-3/4 max-w-[14rem] rounded bg-foreground/10" />

        <div className="mt-2 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="h-3.5 w-8 rounded bg-foreground/5" />
            <span className="h-3.5 w-12 rounded bg-foreground/5" />
            <span className="h-3.5 w-16 rounded bg-foreground/5" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-5 w-16 rounded-md bg-foreground/10" />
          <span className="h-5 w-20 rounded-md bg-foreground/10" />
        </div>
      </div>
    </div>
  )
}

export function EntityListSkeleton({
  variant = "task",
  layout = "row",
  rows = 6,
  className,
}: Props) {
  const opacities = OPACITIES.slice(0, rows)

  return (
    <div
      className={cn(
        "flex animate-pulse flex-col gap-2",
        layout === "row" && "pb-2",
        className,
      )}
      aria-hidden
    >
      {opacities.map((opacity, i) =>
        layout === "kanban" ? (
          <KanbanCardSkeleton key={i} opacity={opacity} />
        ) : (
          <RowCardSkeleton key={i} variant={variant} opacity={opacity} />
        ),
      )}
    </div>
  )
}
