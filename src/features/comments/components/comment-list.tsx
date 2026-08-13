"use client"

import { useState } from "react"
import { ChevronDown, CornerDownRight } from "lucide-react"
import { CommentItem } from "./comment-item"
import type { Comment } from "../types/comment.types"

type Props = {
  comments: Comment[]
  onEdit?: (comment: Comment) => void
  onDelete?: (comment: Comment) => void
  onReply?: (comment: Comment) => void
}

export function CommentList({ comments, onEdit, onDelete, onReply }: Props) {
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({})

  const toggleThread = (commentId: string) => {
    setExpandedThreads(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const topLevel = comments.filter(c => !c.parentId)

  const repliesByParent = new Map<string, Comment[]>()

  for (const comment of comments) {
    if (!comment.parentId) continue
    const list = repliesByParent.get(comment.parentId) ?? []
    list.push(comment)
    repliesByParent.set(comment.parentId, list)
  }

  const topLevelIds = new Set(topLevel.map(c => c.id))
  const orphanReplies = comments.filter(
    c => c.parentId && !topLevelIds.has(c.parentId),
  )

  return (
    <div className="flex w-full flex-col gap-3">
      {topLevel.map((comment) => {
        const replies = repliesByParent.get(comment.id) ?? []
        const hasReplies = replies.length > 0
        const isExpanded = Boolean(expandedThreads[comment.id])

        return (
          <div key={comment.id} className="flex w-full flex-col gap-2">
            <CommentItem
              comment={comment}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
            />

            {hasReplies && (
              <div className="flex flex-col gap-2 pl-6">
                <button
                  type="button"
                  onClick={() => toggleThread(comment.id)}
                  className="group/btn flex items-center gap-2 self-start rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-foreground/10 hover:text-foreground active:scale-95"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/10">
                    <CornerDownRight size={10} className="text-muted-foreground" />
                  </span>
                  {isExpanded
                    ? "Ocultar respuestas"
                    : `Ver ${replies.length} ${replies.length === 1 ? "respuesta" : "respuestas"}`}
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Contenedor animado con técnica CSS Grid para transicionar altura suavemente */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-2 pt-1">
                      {replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onReply={onReply}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

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