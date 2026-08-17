"use client"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

const ROWS = [1, 0.85, 0.7, 0.55, 0.4]

function SkeletonRow({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex h-12 items-center gap-2 rounded-xl bg-foreground/5 px-2.5"
      style={{ opacity }}
    >
      <span className="h-3 w-6 rounded bg-foreground/10" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <span className="block h-3 w-3/5 rounded bg-foreground/10" />
        <span className="block h-2.5 w-2/5 rounded bg-foreground/5" />
      </div>
      <span className="h-5 w-14 rounded-full bg-foreground/10" />
    </div>
  )
}

function SkeletonColumn({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-2",
        isMobile ? "w-full min-w-full px-2" : "w-72",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-1 py-2.5">
        <span className="size-6 rounded-md bg-foreground/10" />
        <span className="h-3.5 w-28 rounded bg-foreground/10" />
        <span className="ml-auto h-3.5 w-4 rounded bg-foreground/5" />
        <span className="size-7 rounded-lg bg-foreground/5" />
      </div>
      <div className="flex flex-col gap-1.5">
        {ROWS.map((o, i) => (
          <SkeletonRow key={i} opacity={o} />
        ))}
      </div>
    </div>
  )
}

/** Skeleton inline del board de ingeniería (mismo lenguaje visual que pipeline). */
export function EngineeringProcessSkeleton() {
  const { isMobile } = useResponsive()
  const count = isMobile ? 1 : 4

  return (
    <div className="flex min-h-0 w-full flex-1 animate-pulse flex-col gap-3">
      <div className="h-14 w-full shrink-0 rounded-2xl bg-foreground/5" />
      <div
        className={cn(
          "flex min-h-0 flex-1 gap-3 overflow-hidden",
          isMobile && "px-0",
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <SkeletonColumn key={i} isMobile={isMobile} />
        ))}
      </div>
    </div>
  )
}
