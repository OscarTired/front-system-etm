"use client"

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function AgendaMonthSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col animate-pulse overflow-hidden rounded-2xl bg-[#0c0c0e]">
      <div className="grid shrink-0 grid-cols-7 border-b border-white/5">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="flex items-center justify-center py-2">
            <span className="h-3 w-8 rounded bg-white/8" />
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 6 }).map((_, week) => (
          <div
            key={week}
            className="grid min-h-0 border-b border-white/5 last:border-b-0"
            style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
          >
            {Array.from({ length: 7 }).map((_, day) => (
              <div
                key={day}
                className="flex min-h-0 flex-col items-center gap-1 border-r border-white/5 p-1 last:border-r-0"
                style={{ opacity: 1 - week * 0.08 }}
              >
                <span className="size-7 rounded-full bg-white/8" />
                <span className="h-1.5 w-6 rounded bg-white/6" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}