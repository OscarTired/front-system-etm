"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  Reply,
  Search,
} from "lucide-react"

import {
  useMyComments,
  type MyCommentItem,
} from "@/features/comments/hooks/use-my-comments"
import { resolveMyCommentHref } from "@/features/comments/utils/resolve-my-comment-href"
import { formatCommentDate } from "@/features/comments/utils/format-comment-date"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { DynamicBadge } from "@/shared/ui/badge/dynamic-badge"
import { AppListScroll } from "@/shared/ui/vertical-scroll/app-list-scroll"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

function contextLabel(c: MyCommentItem): string {
  if (c.task?.project) {
    return `${c.task.project.projectCode} | ${c.task.project.name}`
  }
  if (c.project) {
    return `${c.project.projectCode} | ${c.project.name}`
  }
  return ""
}

function scopeBadge(c: MyCommentItem): string {
  if (c.workflowStep) {
    return `PROCESO · ${c.workflowStep.processCode}`
  }
  if (c.task) return "TAREA"
  if (c.project) return "PROYECTO"
  return "MENSAJE"
}

/**
 * Centro Mensajes — layout history dialog + filas enriquecidas
 * como NotificationItem (contexto, proceso/tarea, histórico).
 */
export function MessagesPageContent() {
  const router = useRouter()
  const { comments, loading, error } = useMyComments(true)
  const [search, setSearch] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return comments
    return comments.filter(c => {
      const ctx = contextLabel(c).toLowerCase()
      return (
        c.message.toLowerCase().includes(q) ||
        ctx.includes(q) ||
        scopeBadge(c).toLowerCase().includes(q) ||
        (c.task?.reference?.toLowerCase().includes(q) ?? false) ||
        (c.parent?.message?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [comments, search])

  function openComment(c: MyCommentItem, forceHistory = false) {
    const isHistorical = c.route?.history === true

    // Igual que el Bell: si está en historial, pedir confirmación
    if (isHistorical && !forceHistory) {
      setConfirmId(c.id)
      return
    }

    setConfirmId(null)
    router.push(
      resolveMyCommentHref(c, {
        history: forceHistory || isHistorical,
      }),
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/2",
        "tablet:mx-auto tablet:h-[min(40rem,85dvh)] tablet:max-h-[85dvh] tablet:w-full tablet:max-w-180",
      )}
    >
      {/* Header — oculto en móvil (el top bar ya muestra "Mensajes")
          y en desktop (ahí el título ya lo muestra page.tsx, con el
          mismo texto — mostrar los dos a la vez duplicaba el
          título). Solo vive en el rango intermedio (tablet). */}
      <div className="hidden shrink-0 px-5 py-4 tablet:block desktop:hidden">
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <MessageSquare size={18} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-neutral-100">Mensajes</h2>
            <p className="text-xs text-neutral-500">
              Solo los que tú escribiste
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 px-5 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <Search size={15} className="shrink-0 text-neutral-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en mis mensajes..."
            className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
          />
        </div>
      </div>

      <AppListScroll
        className="overflow-x-hidden px-3 py-2"
      >
        {loading ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2.5">
            <Spinner size={18} />
            <p className="text-sm text-neutral-500">Cargando...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquare size={28} className="text-neutral-600" />
            <p className="text-sm text-neutral-400">
              No se pudieron cargar tus mensajes
            </p>
            <p className="max-w-sm text-xs text-neutral-600">
              Requiere GET /comments/mine enriquecido en el backend.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquare size={28} className="text-neutral-600" />
            <p className="text-sm text-neutral-400">
              {search.trim()
                ? "Sin resultados para esa búsqueda"
                : "Aún no has escrito mensajes"}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {filtered.map(c => {
              const isHistorical = c.route?.history === true
              const isConfirming = confirmId === c.id
              const status = c.workflowStep
                ? WORKFLOW_STATUS_DEFINITIONS[c.workflowStep.status]
                : undefined
              const ctx = contextLabel(c)

              if (isConfirming) {
                return (
                  <li key={c.id}>
                    <div className="flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-neutral-200">
                          {c.task?.reference ??
                            c.project?.name ??
                            "Mensaje"}
                        </span>
                        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                          <span className="text-xs text-neutral-400">
                            {c.task
                              ? "Esta tarea está en el historial"
                              : "Este elemento está en el historial"}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="flex h-6 items-center rounded-md px-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-white/8 hover:text-neutral-200"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => openComment(c, true)}
                              className="flex h-6 items-center rounded-md bg-cyan-500/15 px-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/25"
                            >
                              Ver igual
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              }

              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openComment(c)}
                    className="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/5"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-white/8 text-xs font-semibold text-white shadow-inner">
                      {c.user.avatarUrl ? (
                        <img
                          src={c.user.avatarUrl}
                          alt={c.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        c.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {c.task && (
                            <span className="block truncate text-sm font-semibold text-neutral-200">
                              #{String(c.task.taskNumber).padStart(3, "0")}{" "}
                              {c.task.reference}
                            </span>
                          )}
                          {!c.task && c.project && (
                            <span className="block truncate text-sm font-semibold text-neutral-200">
                              {c.project.projectCode} · {c.project.name}
                            </span>
                          )}
                          {!c.task && !c.project && (
                            <span className="block truncate text-sm font-semibold text-neutral-200">
                              Mensaje
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {status && (
                            <div className="origin-right scale-[0.8]">
                              <DynamicBadge
                                compact
                                label={status.label}
                                color={status.color}
                                icon={status.icon}
                              />
                            </div>
                          )}
                          {typeof isHistorical === "boolean" && (
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                isHistorical
                                  ? "bg-amber-500/15 text-amber-300/90"
                                  : "bg-emerald-500/10 text-emerald-400/90",
                              )}
                            >
                              {isHistorical ? "HISTÓRICO" : "ACTIVO"}
                            </span>
                          )}
                        </div>
                      </div>

                      {ctx && (
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {ctx}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-1">
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                          {scopeBadge(c)}
                        </span>
                      </div>

                      {c.parent && (
                        <div className="mt-1 flex items-start gap-1.5 rounded-md bg-white/4 px-2 py-1 text-xs text-neutral-500">
                          <Reply
                            size={11}
                            className="mt-0.5 shrink-0 -scale-x-100"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {c.parent.deletedAt
                              ? "Comentario eliminado"
                              : `${c.parent.user.name}: ${c.parent.message || "📷 Foto"}`}
                          </span>
                        </div>
                      )}

                      <p className="mt-1.5 line-clamp-2 text-sm text-neutral-400">
                        {c.message || (c.imageUrl ? "Imagen" : "—")}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-600">
                        {formatCommentDate(c.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </AppListScroll>
    </div>
  )
}