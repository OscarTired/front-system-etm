"use client"

import { useState } from "react"
import { BitacoraDepartmentPage } from "@/features/activity-log/components/bitacora-department-page"
import { TeamActivityLogPageContent } from "@/features/activity-log/components/contents/team-activity-log-page-content"
import { BITACORA_DEPARTMENTS } from "@/features/activity-log/constants/bitacora-departments"
import type { ActivityDepartment } from "@/features/activity-log/types/activity-log.types"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { Layers, Wrench, ShieldCheck } from "lucide-react"

type ViewMode = ActivityDepartment | "TEAM"

interface TabConfig {
  id: ViewMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  show: boolean
}

export default function BitacoraPage() {
  const userRoles = useAuthStore(state => state.user?.roles)
  const { has } = usePermissions()

  const roleCodes = userRoles?.map(role => role.code) ?? []
  const isAdmin = roleCodes.includes("ADMIN")

  const canSeeProduccion = isAdmin || BITACORA_DEPARTMENTS.PRODUCCION.roles.some(r => roleCodes.includes(r))
  const canSeeIngenieria = isAdmin || BITACORA_DEPARTMENTS.INGENIERIA.roles.some(r => roleCodes.includes(r))
  const canSeeTeam = has(PermissionCode.ACTIVITY_LOG_READ_ANY)

  const tabs: TabConfig[] = [
    { id: "PRODUCCION" as ViewMode, label: "Producción", icon: Layers, show: canSeeProduccion },
    { id: "INGENIERIA" as ViewMode, label: "Ingeniería", icon: Wrench, show: canSeeIngenieria },
    { id: "TEAM" as ViewMode, label: "Equipo", icon: ShieldCheck, show: canSeeTeam },
  ].filter(tab => tab.show)

  const [activeView, setActiveView] = useState<ViewMode>(() => {
    const firstAvailable = tabs.find(t => t.show)
    return firstAvailable ? firstAvailable.id : "PRODUCCION"
  })

  if (!userRoles) {
    return null
  }

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-neutral-400">
        <p>No tienes permisos para visualizar ninguna bitácora.</p>
      </div>
    )
  }

  return (
    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10 tablet:h-full">

      {/* Header adaptable con estructura idéntica a la vista de Usuarios */}
      <header className="hidden desktop:flex flex-wrap items-center justify-between gap-4 mb-4">
        
        {/* Título y subtítulo izquierdo */}
        <div className="min-w-0 flex-1 items-center gap-2 flex">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            BITÁCORA
          </h1>

          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />

          <p className="min-w-0 truncate text-sm text-neutral-500">
            Control y registro de actividades
          </p>
        </div>

        {/* Acciones o navegación derecha en desktop */}
        <div className="shrink-0">
          <nav className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              const isActive = activeView === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  title={tab.label}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? "bg-neutral-800 text-white shadow-sm" 
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

      </header>

      {/* Vista para dispositivos móviles / tabletas (Header alternativo) */}
      <div className="desktop:hidden flex flex-col gap-3 mb-4 pt-4">
        
        {/* Título oculto en móvil/tablet pero conservado con 'hidden' */}
        <div className="hidden items-center gap-2">
          <h1 className="text-xl font-bold tracking-widest">
            BITÁCORA
          </h1>
          <span className="h-1 w-1 rounded-full bg-neutral-700" />
          <p className="text-xs text-neutral-500 truncate">
            Control de actividades
          </p>
        </div>

        <nav className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
          {tabs.map(tab => {
            const IconComponent = tab.icon
            const isActive = activeView === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                title={tab.label}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  isActive 
                    ? "bg-neutral-800 text-white shadow-sm" 
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <IconComponent className="h-4 w-4 shrink-0" />
                <span className="max-[420px]:hidden truncate">
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Secciones de Contenido */}
      <section className="mt-2 min-h-0 flex-1 tablet:mt-3 flex flex-col w-full">
        {activeView === "PRODUCCION" && (
          <BitacoraDepartmentPage
            config={BITACORA_DEPARTMENTS.PRODUCCION}
          />
        )}

        {activeView === "INGENIERIA" && (
          <BitacoraDepartmentPage
            config={BITACORA_DEPARTMENTS.INGENIERIA}
          />
        )}

        {activeView === "TEAM" && (
          <TeamActivityLogPageContent />
        )}
      </section>

    </main>
  )
}
