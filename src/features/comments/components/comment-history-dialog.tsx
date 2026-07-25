"use client"

import { useEffect, useState } from "react"
import { Search, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { preventNestedDialogClose } from "@/shared/ui/dialogs/prevent-nested-dialog-close"

import { useComments } from "../hooks/use-comments"
import { useDeleteComment } from "../hooks/use-delete-comment"
import { commentsService } from "../services/comments.service"
import { CommentComposer } from "./comment-composer"
import { CommentList } from "./comment-list"
import { EmptyComments } from "./empty-comments"
import type { Comment, CommentTarget } from "../types/comment.types"

type Props = {
  target: CommentTarget
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditComment?: (comment: Comment) => void
}

// Extrae un id estable del target, sin importar el scope, solo para
// usarlo como dependencia del useEffect de abajo (no se muestra en UI).
function getTargetId(target: CommentTarget) {
  if (target.scope === "task") return target.taskId
  if (target.scope === "workflowStep") return target.workflowStepId
  return target.projectId
}

export function CommentHistoryDialog({
  target,
  open,
  onOpenChange,
  onEditComment,
}: Props) {

  const [search, setSearch] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null)
  // Edición inline dentro del propio diálogo — separado del
  // onEditComment externo (que algunos consumidores usan para editar
  // desde OTRO composer, afuera de este diálogo). Si no se pasa
  // onEditComment, este estado local se usa para editar sin salir de
  // acá.
  const [editingComment, setEditingComment] = useState<Comment | null>(null)

  const { comments, loading } = useComments(target, open)
  const { deleteComment } = useDeleteComment(target)

  const targetId = getTargetId(target)

  // Al abrir el historial, marcamos como leídas las notificaciones de
  // esta tarea/step. Es la acción explícita de "vine y vi los
  // comentarios" que dispara el doble check para quien comentó.
  // Nota: para comentarios de proyecto esto es un no-op (ver
  // commentsService.markCommentsAsRead), ya que no generan
  // notificaciones.
  useEffect(() => {

    if (!open) return

    commentsService
      .markCommentsAsRead(target)
      .catch(() => {
        // no crítico: si falla, el usuario simplemente puede
        // marcar como leído manualmente desde la campana
      })

  }, [open, target.scope, targetId])

  const filteredComments = search.trim()
    ? comments.filter(c =>
        c.message.toLowerCase().includes(search.toLowerCase()) ||
        c.user.name.toLowerCase().includes(search.toLowerCase()),
      )
    : comments

  const handleEdit = (comment: Comment) => {

    if (onEditComment) {
      onEditComment(comment)
      onOpenChange(false)
      return
    }

    setEditingComment(comment)

  }

  const handleConfirmDelete = () => {

    if (!pendingDelete) return

    deleteComment(pendingDelete)
    setPendingDelete(null)

  }

  return (

    <>

      <Dialog open={open} onOpenChange={onOpenChange}>

        <DialogContent
          className="flex h-[70vh] max-w-lg flex-col gap-0 overflow-hidden p-0"
          onPointerDownOutside={preventNestedDialogClose}
          onInteractOutside={preventNestedDialogClose}
        >

          <DialogHeader className="px-4 py-3.5">
            <DialogTitle className="text-sm font-semibold text-neutral-200">
              Historial
            </DialogTitle>
            <DialogDescription className="sr-only">
              Historial completo de comentarios
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-2.5">
            <CommentComposer
              target={target}
              editingComment={editingComment}
              onCancelEdit={() => setEditingComment(null)}
            />
          </div>

          <div className="px-4 py-2.5">

            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <Search size={15} className="shrink-0 text-neutral-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en comentarios..."
                className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
              />
            </div>

          </div>

          <ScrollArea className="min-h-0 flex-1 px-4 py-3">

            {loading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-neutral-500">Cargando...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <EmptyComments />
            ) : (
              <CommentList
                comments={filteredComments}
                onEdit={handleEdit}
                onDelete={setPendingDelete}
              />
            )}

          </ScrollArea>

        </DialogContent>

      </Dialog>

      <ActionDialog
        open={!!pendingDelete}
        title="Eliminar comentario"
        description={
          pendingDelete
            ? `¿Eliminar el comentario de ${pendingDelete.user.name}? Esta acción no se puede deshacer.`
            : ""
        }
        icon={Trash2}
        confirmLabel="Eliminar"
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />

    </>

  )

}