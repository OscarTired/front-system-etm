export type PermissionEffect = "ALLOW" | "DENY"

export interface UserPermissionOverride {

  id:string

  effect:PermissionEffect

  reason:string | null

  expiresAt:string | null

  createdAt:string

  permission:{
    id:string
    code:string
  }

  grantedBy:{
    id:string
    name:string
  }

}

export interface CreateUserPermissionOverrideInput {

  permissionId:string

  effect:PermissionEffect

  reason?:string

  expiresAt?:string

}