"use client"

import { useState } from "react"
import { CommentComposer } from "@/features/comments/components/comment-composer"
import { CommentTimeline } from "@/features/comments/components/comment-timeline"
import { useContainerWidth } from "@/shared/hooks/use-container-width"
import { cn } from "@/shared/utils/utils"
import type { Comment } from "@/features/comments/types/comment.types"

type Props = { projectId: string }

const STACK_BREAKPOINT_PX = 480

// min-h-43.5 (no h-43.5): esa altura es un PISO, no un techo. Fija
// no dejaba crecer al composer/timeline cuando el contenido
// necesitaba más espacio (ej: placeholder en 2 líneas), y todo se
// apretaba/cortaba. Con min-h, si no hay contenido cae en 43.5 igual
// que antes; si hay más, el panel crece.
export function ProjectCommentsPanel({ projectId }: Props) {

  const { ref, width } = useContainerWidth()

  const isNarrow = width !== null && width < STACK_BREAKPOINT_PX

  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const target = { scope: "project" as const, projectId }

  return (
    <div
      ref={ref}
      className="flex min-h-43.5 w-full flex-col rounded-xl bg-white/2 p-3"
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          isNarrow ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        <div className="flex min-h-0 flex-col gap-3">
          <CommentComposer
            target={target}
            editingComment={editingComment}
            onCancelEdit={() => setEditingComment(null)}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
        <CommentTimeline
          target={target}
          onEditComment={setEditingComment}
          onReplyComment={setReplyingTo}
        />
      </div>
    </div>

  )

}