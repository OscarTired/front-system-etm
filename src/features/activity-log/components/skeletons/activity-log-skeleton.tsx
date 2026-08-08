"use client"

// Skeleton de bitácora del día — calco de ShiftGroupSection + filas de log.
// Mismo padding/gap que el contenido real para no saltar layout.

const ROW_OPACITIES = [1, 0.85, 0.7, 0.55]

function SkeletonLogRow({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl bg-white/4 p-2.5"
      style={{ opacity }}
    >
      <span className="size-8 shrink-0 rounded-full bg-white/10" />
      <div className="min-w-0 flex-1">
        <span className="block h-3.5 w-2/5 rounded bg-white/12" />
        <span className="mt-1.5 block h-3 w-3/5 rounded bg-white/6" />
      </div>
      <span className="h-3 w-10 shrink-0 rounded bg-white/6" />
    </div>
  )
}

function SkeletonShiftGroup({
  slots,
  baseOpacity,
}: {
  slots: number
  baseOpacity: number
}) {
  return (
    <div className="rounded-2xl bg-white/3 p-4" style={{ opacity: baseOpacity }}>
      <div className="flex items-center gap-2.5">
        <span className="size-4 shrink-0 rounded bg-white/10" />
        <span className="h-3.5 w-28 rounded bg-white/12" />
      </div>

      <div className="mt-3 flex flex-col gap-4">
        {Array.from({ length: slots }).map((_, slotIndex) => (
          <div key={slotIndex} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-16 shrink-0 rounded bg-white/8" />
              <span className="h-px flex-1 bg-white/8" />
            </div>

            <div className="flex flex-col gap-2">
              {ROW_OPACITIES.slice(0, slotIndex === 0 ? 3 : 2).map((opacity, i) => (
                <SkeletonLogRow key={i} opacity={opacity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActivityLogSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      {/* Auto section placeholder */}
      <div className="rounded-2xl bg-white/3 p-4">
        <div className="flex items-center gap-2.5">
          <span className="size-4 shrink-0 rounded bg-white/10" />
          <span className="h-3.5 w-24 rounded bg-white/12" />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <SkeletonLogRow opacity={1} />
          <SkeletonLogRow opacity={0.7} />
        </div>
      </div>

      <SkeletonShiftGroup slots={2} baseOpacity={1} />
      <SkeletonShiftGroup slots={1} baseOpacity={0.85} />
      <SkeletonShiftGroup slots={2} baseOpacity={0.65} />
    </div>
  )
}