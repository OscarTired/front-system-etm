"use client"

import { CheckCircle2 } from "lucide-react"

import type { ActivityLog } from "../types/activity-log.types"

type Props = {
  logs: ActivityLog[]
}

// Sección aparte para los registros AUTO (ver
// WorkflowService.complete() en el backend) — no viven dentro de
// ninguna franja horaria (shift=null a propósito, no son un
// registro manual de turno) así que ShiftGroupSection nunca los
// muestra. Sin botón de eliminar: son un reflejo de trabajo real ya
// completado, no algo que la persona "registró a mano" y pueda
// deshacer libremente — y sin foto, en su lugar un check verde fijo
// que los distingue de un vistazo de los manuales.
export function AutoActivitySection({ logs }: Props) {

  if (logs.length === 0) {
    return null
  }

  return (

    <div className="rounded-2xl bg-white/3 p-4">

      <div className="flex items-center gap-2.5">

        <CheckCircle2 size={16} className="text-emerald-400" />

        <span className="text-sm font-semibold text-neutral-200">
          Tareas completadas
        </span>

      </div>

      <div className="mt-3 flex flex-col gap-2">

        {logs.map(log => (

          <div
            key={log.id}
            className="flex items-start gap-2.5 rounded-xl bg-white/4 p-2.5"
          >

            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={14} />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-sm font-medium text-neutral-200">
                {log.activityType.label}
              </p>

              {log.project && (
                <p className="mt-0.5 truncate text-xs text-cyan-400">
                  {log.project.projectCode} · {log.project.name}
                  {log.task && ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
                </p>
              )}

            </div>

            <span className="shrink-0 text-xs text-neutral-500">
              {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

          </div>

        ))}

      </div>

    </div>

  )

}