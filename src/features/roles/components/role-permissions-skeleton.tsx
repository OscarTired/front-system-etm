"use client"

// El skeleton de la lista de Roles (desktop y mobile) vive en
// src/features/roles/table/ (role-desktop-row-skeleton.tsx,
// role-mobile-skeleton.tsx), junto a sus componentes reales -- igual
// convención que project-mobile-skeleton.tsx. Acá solo queda el
// skeleton del panel de Permisos, que es igual en los dos breakpoints.

function SkeletonPermissionToggle({
  opacity,
}: {
  opacity: number
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5"
      style={{ opacity }}
    >
      <span className="size-4.5 shrink-0 rounded-md bg-foreground/5" />
      <span className="h-3.5 w-24 rounded bg-foreground/10" />
    </div>
  )
}

function SkeletonPermissionGroup({
  rows,
}: {
  rows: number
}) {
  return (
    <section className="rounded-2xl bg-foreground/5 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="h-3 w-28 rounded bg-foreground/10" />
        <div className="h-6 w-20 rounded-full bg-foreground/5" />
      </header>

      <div className="grid grid-cols-1 gap-1 tablet:grid-cols-2 desktop:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonPermissionToggle
            key={index}
            opacity={Math.max(1 - index * 0.14, 0.3)}
          />
        ))}
      </div>
    </section>
  )
}

export function RolePermissionsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <SkeletonPermissionGroup rows={4} />
      <SkeletonPermissionGroup rows={3} />
      <SkeletonPermissionGroup rows={5} />
    </div>
  )
}
