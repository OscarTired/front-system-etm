"use client"
import { useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { useComments } from "../hooks/use-comments"
import { useDeleteComment } from "../hooks/use-delete-comment"
import { commentsService } from "../services/comments.service"
import { CommentList } from "./comment-list"
import { EmptyComments } from "./empty-comments"
import { CommentHistoryDialog } from "./comment-history-dialog"
import type {
  Comment,
  CommentTarget,
} from "../types/comment.types"
type Props={
  target:CommentTarget
  onEditComment?:(comment:Comment)=>void
  onReplyComment?:(comment:Comment)=>void
}

// Extrae un id estable del target, sin importar el scope, solo para
// usarlo como dependencia del useEffect de abajo (no se muestra en UI).
function getTargetId(target: CommentTarget) {
  if (target.scope === "task") return target.taskId
  if (target.scope === "workflowStep") return target.workflowStepId
  return target.projectId
}

export function CommentTimeline({
  target,
  onEditComment,
  onReplyComment,
}:Props){
  const[
    historyOpen,
    setHistoryOpen,
  ]=useState(false)
  const[
    pendingDelete,
    setPendingDelete,
  ]=useState<Comment|null>(null)
  const{
    comments,
    loading,
  }=useComments(target)
  const{
    deleteComment,
  }=useDeleteComment(target)

  const targetId = getTargetId(target)
  const markedReadRef = useRef<string | null>(null)

  // Una sola vez por target al tener datos. Evita PATCH /comments/read
  // en bucle cuando comments.length / loading parpadean o el padre re-renderiza.
  useEffect(() => {
    if (loading || comments.length === 0) return
    if (markedReadRef.current === targetId) return
    markedReadRef.current = targetId

    commentsService
      .markCommentsAsRead(target)
      .catch(() => {
        // no crítico — permitir reintento si falla
        markedReadRef.current = null
      })
  }, [loading, comments.length, target.scope, targetId, target])

  function handleConfirmDelete(){
    if(!pendingDelete){
      return
    }
    deleteComment(
      pendingDelete,
    )
    setPendingDelete(
      null,
    )
  }
  return(
    <>
      <div className="flex h-full min-h-0 flex-col rounded-xl bg-white/2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-300">
            Últimos mensajes
          </span>
          <button
            type="button"
            onClick={()=>
              setHistoryOpen(
                true,
              )
            }
            className="text-sm font-medium text-neutral-300 transition-colors hover:text-cyan-300"
          >
            Ver más →
          </button>
        </div>

        <ScrollArea className="max-h-32 px-3 pb-3">
          {loading?(
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-neutral-500">
                Cargando...
              </p>
            </div>
          ):comments.length===0?(
            <EmptyComments/>
          ):(
            <CommentList
              comments={comments}
              onEdit={onEditComment}
              onDelete={setPendingDelete}
              onReply={onReplyComment}
            />
          )}
        </ScrollArea>
        <CommentHistoryDialog
          target={target}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onEditComment={onEditComment}
        />
      </div>
      <ActionDialog
        open={!!pendingDelete}
        title="Eliminar comentario"
        description={
          pendingDelete
            ?`¿Eliminar el comentario de ${pendingDelete.user.name}? Esta acción no se puede deshacer.`
            :""
        }
        icon={Trash2}
        confirmLabel="Eliminar"
        variant="danger"
        onClose={()=>
          setPendingDelete(
            null,
          )
        }
        onConfirm={
          handleConfirmDelete
        }
      />
    </>
  )
}