"use client"

import {
  UserActions,
} from "@/features/admin/users/components/actions/user-actions"

import {
  UsersPageContent,
} from "@/features/admin/users/components/users-page-content"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

export default function UsersPage() {

  usePageTitle("Usuarios")

  return (

    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">

      <header className="hidden desktop:flex flex-wrap items-center justify-between gap-4 mb-4">

        <div className="min-w-0 flex-1 items-center gap-2 flex">

          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            USUARIOS
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Gestión de usuarios
          </p>

        </div>

        <div className="shrink-0">

          <UserActions />

        </div>

      </header>

      <div className="desktop:hidden">
        <UserActions />
      </div>

      <section className="mt-2 min-h-0 flex-1 tablet:mt-3">

        <UsersPageContent />

      </section>

    </main>

  )

}