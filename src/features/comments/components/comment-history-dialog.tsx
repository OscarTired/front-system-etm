"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Search, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner/spinner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { preventNestedDialogClose } from "@/shared/ui/dialogs/prevent-nested-dialog-close"
import { cn } from "@/shared/utils/utils"

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
  readOnly?: boolean
}

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
  readOnly = false,
}: Props) {

  const [search, setSearch] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)

  const { comments, loading } = useComments(target, open)
  const { deleteComment } = useDeleteComment(target)

  const targetId = getTargetId(target)

  useEffect(() => {

    if (!open) return

    commentsService
      .markCommentsAsRead(target)
      .catch(() => {})

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

  const isCenteredState = loading || filteredComments.length === 0

  return (

    <>

      <Dialog open={open} onOpenChange={onOpenChange}>

        <DialogContent
          size="large"
          className="flex min-h-120 max-h-screen w-180 max-w-180 flex-col overflow-hidden rounded-2xl bg-[#101012] p-0 text-white shadow-2xl"
          onPointerDownOutside={preventNestedDialogClose}
          onInteractOutside={preventNestedDialogClose}
        >

          <DialogHeader className="px-5 py-4">

            <div className="flex items-start gap-4">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <MessageSquare size={18} strokeWidth={2.4} />
              </div>
          
              <div className="min-w-0 flex-1">

                <DialogTitle className="text-lg font-bold text-neutral-100">
                  Mensajes
                </DialogTitle>

                <DialogDescription className="sr-only">
                  Lista completa de mensajes
                </DialogDescription>

              </div>

            </div>

          </DialogHeader>

          <div className="shrink-0 px-5 py-3">
            {readOnly ? (
              <p className="rounded-lg bg-white/3 px-3 py-2.5 text-center text-xs text-neutral-500">
                Esta tarea ya está finalizada — se puede ver el historial, pero no agregar mensajes nuevos.
              </p>
            ) : (
              <CommentComposer
                target={target}
                editingComment={editingComment}
                onCancelEdit={() => setEditingComment(null)}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            )}
          </div>

          <div className="shrink-0 px-5 py-3">

            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <Search size={15} className="shrink-0 text-neutral-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar en mensajes..."
                className="w-full bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
              />
            </div>

          </div>

          <ScrollArea className={cn("min-h-0 px-5 py-4", isCenteredState && "flex-1 flex flex-col")}>

            {loading ? (
              <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-2.5 my-auto min-h-65">
                <Spinner size={18} />
                <p className="text-sm text-neutral-500">Cargando...</p>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="flex h-full w-full flex-1 items-center justify-center my-auto min-h-65">
                <EmptyComments />
              </div>
            ) : (
              <CommentList
                comments={filteredComments}
                onEdit={readOnly ? undefined : handleEdit}
                onDelete={readOnly ? undefined : setPendingDelete}
                onReply={readOnly ? undefined : setReplyingTo}
              />
            )}

          </ScrollArea>

        </DialogContent>

      </Dialog>

      <ActionDialog
        open={!!pendingDelete}
        title="Eliminar mensaje"
        description={
          pendingDelete
            ? `¿Eliminar el mensaje de ${pendingDelete.user.name}? Esta acción no se puede deshacer.`
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