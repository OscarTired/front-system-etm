"use client"

import { useState } from "react"
import { CommentComposer } from "@/features/comments/components/comment-composer"
import { CommentTimeline } from "@/features/comments/components/comment-timeline"
import { useContainerWidth } from "@/shared/hooks/use-container-width"
import { cn } from "@/shared/utils/utils"
import type { Comment } from "@/features/comments/types/comment.types"

type Props = { workflowStepId: string }

const STACK_BREAKPOINT_PX = 480

export function ProcessCommentsPanel({ workflowStepId }: Props) {

  const { ref, width } = useContainerWidth()

  const isNarrow = width !== null && width < STACK_BREAKPOINT_PX

  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const target = { scope: "workflowStep" as const, workflowStepId }

  return (
    <div
      ref={ref}
      className="flex min-h-43.5 w-full flex-col rounded-xl bg-white/2 p-3"
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          isNarrow
            ? "grid-cols-1 grid-rows-[auto_minmax(0,1fr)]"
            : "grid-cols-2",
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