"use client"

import { UserActions } from "@/features/admin/users/components/actions/user-actions"
import { RolePermissionsPageContent } from "@/features/roles/components/role-permissions-page-content"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

/**
 * Hub único de administración de personas y permisos.
 * Reemplaza /admin/users y /admin/roles (mismas capacidades, una sola UI).
 */
export default function AccessPage() {
  usePageTitle("Acceso")

  return (
    <main className="flex h-full min-h-0 flex-col bg-background px-3 pt-0 pb-2 text-foreground select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">ACCESO</h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            Usuarios, roles y permisos
          </p>
        </div>
        <div className="shrink-0">
          <UserActions />
        </div>
      </header>

      {/* FAB crear usuario (mobile) — mismo UserActions */}
      <div className="desktop:hidden">
        <UserActions />
      </div>

      <section className="flex min-h-0 w-full flex-1 flex-col">
        <RolePermissionsPageContent />
      </section>
    </main>
  )
}
