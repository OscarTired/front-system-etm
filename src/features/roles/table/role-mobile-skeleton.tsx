"use client"

// Skeleton mobile de Roles -- calco estructural exacto de
// SkeletonUserRow (user-mobile-skeleton.tsx): mismo wrapper
// <button disabled>, mismo padding de header (px-3 py-3) separado
// de la fila de contenido (px-3 pb-3), mismo tamaño de label
// (h-4 w-24), y el mismo fade de opacidad de 6 pasos.
//
// Sin wrapper propio con gap a propósito: esto se inserta DENTRO del
// mismo "space-y-3" que ya envuelve las cards reales (ver
// role-permissions-page-content.tsx) -- envolverlo acá también
// hubiera duplicado el espaciado durante la carga.
function SkeletonRoleMobileCard({ opacity }: { opacity: number }) {
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

          {/* Placeholder del "Inactivo" opcional de la card real */}
          <span className="hidden h-4 w-14 rounded bg-foreground/10" />
        </header>

        <div className="flex items-center gap-2.5 px-3 pb-3">
          <div className="min-w-0 flex-1">
            <span className="block h-8 w-full rounded-full bg-foreground/5" />
          </div>
        </div>
      </button>
    </article>
  )
}

const OPACITIES = [1, 0.85, 0.7, 0.55, 0.4, 0.3]

export function RoleMobileSkeleton() {
  return (
    <>
      {OPACITIES.map((opacity, index) => (
        <SkeletonRoleMobileCard key={index} opacity={opacity} />
      ))}
    </>
  )
}