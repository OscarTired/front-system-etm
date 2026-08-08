"use client"

function SkeletonActivityRow({
  opacity,
}: {
  opacity: number
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-white/3 p-3"
      style={{ opacity }}
    >
      <div className="size-9 shrink-0 rounded-full bg-white/10" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-3 w-16 rounded bg-white/8" />
      </div>
      <div className="flex items-center gap-1">
        <span className="size-8 rounded-lg bg-white/8" />
        <span className="size-8 rounded-lg bg-white/8" />
        <span className="size-8 rounded-lg bg-white/8" />
      </div>
    </div>
  )
}

function SkeletonSection({
  rows,
}: {
  rows: number
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="h-3 w-28 rounded bg-white/10 px-1" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonActivityRow
            key={index}
            opacity={Math.max(1 - index * 0.15, 0.35)}
          />
        ))}
      </div>
    </section>
  )
}

export function ActivityTypesSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <SkeletonSection rows={3} />
      <SkeletonSection rows={2} />
    </div>
  )
}