"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MessageSquare, Search, ExternalLink, Reply } from "lucide-react"

import {
  useMyComments,
  type MyCommentItem,
} from "@/features/comments/hooks/use-my-comments"
import type { Comment } from "@/features/comments/types/comment.types"
import { cn } from "@/shared/utils/utils"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"
import { formatCommentDate } from "@/features/comments/utils/format-comment-date"

function hrefFor(c: Comment): string {
  if (c.taskId) return `/tasks?taskId=${c.taskId}&tab=comments`
  if (c.projectId) return `/projects?projectId=${c.projectId}&tab=comments`
  return "/tasks"
}

function scopeLabel(c: Comment): string {
  if (c.workflowStepId) return "Proceso"
  if (c.taskId) return "Tarea"
  if (c.projectId) return "Proyecto"
  return "Mensaje"
}

/** Tus mensajes y las respuestas a ellos. */
export function MessagesPageContent() {
  const { comments, loading, error } = useMyComments(true)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return comments
    return comments.filter(
      (c: MyCommentItem) =>
        c.message.toLowerCase().includes(q) ||
        c.user?.name?.toLowerCase().includes(q) ||
        scopeLabel(c).toLowerCase().includes(q),
    )
  }, [comments, search])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Cargando tus mensajes…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-white/2 px-4 text-center">
        <MessageSquare size={28} className="text-neutral-600" />
        <p className="text-sm text-neutral-400">
          No se pudieron cargar tus mensajes
        </p>
        <p className="max-w-sm text-xs text-neutral-600">
          Requiere GET /comments/mine: tus comentarios y respuestas a ellos.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white/2">
      <div className="flex shrink-0 items-start gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <MessageSquare size={18} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-neutral-100">Mis mensajes</h2>
          <p className="text-xs text-neutral-500">
            Tus mensajes y respuestas · {comments.length}
          </p>
        </div>
      </div>

      <div className="shrink-0 border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
          <Search size={14} className="shrink-0 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <MessageSquare size={28} className="text-neutral-600" />
          <p className="text-sm text-neutral-400">
            {search.trim() ? "Sin resultados" : "Aún no hay mensajes"}
          </p>
          <p className="max-w-xs text-xs text-neutral-600">
            Aquí verás lo que escribes y lo que te responden.
          </p>
        </div>
      ) : (
        <VerticalScroll
          className="min-h-0 flex-1"
          containerClassName="h-full min-h-0"
        >
          <ul className="flex flex-col gap-1.5 p-3 pb-6">
            {filtered.map((c: MyCommentItem) => {
              const reply = c.isReplyToMine
              return (
                <li key={c.id}>
                  <Link
                    href={hrefFor(c)}
                    className="flex items-start gap-3 rounded-xl bg-white/3 px-3.5 py-3 transition hover:bg-white/6"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        reply
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-sky-500/15 text-sky-300",
                      )}
                    >
                      {reply ? <Reply size={14} /> : <MessageSquare size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                          {scopeLabel(c)}
                        </span>
                        {reply ? (
                          <span className="text-[11px] font-medium text-violet-300/90">
                            Te respondió {c.user?.name ?? "alguien"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500">Tú</span>
                        )}
                        <span className="text-[10px] tabular-nums text-neutral-600">
                          {formatCommentDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-sm text-neutral-200">
                        {c.message || (c.imageUrl ? "Imagen" : "—")}
                      </p>
                      {c.parent && (
                        <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                          Ref:{" "}
                          {c.parent.deletedAt
                            ? "(eliminado)"
                            : c.parent.message}
                        </p>
                      )}
                    </div>
                    <ExternalLink
                      size={14}
                      className="mt-1 shrink-0 text-neutral-600"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </VerticalScroll>
      )}
    </div>
  )
}
