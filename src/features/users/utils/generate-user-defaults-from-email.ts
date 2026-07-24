// Deriva name/username/password a partir del prefijo del email
// (antes de la @) al crear un usuario nuevo — ej. escribir
// "ivan.arrelucea@etmperu.com" completa solo Nombre="Ivan
// Arrelucea", Usuario="IvanArrelucea", Contraseña="Ivan123*".
//
// Vivía duplicada solo dentro de UserDialog (el modal, usado en
// mobile) — UsersPageContent (la vista split-view de desktop) nunca
// la tuvo, por eso "dejaba de funcionar" ahí aunque en el modal
// seguía andando.
export function generateUserDefaultsFromEmail(emailInput: string) {

  const emailPrefix = emailInput.split("@")[0].trim()

  if (!emailPrefix) {
    return { name: "", username: "", password: "", confirmPassword: "" }
  }

  const parts = emailPrefix
    .toLowerCase()
    .split(/[\._\-]+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return { name: "", username: "", password: "", confirmPassword: "" }
  }

  const capitalizedParts = parts.map(
    p => p.charAt(0).toUpperCase() + p.slice(1)
  )

  const firstName = capitalizedParts[0]
  const name = capitalizedParts.join(" ")
  const username = capitalizedParts.join("")
  const password = `${firstName}123*`

  return {
    name,
    username,
    password,
    confirmPassword: password,
  }

}