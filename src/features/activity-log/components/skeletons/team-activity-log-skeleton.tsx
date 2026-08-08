"use client"

function SkeletonTeamRow({
  opacity,
}: {
  opacity: number
}) {

  return (

    <div
      className="flex items-start gap-3 rounded-xl bg-white/3 p-3"
      style={{ opacity }}
    >

      <span className="size-9 shrink-0 rounded-full bg-white/8" />

      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-2">
          <span className="h-3.5 w-24 rounded bg-white/10" />
          <span className="h-3 w-10 rounded bg-white/6" />
        </div>

        <span className="mt-1.5 block h-3.5 w-32 rounded bg-white/8" />

      </div>

    </div>

  )

}

const SKELETON_ROWS = [1, 0.85, 0.7, 0.55, 0.4]

export function TeamActivityLogSkeleton() {

  return (

    <div className="flex animate-pulse flex-col gap-2">

      {SKELETON_ROWS.map((opacity, index) => (
        <SkeletonTeamRow key={index} opacity={opacity} />
      ))}

    </div>

  )

}