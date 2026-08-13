"use client"
import {
  Check,
  CheckCheck,
  ImageIcon,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { formatCommentDate } from "../utils/format-comment-date"
import { commentsService } from "../services/comments.service"
import { CommentImageDialog } from "./comment-image-dialog"
import type { Comment } from "../types/comment.types"

type Props={
  comment:Comment
  onEdit?:(comment:Comment)=>void
  onDelete?:(comment:Comment)=>void
  onReply?:(comment:Comment)=>void
  // Solo para el indent visual — ver comment-list.tsx, que agrupa
  // respuestas debajo de su comentario padre.
  isReply?:boolean
}

export function CommentItem({
  comment,
  onEdit,
  onDelete,
  onReply,
  isReply,
}:Props){
  const currentUser=useAuthStore(s=>s.user)
  const { has }=usePermissions()
  const { user }=comment
  const isPending=Boolean(comment.pending)
  // Marcado por useDeleteComment#onMutate apenas se confirma el
  // ActionDialog, mientras el servidor responde (~1.3s). Mientras
  // esto es true: sin acciones (nada de reintentar borrar sobre un
  // comentario que el backend ya está procesando -> "no encontrado"),
  // y el usuario ve que algo está pasando en vez de que no reaccione.
  const isDeleting=Boolean(comment.deleting)
  const isOwner=currentUser?.id===user.id
  const canDeleteAny=has(PermissionCode.COMMENT_DELETE_ANY)
  const canEdit=isOwner&&!isPending&&!isDeleting
  const canDelete=(isOwner||canDeleteAny)&&!isPending&&!isDeleting
  const canReply=has(PermissionCode.COMMENT_CREATE)&&!isPending&&!isDeleting

  // La foto NO se muestra abierta acá adentro — en paneles chicos
  // (como "Últimos comentarios") eso rompía todo el layout, empujando
  // el resto del contenido. Solo mostramos un botón compacto; la
  // imagen a tamaño completo vive en CommentImageDialog, que se abre
  // recién al tocarlo.
  const [imageDialogOpen, setImageDialogOpen]=useState(false)

  // El doble check solo le sirve al autor del comentario. Se hidrata
  // con fetch inicial y luego se actualiza solo, en vivo, cuando llega
  // el evento realtime COMMENT_READ_STATUS (ver comment-read-status-handler).
  const { data: readStatus }=useQuery({
    queryKey:["comment-read-status",comment.id],
    queryFn:()=>commentsService.getReadStatus(comment.id),
    enabled:isOwner&&!isPending&&!isDeleting,
  })

  return(
    <div
      className={`group animate-comment-in flex gap-2.5 rounded-lg bg-foreground/5 px-3 py-2.5 transition-colors hover:bg-foreground/5 ${
        isPending||isDeleting?"opacity-60":""
      } ${
        isReply?"ml-8 border-l-2 border-border pl-3":""
      }`}
    >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-white/10 to-white/5 ring-1 ring-border text-xs font-semibold text-foreground shadow-inner">
        {user.avatarUrl ? (
            <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-full w-full object-cover"
            />
        ) : (
            user.name.charAt(0).toUpperCase()
        )}
        </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </span>
              {isPending ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                  Enviando…
                </span>
              ) : isDeleting ? (
                <span className="flex items-center gap-1 text-xs text-red-400/80">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  Eliminando…
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {formatCommentDate(comment.createdAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(canEdit||canDelete||canReply)&&(
              <div className="flex items-center gap-0.5 opacity-100 transition-opacity duration-200 tablet:opacity-0 tablet:group-hover:opacity-100">
                {canReply&&(
                  <IconAction
                    icon={Reply}
                    onClick={()=>
                      onReply?.(comment)
                    }
                  />
                )}
                {canEdit&&(
                  <IconAction
                    icon={Pencil}
                    onClick={()=>
                      onEdit?.(comment)
                    }
                  />
                )}
                {canDelete&&(
                  <IconAction
                    icon={Trash2}
                    variant="danger"
                    onClick={()=>
                      onDelete?.(comment)
                    }
                  />
                )}
              </div>
            )}
            {isOwner && !isPending && !isDeleting && readStatus && (
              <span
                className="shrink-0"
                title={
                  readStatus.status === "SENT"
                    ? "Enviado"
                    : readStatus.status === "READ_PARTIAL"
                      ? `Visto por ${readStatus.readCount}/${readStatus.total}`
                      : "Visto por todos"
                }
              >
                {readStatus.status === "SENT" && (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="text-muted-foreground"
                  />
                )}

                {readStatus.status === "READ_PARTIAL" && (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="text-green-400"
                  />
                )}

                {readStatus.status === "READ_ALL" && (
                  <CheckCheck
                    size={14}
                    strokeWidth={2.5}
                    className="text-cyan-400"
                  />
                )}
              </span>
            )}
          </div>
        </div>
        {comment.parent && (

          <div className="mt-1 flex items-start gap-1.5 rounded-md bg-foreground/5 px-2 py-1 text-xs text-muted-foreground">
            <Reply
              size={11}
              className="mt-0.5 shrink-0 -scale-x-100"
            />

            <div className="min-w-0 flex-1">
              {comment.parent.deletedAt ? (
                <span>Comentario eliminado</span>
              ) : (
                <>
                  <span className="font-medium text-muted-foreground">
                    {comment.parent.user.name}:
                  </span>{" "}
                  <span className="whitespace-pre-wrap wrap-break-word">
                    {comment.parent.message || "📷 Foto"}
                  </span>
                </>
              )}
            </div>

          </div>

        )}

        {comment.message && (

          <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-muted-foreground">
            {comment.message}
          </p>

        )}

        {comment.imageUrl && (
          <button
            type="button"
            onClick={() => setImageDialogOpen(true)}
            disabled={isDeleting}
            className="mt-2 block max-w-[min(100%,16rem)] overflow-hidden rounded-xl border border-border bg-black/30 text-left transition hover:border-border disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.imageUrl}
              alt="Foto adjunta"
              className="aspect-[4/5] max-h-64 w-full object-cover"
            />
          </button>
        )}
      </div>

      <CommentImageDialog
        imageUrl={imageDialogOpen ? comment.imageUrl : null}
        onClose={()=>setImageDialogOpen(false)}
      />
    </div>
  )
}