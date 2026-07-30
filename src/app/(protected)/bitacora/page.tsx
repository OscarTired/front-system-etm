"use client"

import { useState } from "react"
import { BitacoraDepartmentPage } from "@/features/activity-log/components/bitacora-department-page"
import { TeamActivityLogPageContent } from "@/features/activity-log/components/team-activity-log-page-content"
import { BITACORA_DEPARTMENTS } from "@/features/activity-log/constants/bitacora-departments"
import { TaskAreaPanelTrigger } from "@/features/tasks/pipeline/components/panel/task-area-panel-trigger"
import type { ActivityDepartment } from "@/features/activity-log/types/activity-log.types"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"

type ViewMode = ActivityDepartment | "TEAM"

interface TabConfig {
  id: ViewMode
  label: string
  show: boolean
}

export default function BitacoraPage() {
  const userRoles = useAuthStore(state => state.user?.roles)
  const { has } = usePermissions()

  const roleCodes = userRoles?.map(role => role.code) ?? []
  const isAdmin = roleCodes.includes("ADMIN")

  // Validación basada en la configuración de departamentos y permisos (cero hardcode de roles aquí)
  const canSeeProduccion = isAdmin || BITACORA_DEPARTMENTS.PRODUCCION.roles.some(r => roleCodes.includes(r))
  const canSeeIngenieria = isAdmin || BITACORA_DEPARTMENTS.INGENIERIA.roles.some(r => roleCodes.includes(r))
  const canSeeTeam = has(PermissionCode.ACTIVITY_LOG_READ_ANY)

  // Construir la lista de pestañas permitidas
  const tabs: TabConfig[] = [
    { id: "PRODUCCION" as ViewMode, label: "Producción", show: canSeeProduccion },
    { id: "INGENIERIA" as ViewMode, label: "Ingeniería", show: canSeeIngenieria },
    { id: "TEAM" as ViewMode, label: "Equipo (Supervisión)", show: canSeeTeam },
  ].filter(tab => tab.show)

  // Estado inicial dinámico: la primera pestaña permitida
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
    <main className="flex flex-col bg-[#050505] px-4 pt-0 pb-5 text-white select-none tablet:px-8 tablet:pt-0 desktop:py-10">
      
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="shrink-0 text-xl font-bold tracking-widest tablet:text-2xl">
            BITÁCORA
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          
          {/* Selector dinámico que solo muestra las pestañas permitidas */}
          <nav className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeView === tab.id ? "bg-neutral-800 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeView === "PRODUCCION" && (
          <div className="hidden desktop:block">
            <TaskAreaPanelTrigger />
          </div>
        )}
      </header>

      {/* Renderizado de la vista activa */}
      {activeView === "PRODUCCION" && (
        <BitacoraDepartmentPage
          config={BITACORA_DEPARTMENTS.PRODUCCION}
          headerAction={<TaskAreaPanelTrigger />}
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

    </main>
  )
}