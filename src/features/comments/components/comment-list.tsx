"use client"

import { CommentItem } from "./comment-item"
import type { Comment } from "../types/comment.types"

type Props = {
  comments: Comment[]
  onEdit?: (comment: Comment) => void
  onDelete?: (comment: Comment) => void
  onReply?: (comment: Comment) => void
}

export function CommentList({ comments, onEdit, onDelete, onReply }: Props) {

  const topLevel = comments.filter(c => !c.parentId)

  const repliesByParent = new Map<string, Comment[]>()

  for (const comment of comments) {

    if (!comment.parentId) continue

    const list = repliesByParent.get(comment.parentId) ?? []
    list.push(comment)
    repliesByParent.set(comment.parentId, list)

  }

  // Huérfanas: responden a un comentario que ya no está en esta
  // lista (se borró de verdad en algún momento, o — caso raro —
  // pertenece a un padre fuera del rango cargado). Sin esto
  // desaparecerían del todo en vez de mostrarse sueltas — el quote
  // de CommentItem ya sabe mostrar "Comentario eliminado" para
  // este caso justamente.
  const topLevelIds = new Set(topLevel.map(c => c.id))
  const orphanReplies = comments.filter(
    c => c.parentId && !topLevelIds.has(c.parentId),
  )

  return (

    <div className="flex flex-col gap-1.5">

      {topLevel.map((comment) => (

        <div key={comment.id} className="flex flex-col gap-1.5">

          <CommentItem
            comment={comment}
            onEdit={onEdit}
            onDelete={onDelete}
            onReply={onReply}
          />

          {(repliesByParent.get(comment.id) ?? []).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              isReply
            />
          ))}

        </div>

      ))}

      {orphanReplies.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}

    </div>

  )

}