"use client"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

const ROWS = [1, 0.85, 0.7, 0.55, 0.4]

type Props = {
  accentColor?: string
  columnCount?: number
  /** Muestra franja de operarios bajo el header (ingeniería). */
  showOperatorsRow?: boolean
}

/** Skeleton del shell ProcessBoard — misma estructura que el board real. */
export function ProcessBoardSkeleton({
  accentColor = "#16A34A",
  columnCount = 4,
  showOperatorsRow = false,
}: Props) {
  const { isMobile } = useResponsive()
  const cols = isMobile ? 1 : columnCount

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 animate-pulse flex-col select-none">
      <div className="mb-3 shrink-0">
        <div
          className="flex w-full items-center gap-3 rounded-2xl p-3"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, transparent)`,
          }}
        >
          <span className="h-11 w-11 shrink-0 rounded-xl bg-foreground/5" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
            <div className="text-right">
              <span className="ml-auto block h-2.5 w-16 rounded bg-foreground/10" />
              <span className="ml-auto mt-2 block h-4 w-8 rounded bg-foreground/12" />
            </div>
            <span className="h-8 w-px shrink-0 bg-foreground/10" />
            <div className="text-right">
              <span className="ml-auto block h-2.5 w-16 rounded bg-foreground/10" />
              <span className="ml-auto mt-2 block h-4 w-8 rounded bg-foreground/12" />
            </div>
          </div>
          <span className="h-9 w-9 shrink-0 rounded-full bg-foreground/5" />
        </div>
      </div>

      <div className="relative min-h-0 w-full flex-1">
        <div className={cn("flex h-full min-h-0", !isMobile && "gap-3")}>
          {Array.from({ length: cols }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-full min-h-0 shrink-0 flex-col",
                isMobile ? "w-full min-w-full" : "w-72 min-w-72",
              )}
            >
              <div className="flex shrink-0 items-center gap-2 border-b border-border px-2 py-2.5">
                <span className="size-6 rounded-md bg-foreground/10" />
                <span className="h-3.5 w-28 rounded bg-foreground/10" />
                <span className="ml-auto h-3.5 w-4 rounded bg-foreground/5" />
              </div>
              {showOperatorsRow && (
                <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border/50 px-1">
                  <span className="h-7 flex-1 rounded-lg bg-foreground/5" />
                  <span className="size-7 shrink-0 rounded-lg bg-foreground/5" />
                </div>
              )}
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-0.5 pt-1">
                {ROWS.map((o, j) => (
                  <div
                    key={j}
                    className="h-12 rounded-xl bg-foreground/5"
                    style={{ opacity: o }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
