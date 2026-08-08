"use client"

// Skeleton de tipos de actividad — calco del listado real:
// buscador, encabezado de sección y filas a todo el ancho.

const ROW_OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

function SkeletonTypeRow({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex w-full items-center gap-3 rounded-xl bg-white/3 px-3 py-3"
      style={{ opacity }}
    >
      <span className="size-9 shrink-0 rounded-full bg-white/10" />

      <div className="min-w-0 flex-1">
        <span className="block h-4 w-36 rounded bg-white/12" />
        <span className="mt-1.5 block h-3 w-28 rounded bg-white/6" />
      </div>
    </div>
  )
}

function SkeletonSection({
  rows,
  opacities,
}: {
  rows: number
  opacities: number[]
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="h-3 w-28 rounded bg-white/8" />

      <div className="flex w-full flex-col gap-1.5">
        {opacities.slice(0, rows).map((opacity, i) => (
          <SkeletonTypeRow key={i} opacity={opacity} />
        ))}
      </div>
    </div>
  )
}

export function ActivityTypesSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-5">
      {/* Buscador a todo el ancho */}
      <div className="flex h-10 w-full items-center gap-2 rounded-xl bg-white/4 px-3 ring-1 ring-white/6">
        <span className="size-4 shrink-0 rounded bg-white/12" />
        <span className="h-3 w-24 rounded bg-white/8" />
      </div>

      <SkeletonSection rows={3} opacities={ROW_OPACITIES} />
      <SkeletonSection rows={2} opacities={ROW_OPACITIES.slice(1)} />
    </div>
  )
}