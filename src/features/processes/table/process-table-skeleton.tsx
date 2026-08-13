"use client"

// Skeleton mobile de Procesos — la vista mobile de ProcessTable
// reutiliza directamente TaskProcessColumn (las mismas cards
// compactas que el pipeline: número, punto de prioridad, referencia,
// badge de estado). Este skeleton calca esos mismos bones — mismo
// h-12, mismo padding, mismos anchos — para que no haya salto de
// layout al terminar de cargar. Antes esta página caía al spinner
// genérico (EntityTableLoading) en mobile, sin skeleton propio.

function SkeletonProcessTaskRow({ opacity }: { opacity: number }) {

  return (

    <div
      className="flex h-12 items-center gap-2.5 rounded-xl bg-foreground/5 px-3"
      style={{ opacity }}
    >

      <span className="h-3.5 w-9 shrink-0 rounded bg-foreground/10" />

      <span className="size-1.5 shrink-0 rounded-full bg-foreground/15" />

      <span className="h-3.5 flex-1 rounded bg-foreground/10" />

      <span className="h-5 w-14 shrink-0 rounded-md bg-foreground/10" />

    </div>

  )

}

const SKELETON_OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

export function ProcessTableSkeleton() {

  return (

    <div className="flex animate-pulse flex-col gap-2 px-2 py-2">

      {SKELETON_OPACITIES.map((opacity, i) => (

        <SkeletonProcessTaskRow key={i} opacity={opacity} />

      ))}

    </div>

  )

}