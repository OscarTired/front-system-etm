"use client"

import { useQuery } from "@tanstack/react-query"

import { commentsService } from "../services/comments.service"
import { useAuth } from "@/features/auth/hooks/use-auth"
import type { Comment } from "../types/comment.types"

export const myCommentsQueryKey = ["comments", "mine"] as const

export type MyCommentItem = Comment & {
  isOwn: boolean
  isReplyToMine: boolean
}

/**
 * Mis mensajes + respuestas a los míos.
 *
 * GET /comments/mine debe devolver:
 *  - comments donde userId = me
 *  - comments donde parent.userId = me (respuestas a los míos)
 */
export function useMyComments(enabled = true) {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery({
    queryKey: myCommentsQueryKey,
    queryFn: ({ signal }) => commentsService.getMyComments(signal),
    enabled: enabled && Boolean(userId),
  })

  const comments: MyCommentItem[] = (query.data ?? [])
    .filter(c => {
      if (!userId) return false
      const isOwn = c.userId === userId || c.user?.id === userId
      const isReplyToMine =
        Boolean(c.parentId) && c.parent?.user?.id === userId
      return isOwn || isReplyToMine
    })
    .map(c => {
      const isOwn =
        Boolean(userId) && (c.userId === userId || c.user?.id === userId)
      return {
        ...c,
        isOwn,
        isReplyToMine: !isOwn,
      }
    })

  return {
    comments,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}
