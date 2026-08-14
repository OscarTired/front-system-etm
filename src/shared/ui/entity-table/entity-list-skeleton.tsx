"use client"

import { cn } from "@/shared/utils/utils"

type Variant = "task" | "project" | "process"

type Props = {
  variant?: Variant
  rows?: number
  className?: string
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3] as const

/**
 * Skeleton de lista alineado al layout real de cards mobile
 * (badge código + título + meta + chip estado).
 * Inline / un solo contrato — no duplicar files por feature.
 */
export function EntityListSkeleton({
  variant = "task",
  rows = 6,
  className,
}: Props) {
  const opacities = OPACITIES.slice(0, rows)

  return (
    <div
      className={cn("flex animate-pulse flex-col gap-2", className)}
      aria-hidden
    >
      {opacities.map((opacity, i) => (
        <div
          key={i}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl bg-foreground/5 px-3",
            variant === "process" ? "h-12" : "py-3",
          )}
          style={{ opacity }}
        >
          {/* Badge correlativo / código */}
          <span className="h-5 w-10 shrink-0 rounded-md bg-foreground/10" />

          {variant === "process" && (
            <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <span className="block h-4 w-2/3 rounded bg-foreground/10" />
            {variant !== "process" && (
              <span className="block h-3 w-1/3 rounded bg-foreground/5" />
            )}
          </div>

          {/* Chip estado / meta */}
          <span className="h-5 w-14 shrink-0 rounded-md bg-foreground/10" />
        </div>
      ))}
    </div>
  )
}
