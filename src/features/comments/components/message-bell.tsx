"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  MessageSquare,
  Search,
  Image as ImageIcon,
  Reply,
  CheckCircle2,
} from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useManagedOverlay } from "@/shared/stores/hooks/use-managed-overlay"
import { SidebarRow } from "@/shared/responsive/layout/sidebar/sidebar-row"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FormDialogHeader } from "@/shared/ui/dialogs/form-dialog/form-dialog-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner/spinner"

import {
  useMyComments,
  type MyCommentItem,
} from "@/features/comments/hooks/use-my-comments"
import { resolveMyCommentHref } from "@/features/comments/utils/resolve-my-comment-href"
import { formatCommentDate } from "@/features/comments/utils/format-comment-date"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"

type Props = {
  collapsed?: boolean
  variant?: "sidebar" | "topbar"
}

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
  if (c.workflowStep) return `PROCESO · ${c.workflowStep.processCode}`
  if (c.task) return "TAREA"
  if (c.project) return "PROYECTO"
  return "MENSAJE"
}

/**
 * Igual que NotificationBell:
 * - sidebar → SidebarRow + Popover
 * - topbar (móvil) → icono + Dialog centrado con FormDialogHeader
 *   (NO bottomsheet / sheet del Popover)
 */
export function MessageBell({ collapsed, variant = "sidebar" }: Props) {
  const { open, setOpen } = useManagedOverlay("messages")
  const [search, setSearch] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const router = useRouter()
  const queryClient = useQueryClient()
  const sidebarMode = useSidebarStore(s => s.mode)
  const isTopbar = variant === "topbar"

  const { comments, loading, error } = useMyComments(open)

  useEffect(() => {
    if (isTopbar) return
    if (sidebarMode === "closed") setOpen(false)
  }, [sidebarMode, isTopbar, setOpen])

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
    if (isHistorical && !forceHistory) {
      setConfirmId(c.id)
      return
    }
    setConfirmId(null)
    setOpen(false)
    router.push(
      resolveMyCommentHref(c, {
        history: forceHistory || isHistorical,
      }),
    )
  }

  const count = comments.length

  function renderTrigger() {
    if (isTopbar) {
      return (
        <button
          type="button"
          aria-label="Mensajes"
          onClick={() => setOpen(!open)}
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-neutral-300 shadow-lg shadow-black/20 backdrop-blur-xl transition hover:bg-white/15 active:bg-white/20",
            open && "bg-white/20 text-white",
          )}
        >
          <MessageSquare size={16} strokeWidth={2} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-900 text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        type="button"
        title={collapsed ? "Mensajes" : undefined}
        className="w-full text-left"
      >
        <SidebarRow
          icon={MessageSquare}
          label="Mensajes"
          collapsed={collapsed}
          active={open}
          count={count > 0 ? (count > 9 ? "9+" : count) : undefined}
          collapsedBadgeColor="bg-sky-900 text-white"
          badgeColor="bg-sky-900 text-white"
          badgeAnimated={count > 0}
        />
      </button>
    )
  }

  const panelBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-3 pb-2 pt-1">
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

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-2 pb-2">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2">
              <Spinner size={18} />
              <p className="text-sm text-neutral-500">Cargando...</p>
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center">
              <MessageSquare size={28} className="text-neutral-600" />
              <p className="text-sm text-neutral-400">No se pudieron cargar</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center">
              <CheckCircle2 size={28} className="text-neutral-600" />
              <p className="text-sm text-neutral-400">
                {search.trim() ? "Sin resultados" : "Aún no escribiste mensajes"}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {filtered.map(c => {
                const ctx = contextLabel(c)
                const isHistorical = c.route?.history === true
                const status = c.workflowStep
                  ? WORKFLOW_STATUS_DEFINITIONS[c.workflowStep.status]
                  : null
                const confirming = confirmId === c.id

                return (
                  <li key={c.id}>
                    {confirming ? (
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="mb-2 text-xs text-neutral-400">
                          Este mensaje está en un ítem histórico. ¿Abrir igual?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openComment(c, true)}
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Abrir
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="rounded-lg px-3 py-1.5 text-xs text-neutral-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openComment(c)}
                        className="w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-1.5 text-xs">
                          <span className="min-w-0 flex-1 truncate text-neutral-200">
                            {ctx || scopeBadge(c)}
                          </span>
                          <span className="shrink-0 text-[10px] text-neutral-600">
                            {formatCommentDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-500">
                          {scopeBadge(c)}
                          {typeof isHistorical === "boolean" && (
                            <span
                              className={cn(
                                isHistorical ? "text-neutral-500" : "text-cyan-400",
                              )}
                            >
                              · {isHistorical ? "Histórico" : "Activo"}
                            </span>
                          )}
                        </p>
                        {c.parent && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-neutral-500">
                            <Reply size={11} className="mt-0.5 shrink-0 -scale-x-100" />
                            <span className="min-w-0 flex-1 truncate">
                              {c.parent.deletedAt
                                ? "Comentario eliminado"
                                : `${c.parent.user.name}: ${c.parent.message || "📷 Foto"}`}
                            </span>
                          </div>
                        )}
                        <div className="mt-1 flex gap-2">
                          {c.imageUrl && (
                            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-black/40 ring-1 ring-white/8">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={c.imageUrl} alt="" className="size-full object-cover" />
                            </div>
                          )}
                          {c.message ? (
                            <p className="line-clamp-1 min-w-0 flex-1 text-xs text-neutral-400">
                              {c.message}
                            </p>
                          ) : c.imageUrl ? (
                            <p className="flex items-center gap-1 text-xs text-neutral-500">
                              <ImageIcon size={12} /> Foto
                            </p>
                          ) : null}
                        </div>
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </ScrollArea>

      <div className="flex h-10 shrink-0 items-center justify-center p-2 select-none">
        {comments.length === 0 && !loading ? (
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
            <CheckCircle2 size={13} className="shrink-0 text-neutral-600" />
            Sin mensajes
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["comments", "mine"] })
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
          >
            Actualizar
          </button>
        )}
      </div>
    </div>
  )

  if (isTopbar) {
    return (
      <>
        {renderTrigger()}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            size="large"
            className="flex max-h-[min(36rem,85dvh)] flex-col overflow-hidden rounded-2xl p-0 text-white shadow-2xl"
          >
            <FormDialogHeader title="Mensajes" icon={MessageSquare} />
            <p className="px-4 pb-1 text-xs text-neutral-500">
              Solo los mensajes que tú escribiste
            </p>
            {panelBody}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      <PopoverContent
        data-sidebar-popover
        side="right"
        align="start"
        sideOffset={8}
        className="z-40 flex h-[min(32rem,75dvh)] w-full min-w-90 max-w-lg flex-col overflow-hidden border-none p-0 text-white shadow-xl select-none"
      >
        <div className="flex shrink-0 items-center px-3.5 pt-3">
          <span className="text-sm font-semibold text-neutral-200">Mensajes</span>
        </div>
        {panelBody}
      </PopoverContent>
    </Popover>
  )
}
