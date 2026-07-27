type UserFormValues = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  roleIds: string[]
  isEditing: boolean
  isChangingPassword: boolean
}

export type UserErrors = Partial<
  Record<
    | "name"
    | "username"
    | "email"
    | "roleIds"
    | "password"
    | "confirmPassword",
    string
  >
>

const EMAIL_DOMAIN = "@etmperu.com"

export function validateUser(
  form: UserFormValues,
): UserErrors {

  const errors: UserErrors = {}

  if (!form.name.trim()) {
    errors.name = "Falta completar"
  }

  if (!form.username.trim()) {
    errors.username = "Falta completar"
  }

  if (!form.email.trim()) {
    errors.email = "Falta completar"
  } else if (
    !form.email
      .trim()
      .toLowerCase()
      .endsWith(EMAIL_DOMAIN)
  ) {
    errors.email =
      `El correo debe terminar en ${EMAIL_DOMAIN}`
  }

  if (form.roleIds.length === 0) {
    errors.roleIds = "Selecciona al menos un rol"
  }

  const changingPassword =
    !form.isEditing ||
    form.isChangingPassword

  if (changingPassword) {

    if (!form.password) {
      errors.password = "Falta completar"
    } else if (form.password.length < 8) {
      errors.password = "Mínimo 8 caracteres"
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Falta completar"
    } else if (
      form.password !==
      form.confirmPassword
    ) {
      errors.confirmPassword =
        "Las contraseñas no coinciden"
    }

  }

  return errors

}