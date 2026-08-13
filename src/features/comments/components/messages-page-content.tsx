"use client"

import { useQueryClient } from "@tanstack/react-query"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Image as ImageIcon,
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
  const queryClient = useQueryClient()

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
        "flex min-h-0 flex-1 flex-col",
        // Tablet: card centrada. Móvil/desktop: llena el section (sin
        // segundo título bajo el TopBar).
        "tablet:mx-auto tablet:h-[min(40rem,85dvh)] tablet:max-h-[85dvh] tablet:w-full tablet:max-w-180 tablet:overflow-hidden tablet:rounded-2xl tablet:bg-foreground/5",
      )}
    >
      <AppListScroll
        onRefresh={async () => {
          await queryClient.invalidateQueries({ queryKey: ["comments", "mine"] })
        }} className="overflow-x-hidden">
        {/* Header solo tablet (móvil = TopBar, desktop = page.tsx). */}
        <div className="mb-2 hidden shrink-0 px-2 py-2 tablet:block desktop:hidden">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg">
              <MessageSquare size={18} strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground">Mensajes</h2>
              <p className="text-xs text-muted-foreground">
                Solo los que tú escribiste
              </p>
            </div>
          </div>
        </div>

        {/* Search dentro del scroller → recibe paddingTop del TopBar. */}
        <div className="mb-2 shrink-0 px-1 py-1">
          <div className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2">
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en mis mensajes..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            />
          </div>
        </div>

        <div className="px-1 py-1">
        {loading ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2.5">
            <Spinner size={18} />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquare size={28} className="text-muted-foreground/80" />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar tus mensajes
            </p>
            <p className="max-w-sm text-xs text-muted-foreground/80">
              Requiere GET /comments/mine enriquecido en el backend.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-2 px-4 text-center">
            <MessageSquare size={28} className="text-muted-foreground/80" />
            <p className="text-sm text-muted-foreground">
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
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {c.task?.reference ??
                            c.project?.name ??
                            "Mensaje"}
                        </span>
                        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg bg-foreground/5 px-2 py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {c.task
                              ? "Esta tarea está en el historial"
                              : "Este elemento está en el historial"}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="flex h-6 items-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => openComment(c, true)}
                              className="flex h-6 items-center rounded-md bg-cyan-500/15 px-2 text-xs font-semibold text-primary transition-colors hover:bg-cyan-500/25"
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
                    className="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-foreground/5"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-border text-xs font-semibold text-foreground shadow-inner">
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
                            <span className="block truncate text-sm font-semibold text-foreground">
                              #{String(c.task.taskNumber).padStart(3, "0")}{" "}
                              {c.task.reference}
                            </span>
                          )}
                          {!c.task && c.project && (
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {c.project.projectCode} · {c.project.name}
                            </span>
                          )}
                          {!c.task && !c.project && (
                            <span className="block truncate text-sm font-semibold text-foreground">
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
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {ctx}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-1">
                        <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {scopeBadge(c)}
                        </span>
                      </div>

                      {c.parent && (
                        <div className="mt-1 flex items-start gap-1.5 rounded-md bg-foreground/5 px-2 py-1 text-xs text-muted-foreground">
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

                      <div className="mt-2 flex gap-2.5">
                        {c.imageUrl && (
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={c.imageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          {c.message ? (
                            <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                              {c.message}
                            </p>
                          ) : c.imageUrl ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ImageIcon size={12} />
                              Foto
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground/80">—</p>
                          )}
                          <p className="mt-1 text-[11px] text-muted-foreground/80">
                            {formatCommentDate(c.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </AppListScroll>
    </div>
  )
}