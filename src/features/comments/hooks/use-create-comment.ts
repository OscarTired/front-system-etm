"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/features/auth/store/auth-store"

import { commentsService } from "../services/comments.service"
import { commentsQueryKey } from "../utils/comment-target"
import { myCommentsQueryKey } from "./use-my-comments"
import {
  bumpEntityCommentCounts,
  locationFromTarget,
} from "../utils/bump-entity-comment-counts"
import type { Comment, CommentTarget, CreateCommentDto } from "../types/comment.types"

export function useCreateComment(target:CommentTarget){

  const queryClient=useQueryClient()
  const queryKey=commentsQueryKey(target)
  const currentUser=useAuthStore(s=>s.user)

  const mutation=useMutation({

    mutationFn:(dto:CreateCommentDto):Promise<Comment>=>{
      if(target.scope==="task"){
        return commentsService.createTaskComment(target.taskId,dto)
      }
      if(target.scope==="workflowStep"){
        return commentsService.createWorkflowStepComment(target.workflowStepId,dto)
      }
      return commentsService.createProjectComment(target.projectId,dto)
    },

    // El comentario aparece YA en pantalla, sin esperar la confirmación
    // del servidor (que hoy tarda ~1.3s por latencia de infraestructura
    // de la base, algo ajeno al código de la app). Si el servidor
    // confirma, se reemplaza el temporal por el real sin parpadeo. Si
    // falla de verdad (no por lentitud), se revierte solo.
    onMutate: async (dto) => {

      await queryClient.cancelQueries({ queryKey })

      const previousComments =
        queryClient.getQueryData<Comment[]>(queryKey)

      const optimisticId = `optimistic-${crypto.randomUUID()}`
      const now = new Date().toISOString()

      // OJO: esto asume la forma de `user` en Comment (id, username,
      // name, avatarUrl, color, icon — ver commentUserSelect) y que
      // useAuthStore().user trae esos mismos campos. Si el store de auth
      // no tiene `username`/`color`/`icon`, este comentario optimista se
      // va a ver con esos valores en blanco/placeholder por una fracción
      // de segundo hasta que se reemplace por el real — avisame si es
      // el caso y ajusto los nombres de campo exactos.
      const optimisticComment = {
        id: optimisticId,
        taskId: target.scope === "task" ? target.taskId : null,
        projectId: target.scope === "project" ? target.projectId : null,
        workflowStepId: target.scope === "workflowStep" ? target.workflowStepId : null,
        userId: currentUser?.id ?? "",
        message: dto.message?.trim() ?? "",
        // El base64 ya es un data URI válido como src de <img> — se
        // muestra tal cual mientras se sube, sin esperar la URL real
        // de Storage que devuelve el servidor.
        imageUrl: dto.imageBase64 ?? null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        parentId: dto.parentId ?? null,
        // null hasta que se reemplace por el real — el composer ya
        // muestra a qué se está respondiendo mientras se escribe, así
        // que no hace falta reconstruir el preview acá para esta
        // ventana optimista tan corta.
        parent: null,
        // Flag interno (no existe en la respuesta real del servidor):
        // permite que el ítem de la lista muestre su propio loader y
        // bloquee edición/borrado SOLO en este comentario, sin tocar el
        // resto del entorno ni el composer de texto. Al reemplazarse
        // por el comentario real en onSuccess, este flag desaparece
        // solo (el objeto que viene del server no lo tiene).
        pending: true,
        user: {
          id: currentUser?.id ?? "",
          username: currentUser?.username ?? "",
          name: currentUser?.name ?? "",
          avatarUrl: currentUser?.avatarUrl ?? null,
          color: currentUser?.color ?? "#6B7280",
          icon: currentUser?.icon ?? "user",
        },
      } as unknown as Comment

      queryClient.setQueryData<Comment[]>(
        queryKey,
        current => [optimisticComment, ...(current ?? [])],
      )

      const location = locationFromTarget(target)
      bumpEntityCommentCounts(queryClient, location, 1)
      return { previousComments, optimisticId, location }

    },

    onError: (_err, _dto, context) => {

      // Falló de verdad (permiso, validación, red caída) — no por
      // lentitud del servidor. Revertimos al estado real anterior.
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments)
      }
      if (context?.location) {
        bumpEntityCommentCounts(queryClient, context.location, -1)
      }

    },

    onSuccess: (created, _dto, context) => {

      // Reemplazamos el temporal por el comentario real (con su id
      // definitivo del servidor), sin duplicar ni parpadear.
      queryClient.setQueryData<Comment[]>(
        queryKey,
        current =>
          (current ?? []).map(c =>
            c.id === context?.optimisticId ? created : c,
          ),
      )

      // Vista "Mensajes" es enriquecida: invalidar, no patch optimista.
      void queryClient.invalidateQueries({ queryKey: myCommentsQueryKey })

    },

  })

  return {
    createComment: mutation.mutateAsync,
    // OJO al usar esto en la UI: no lo uses para deshabilitar el
    // textarea/composer de mensajes. El comentario ya aparece optimista
    // en la lista, así que el usuario debe poder seguir escribiendo y
    // enviar otro mientras este todavía se confirma en el servidor. Este
    // flag es más útil para, por ejemplo, deshabilitar el botón de
    // enviar solo el instante del click (evitar doble-submit del MISMO
    // mensaje), no para trabar el resto del entorno. El estado
    // "publicándose" de ESTE comentario puntual se lee del propio
    // comentario con `comment.pending` (ver optimisticComment más
    // arriba), no de acá.
    creating: mutation.isPending,
  }

}