"use client"

import { CheckCircle2, PlayCircle, Zap } from "lucide-react"

import type { ActivityLog } from "../types/activity-log.types"

type Props = {
  logs: ActivityLog[]
}

type AutoKind = {
  icon: typeof CheckCircle2
  verb: string
  iconClass: string
  badgeClass: string
}

// Una sola sección para todos los registros AUTO (ver
// WorkflowService.start() / .complete() en el backend), no una por
// tipo: acá importa la secuencia cronológica del turno (inició tal
// proceso, más tarde completó tal otro), separarlos en bloques
// rompería esa lectura. Lo que sí cambia por fila es el ícono,
// color y verbo, según el code del ActivityType — así que si el
// día de mañana se agrega un tercer tipo AUTO, alcanza con sumarlo
// acá abajo, no hay que inventar una sección nueva.
//
// No viven dentro de ninguna franja horaria (shift=null a
// propósito) así que ShiftGroupSection nunca los muestra. Sin botón
// de eliminar: son un reflejo de trabajo real, no algo que la
// persona "registró a mano" y pueda deshacer libremente — y sin
// foto, en su lugar el ícono fijo que corresponda.
const AUTO_KIND: Record<string, AutoKind> = {

  TASK_STARTED: {
    icon: PlayCircle,
    verb: "Inició",
    iconClass: "text-sky-400",
    badgeClass: "bg-sky-500/15 text-sky-400",
  },

  TASK_COMPLETED: {
    icon: CheckCircle2,
    verb: "Completado",
    iconClass: "text-emerald-400",
    badgeClass: "bg-emerald-500/26 dark:bg-emerald-500/15 text-emerald-400",
  },

}

// Fallback por si aparece un code AUTO que todavía no está mapeado
// arriba — mejor mostrar algo genérico que romper el render. Acá sí
// no hay verbo propio, así que el label del tipo pasa a ser el
// texto principal de la fila (ver getRowContent).
const DEFAULT_KIND: AutoKind = {
  icon: Zap,
  verb: "",
  iconClass: "text-muted-foreground",
  badgeClass: "bg-foreground/10 text-muted-foreground",
}

// Devuelve siempre un AutoKind completo — evita el problema de
// encadenar "code && AUTO_KIND[code] ?? DEFAULT_KIND": como code es
// string | null, la rama falsy de ese && puede ser "" (no solo
// null), y ?? no cubre "", así que TS terminaba infiriendo
// "" | AutoKind en vez de AutoKind a secas.
function getAutoKind(code: string | null): AutoKind {

  if (code && AUTO_KIND[code]) {
    return AUTO_KIND[code]
  }

  return DEFAULT_KIND

}

// El verbo (kind.verb) y el label del ActivityType dicen lo mismo
// para los tipos ya mapeados ("Inició" vs. "Tarea iniciada") —
// mostrar los dos juntos queda redundante. Por eso el texto
// principal de la fila es el verbo solo cuando hay uno; el label
// completo del tipo solo aparece como fallback para un code no
// mapeado, donde no hay otra forma de decir qué fue.
function getRowText(kind: AutoKind, fallbackLabel: string) {
  return kind.verb || fallbackLabel
}

export function AutoActivitySection({ logs }: Props) {

  if (logs.length === 0) {
    return null
  }

  return (

    <div className="rounded-2xl bg-foreground/5 p-4">

      <div className="flex items-center gap-2.5">

        <Zap size={16} className="text-muted-foreground" />

        <span className="text-sm font-semibold text-foreground">
          Actividad automática
        </span>

      </div>

      <div className="mt-3 flex flex-col gap-2">

        {logs.map(log => {

          const kind = getAutoKind(log.activityType.code)

          const Icon = kind.icon

          const rowText = getRowText(kind, log.activityType.label)

          return (

            <div
              key={log.id}
              className="flex items-start gap-2.5 rounded-xl bg-foreground/5 p-2.5"
            >

              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${kind.badgeClass}`}>
                <Icon size={14} />
              </div>

              <div className="min-w-0 flex-1">

                <p className={`text-sm font-medium ${kind.iconClass}`}>
                  {rowText}
                </p>

                {log.project && (
                  <p className="mt-0.5 truncate text-xs text-primary">
                    {log.project.projectCode} · {log.project.name}
                    {log.task && ` · #${String(log.task.taskNumber).padStart(3, "0")} ${log.task.reference}`}
                  </p>
                )}

              </div>

              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.loggedAt).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

            </div>

          )

        })}

      </div>

    </div>

  )

}