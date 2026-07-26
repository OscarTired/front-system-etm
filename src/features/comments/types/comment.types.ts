import { EntityIcon } from "@/shared/constants/entity-icons"

export interface CommentUser{
  id:string
  username:string|null
  name:string
  avatarUrl:string|null
  color:string
  icon:EntityIcon
}

export interface CommentParentPreview{
  id:string
  message:string
  deletedAt:string|null
  user:{ id:string; name:string }
}

export interface Comment{
  id:string
  taskId:string|null
  projectId:string|null
  workflowStepId:string|null
  userId:string
  message:string
  imageUrl:string|null
  createdAt:string
  updatedAt:string
  user:CommentUser
  parentId:string|null
  parent:CommentParentPreview|null
  pending?: boolean
  deleting?: boolean
}

export interface CreateCommentDto{
  // Opcional: un comentario puede ser solo una foto, sin texto.
  message?:string
  imageBase64?:string
  // Presente = esto es una respuesta a otro comentario.
  parentId?:string
}

export interface UpdateCommentDto{
  message:string
}

export type CommentTarget=
  | { scope:"task"; taskId:string }
  | { scope:"workflowStep"; workflowStepId:string }
  | { scope:"project"; projectId:string }

export type CommentReadState =
  | "SENT"
  | "READ_PARTIAL"
  | "READ_ALL"

export interface CommentReadStatus{
  total:number
  readCount:number
  status:CommentReadState
}