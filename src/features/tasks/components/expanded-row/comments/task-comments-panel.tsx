"use client"

import { useState } from "react"
import { CommentComposer } from "@/features/comments/components/comment-composer"
import { CommentTimeline } from "@/features/comments/components/comment-timeline"
import { useContainerWidth } from "@/shared/hooks/use-container-width"
import { cn } from "@/shared/utils/utils"
import type { Comment } from "@/features/comments/types/comment.types"

type Props = { taskId: string }

// Debajo de este ancho REAL medido, ya no entran cómodas las 2
// columnas (composer + timeline) — se apilan en 1. No es un
// breakpoint del viewport (isMobile): este panel puede vivir
// adentro de una card angosta aunque el viewport sea "desktop".
const STACK_BREAKPOINT_PX = 480

export function TaskCommentsPanel({ taskId }: Props) {

  const { ref, width } = useContainerWidth()

  // null (todavía no midió) se trata como "ancho" — evita un
  // parpadeo de 1 columna -> 2 apenas monta.
  const isNarrow = width !== null && width < STACK_BREAKPOINT_PX

  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const target = { scope: "task" as const, taskId }

  return (
    <div
      ref={ref}
      className="flex min-h-43.5 w-full flex-col rounded-xl bg-white/2 p-3"
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-3",
          // Antes esto usaba isMobile (breakpoint global del
          // viewport) — no se enteraba de que el panel podía vivir
          // en una card angosta aunque el viewport fuera "desktop".
          // Ahora mide su PROPIO ancho real.
          isNarrow ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        <div className="flex min-h-0 flex-col gap-3">
          <CommentComposer
            target={target}
            editingComment={editingComment}
            onCancelEdit={() => setEditingComment(null)}
          />
        </div>
        <CommentTimeline target={target} onEditComment={setEditingComment} />
      </div>
    </div>

  )

}