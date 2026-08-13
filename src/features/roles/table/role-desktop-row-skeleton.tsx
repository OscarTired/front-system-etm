"use client"

// Calco exacto de la fila real de RoleDesktopRow (punto de color +
// texto), sin datos -- mismo motivo que project-mobile-skeleton.tsx:
// vive junto al componente real para que sea imposible que se
// desincronicen entre sí.
//
// Sin wrapper propio con padding/gap a propósito: esto se inserta
// DENTRO del mismo contenedor que ya tiene "gap-2.5 p-2" para las
// filas reales (ver role-permissions-page-content.tsx) -- envolverlo
// acá también hubiera duplicado el espaciado durante la carga.
function SkeletonRoleDesktopRow({ opacity }: { opacity: number }) {
  return (
    <div
      className="flex w-full animate-pulse items-center justify-between gap-3 px-3 py-2.5"
      style={{ opacity }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-2.5 shrink-0 rounded-full bg-foreground/10" />
        <span className="h-4 w-28 rounded bg-foreground/10" />
      </div>
    </div>
  )
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4]

export function RoleDesktopRowSkeleton() {
  return (
    <>
      {OPACITIES.map((opacity, index) => (
        <SkeletonRoleDesktopRow key={index} opacity={opacity} />
      ))}
    </>
  )
}
