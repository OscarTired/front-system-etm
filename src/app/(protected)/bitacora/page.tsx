"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useState } from "react"
import { Layers, Wrench, ShieldCheck } from "lucide-react"

import { BitacoraDepartmentPage } from "@/features/activity-log/components/bitacora-department-page"
import { TeamActivityLogPageContent } from "@/features/activity-log/components/contents/team-activity-log-page-content"
import { BITACORA_DEPARTMENTS } from "@/features/activity-log/constants/bitacora-departments"
import type { ActivityDepartment } from "@/features/activity-log/types/activity-log.types"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"

type ViewMode = ActivityDepartment | "TEAM"

interface TabConfig {
  id: ViewMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  show: boolean
}

export default function BitacoraPage() {
  const queryClient = useQueryClient()

  const userRoles = useAuthStore(state => state.user?.roles)
  const { has } = usePermissions()

  const roleCodes = userRoles?.map(role => role.code) ?? []
  const isAdmin = roleCodes.includes("ADMIN")

  const canSeeProduccion =
    isAdmin ||
    BITACORA_DEPARTMENTS.PRODUCCION.roles.some(r => roleCodes.includes(r))
  const canSeeIngenieria =
    isAdmin ||
    BITACORA_DEPARTMENTS.INGENIERIA.roles.some(r => roleCodes.includes(r))
  const canSeeTeam = has(PermissionCode.ACTIVITY_LOG_READ_ANY)

  const tabs: TabConfig[] = [
    {
      id: "PRODUCCION" as ViewMode,
      label: "Producción",
      icon: Layers,
      show: canSeeProduccion,
    },
    {
      id: "INGENIERIA" as ViewMode,
      label: "Ingeniería",
      icon: Wrench,
      show: canSeeIngenieria,
    },
    {
      id: "TEAM" as ViewMode,
      label: "Equipo",
      icon: ShieldCheck,
      show: canSeeTeam,
    },
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

  function TabsNav({ compact }: { compact: boolean }) {
    return (
      <nav
        className={
          compact
            ? "flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-neutral-900 p-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
            : "flex items-center gap-1 rounded-xl bg-neutral-900 p-1"
        }
      >
        {tabs.map(tab => {
          const IconComponent = tab.icon
          const isActive = activeView === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              title={tab.label}
              className={
                compact
                  ? `flex flex-1 shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`
                  : `flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`
              }
            >
              <IconComponent className="h-4 w-4 shrink-0" />
              <span
                className={
                  compact ? "max-[420px]:hidden truncate" : "truncate"
                }
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-[#050505] px-3 pt-0 pb-2 text-white select-none tablet:px-4 desktop:px-5 desktop:pt-1 desktop:pb-3">
      {/* Desktop: chrome de página en flujo del shell (no overlay) */}
      <header className="mb-1 hidden shrink-0 flex-wrap items-center justify-between gap-2 desktop:flex">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="shrink-0 text-2xl font-bold tracking-widest">
            BITÁCORA
          </h1>
          <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
          <p className="min-w-0 truncate text-sm text-neutral-500">
            Control y registro de actividades
          </p>
        </div>
        <div className="shrink-0">
          <TabsNav compact={false} />
        </div>
      </header>

      {/*
        Contrato único (igual que tareas):
        un AppListScroll por superficie de lista.
        Tabs mobile DENTRO → mismo paddingTop del TopBar overlay.
        Cuerpo con embedded → sin segundo scroller.
      */}
      <section className="flex min-h-0 w-full flex-1 flex-col">
        <AppListScroll
          onRefresh={async () => {
            // Prefijo compartido de bitácora (día, rango, equipo).
            await queryClient.invalidateQueries({ queryKey: ["activity-log"] })
          }}
        >
          <div className="mb-2 desktop:hidden">
            <TabsNav compact />
          </div>

          {activeView === "PRODUCCION" && (
            <BitacoraDepartmentPage
              config={BITACORA_DEPARTMENTS.PRODUCCION}
              embedded
            />
          )}
          {activeView === "INGENIERIA" && (
            <BitacoraDepartmentPage
              config={BITACORA_DEPARTMENTS.INGENIERIA}
              embedded
            />
          )}
          {activeView === "TEAM" && (
            <TeamActivityLogPageContent embedded />
          )}
        </AppListScroll>
      </section>
    </main>
  )
}
