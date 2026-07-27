import type { User } from "@/features/users/types/user.types"

// Deriva de User con Pick en vez de redeclarar los campos a mano —
// así, si User cambia (como pasó con role→roles), TypeScript avisa
// acá también en vez de quedar un tipo hermano desincronizado.
export type Profile = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "username"
  | "avatarUrl"
  | "phone"
  | "position"
  | "color"
  | "icon"
  | "roles"
>

export type UpdateProfileDto = {

  name?: string

  phone?: string

  position?: string

}