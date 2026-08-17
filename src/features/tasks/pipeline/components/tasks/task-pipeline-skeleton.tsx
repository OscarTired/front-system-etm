"use client"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"
import { PIPELINE_KPI_COLORS } from "../../utils/process-columns"

const PROGRESS_COLOR = PIPELINE_KPI_COLORS.progress
const ROWS = [1, 0.85, 0.7, 0.55, 0.4]

/** Mismo shell que ProcessBoard (KPI + columnas). Sin padding extra. */
export function TaskPipelineSkeleton() {
  const { isMobile } = useResponsive()

  return (
    <div className="relative flex min-h-0 w-full flex-1 animate-pulse flex-col select-none">
      <div className="mb-3 shrink-0">
        <div
          className="flex w-full items-center gap-3 rounded-2xl p-3 tablet:gap-4 tablet:p-4"
          style={{
            background: `linear-gradient(135deg, ${PROGRESS_COLOR}20, transparent)`,
          }}
        >
          <span className="h-11 w-11 shrink-0 rounded-xl bg-foreground/5" />
          <span className="hidden h-3 w-16 shrink-0 rounded bg-foreground/10 tablet:block" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">
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
          {(isMobile ? [0] : [0, 1, 2, 3]).map(i => (
            <div
              key={i}
              className={cn(
                "flex shrink-0 flex-col",
                isMobile ? "h-full w-full min-w-full" : "w-72 min-w-72",
              )}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                <span className="size-6 rounded-md bg-foreground/10" />
                <span className="h-3.5 w-24 rounded bg-foreground/10" />
                <span className="ml-auto h-3.5 w-4 rounded bg-foreground/5" />
              </div>
              <div className="border-b border-border px-2 py-1">
                <div className="flex h-10 items-center gap-2 px-1">
                  <span className="h-7 flex-1 rounded-lg bg-foreground/5" />
                </div>
              </div>
              <div className="flex flex-col gap-2 px-2 py-2">
                {ROWS.map((o, j) => (
                  <div
                    key={j}
                    className="h-14 rounded-xl bg-foreground/5"
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
