"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { commentsService } from "../services/comments.service"
import { commentsQueryKey } from "../utils/comment-target"
import { myCommentsQueryKey } from "./use-my-comments"
import type { Comment, CommentTarget, UpdateCommentDto } from "../types/comment.types"

export function useUpdateComment(target:CommentTarget){

  const queryClient=useQueryClient()
  const queryKey=commentsQueryKey(target)

  const mutation=useMutation({

    mutationFn:({ id,dto }:{ id:string; dto:UpdateCommentDto })=>
      commentsService.updateComment(id,dto),

    onSuccess:updated=>{
      queryClient.setQueryData<Comment[]>(
        queryKey,
        current=>(current??[]).map(c=>c.id===updated.id?updated:c),
      )
      void queryClient.invalidateQueries({ queryKey: myCommentsQueryKey })

    },

  })

  return{
    updateComment:mutation.mutateAsync,
    updating:mutation.isPending,
  }

}