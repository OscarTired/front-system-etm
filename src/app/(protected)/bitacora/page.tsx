"use client"

import { useState } from "react"
import { BitacoraDepartmentPage } from "@/features/activity-log/components/bitacora-department-page"
import { TeamActivityLogPageContent } from "@/features/activity-log/components/team-activity-log-page-content"
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
    <main className="flex flex-col bg-[#050505] px-3 pt-3 pb-5 text-white select-none sm:px-4 tablet:px-8 desktop:py-10">
      
      {/* Header Limpio sin el trigger de tareas (movido a ActivityLogPageContent) */}
      <header className="flex flex-col gap-4 mb-6 tablet:flex-row tablet:items-center tablet:justify-between">
        
        {/* Bloque principal izquierdo: Título + Navegación */}
        <div className="flex flex-col tablet:flex-row tablet:items-center gap-3 w-full tablet:w-auto min-w-0 flex-1">
          <div className="flex items-center justify-between w-full tablet:w-auto gap-3">
            <h1 className="text-xl font-bold tracking-widest tablet:text-2xl">
              BITÁCORA
            </h1>
            <span className="hidden tablet:inline-block h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          </div>
          
          {/* Navegación sin scrollbar */}
          <nav className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl w-full tablet:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              const isActive = activeView === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  title={tab.label}
                  className={`flex-1 tablet:flex-initial flex items-center justify-center gap-2 px-3 py-2 tablet:py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                    isActive 
                      ? "bg-neutral-800 text-white shadow" 
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span className="max-[420px]:hidden tablet:max-lg:hidden desktop:inline truncate">
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Secciones de Contenido */}
      <section className="flex flex-col flex-1 w-full">
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