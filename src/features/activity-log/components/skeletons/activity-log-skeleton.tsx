"use client"

function SkeletonEntry({
  opacity,
}: {
  opacity: number
}) {

  return (

    <div
      className="flex items-start gap-2.5 rounded-xl bg-white/4 p-2.5"
      style={{ opacity }}
    >

      <span className="size-8 shrink-0 rounded-full bg-white/8" />

      <div className="min-w-0 flex-1">
        <span className="block h-3.5 w-28 rounded bg-white/10" />
        <span className="mt-1.5 block h-3 w-40 rounded bg-white/6" />
      </div>

      <span className="h-3 w-10 shrink-0 rounded bg-white/6" />

    </div>

  )

}

function SkeletonShiftSection({
  rows,
}: {
  rows: number[]
}) {

  return (

    <div className="rounded-2xl bg-white/3 p-4">

      <div className="flex items-center gap-2.5">
        <span className="size-4 rounded-sm bg-white/10" />
        <span className="h-3.5 w-16 rounded bg-white/10" />
        <span className="h-3 w-20 rounded bg-white/6" />
      </div>

      <div className="mt-3 flex flex-col gap-2">

        {rows.map((opacity, index) => (
          <SkeletonEntry key={index} opacity={opacity} />
        ))}

      </div>

    </div>

  )

}

// Misma cantidad de franjas que SHIFT_DEFINITIONS (Mañana/Tarde/
// Noche) — se hardcodea acá en vez de importar la constante porque
// el skeleton no necesita saber nada real de cada franja, solo
// dibujar 3 bloques del mismo alto aproximado.
export function ActivityLogSkeleton() {

  return (

    <div className="flex animate-pulse flex-col gap-3">
      <SkeletonShiftSection rows={[1, 0.6]} />
      <SkeletonShiftSection rows={[1]} />
      <SkeletonShiftSection rows={[1, 0.6, 0.4]} />
    </div>

  )

}