"use client"

function SkeletonUserRow({
  opacity,
}: {
  opacity: number
}) {

  return (

    <article
      className="overflow-hidden rounded-xl bg-foreground/5"
      style={{ opacity }}
    >

      <button
        type="button"
        disabled
        className="w-full text-left"
      >

        <header className="flex items-center justify-between gap-2.5 px-3 py-3">

          <span className="h-4 w-24 rounded bg-foreground/10" />

          <span className="inline-flex items-center gap-1.5">

            <span className="h-1.5 w-1.5 rounded-full bg-foreground/10" />

            <span className="h-4 w-18 rounded bg-foreground/10" />

          </span>

        </header>

        <div className="flex items-center gap-2.5 px-3 pb-3">

          <div className="min-w-0 flex-1">

            <span className="block h-8 w-full rounded-full bg-foreground/5" />

          </div>

          <span className="h-4 w-4 shrink-0 rounded-sm bg-foreground/5" />

        </div>

      </button>

    </article>

  )

}

const SKELETON_ROWS = [
  1,
  0.85,
  0.7,
  0.55,
  0.4,
  0.3,
]

export function UserMobileSkeleton() {

  return (

    <div className="flex animate-pulse flex-col gap-3">

      {SKELETON_ROWS.map((opacity, index) => (

        <SkeletonUserRow
          key={index}
          opacity={opacity}
        />

      ))}

    </div>
  )
}