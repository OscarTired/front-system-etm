"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { commentsService } from "../services/comments.service"
import { commentsQueryKey } from "../utils/comment-target"
import { myCommentsQueryKey } from "./use-my-comments"
import type { Comment, CommentTarget } from "../types/comment.types"

export function useDeleteComment(target: CommentTarget) {

  const queryClient = useQueryClient()
  const queryKey = commentsQueryKey(target)

  const mutation = useMutation({

    mutationFn: (comment: Comment) => commentsService.deleteComment(comment.id),

    // No lo sacamos de la lista todavía: lo marcamos como "deleting"
    // para que el ítem pueda mostrar su propio estado ("Borrando…") y
    // bloquear sus acciones, sin esperar los ~1.3s de confirmación del
    // servidor. Recién desaparece de verdad en onSuccess.
    onMutate: async (comment) => {

      await queryClient.cancelQueries({ queryKey })

      const previousComments =
        queryClient.getQueryData<Comment[]>(queryKey)

      queryClient.setQueryData<Comment[]>(
        queryKey,
        current =>
          (current ?? []).map(c =>
            c.id === comment.id
              ? ({ ...c, deleting: true } as unknown as Comment)
              : c,
          ),
      )

      return { previousComments, commentId: comment.id }

    },

    onError: (_err, _comment, context) => {

      // El borrado falló de verdad (permiso, comentario ajeno, etc.):
      // lo regresamos a su estado normal, no por lentitud sino porque
      // de verdad no se borró.
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }

    },

    onSuccess: (_data, _comment, context) => {

      // Confirmado por el servidor: ahí sí lo sacamos de la lista.
      queryClient.setQueryData<Comment[]>(
        queryKey,
        current =>
          (current ?? []).filter(c => c.id !== context?.commentId),
      )

      void queryClient.invalidateQueries({ queryKey: myCommentsQueryKey })

    },

  })

  return {
    deleteComment: mutation.mutateAsync,
    // Mismo criterio que en useCreateComment: no uses esto para
    // deshabilitar nada global (composer, lista entera). El estado
    // "borrándose" de UN comentario puntual se lee de ese comentario
    // con `comment.deleting`, no de acá.
    deleting: mutation.isPending,
  }

}