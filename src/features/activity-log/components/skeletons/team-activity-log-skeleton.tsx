"use client"

// Skeleton bitácora equipo — w-full en todo el árbol (sin max-w).

const ROW_OPACITIES = [1, 0.85, 0.7, 0.55, 0.4]

function SkeletonTeamCard({ opacity }: { opacity: number }) {
  return (
    <div
      className="w-full rounded-2xl bg-white/3 p-4"
      style={{ opacity }}
    >
      <div className="flex items-start gap-4">
        <span className="size-10 shrink-0 rounded-full bg-white/10" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="h-4 w-32 rounded bg-white/12" />
            <div className="flex items-center gap-2">
              <span className="h-5 w-14 rounded-md bg-white/6" />
              <span className="h-3 w-10 rounded bg-white/6" />
            </div>
          </div>

          <span className="mt-2 block h-3.5 w-2/5 rounded bg-white/10" />
          <span className="mt-2 block h-3 w-3/5 rounded bg-white/6" />
        </div>
      </div>
    </div>
  )
}

function SkeletonUserSection({ opacities }: { opacities: number[] }) {
  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between border-b border-white/8 pb-2">
        <span className="h-7 w-36 rounded-lg bg-white/10" />
        <span className="h-6 w-20 rounded-lg bg-white/6" />
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
          <span className="size-3 rounded bg-white/8" />
          <span className="h-3 w-20 rounded bg-white/8" />
        </div>

        <div className="flex w-full flex-col gap-3">
          {opacities.map((opacity, i) => (
            <SkeletonTeamCard key={i} opacity={opacity} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function TeamActivityLogSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-8">
      <SkeletonUserSection opacities={ROW_OPACITIES.slice(0, 3)} />
      <SkeletonUserSection opacities={ROW_OPACITIES.slice(0, 2)} />
    </div>
  )
}