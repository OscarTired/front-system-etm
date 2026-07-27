import { authService } from "@/features/auth/services/auth.service"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { usePermissionStore } from "@/features/permissions/store/permission-store"

import type { RealtimeEvent } from "../types/realtime-event"

// Mismo problema y misma solución que role-permissions-handler.ts,
// pero a nivel de un usuario puntual en vez de un rol entero: el
// backend calcula los permisos efectivos (roles + overrides
// ALLOW/DENY) y los hornea en el JWT en login/refresh — PermissionsGuard
// lee eso del token, no consulta la base en cada request. Si un
// admin le crea o revoca un override a alguien que ya está
// logueado, esa sesión sigue con los permisos viejos hasta que el
// token expire solo, salvo que la avisemos acá.
//
// El backend ya manda este evento SOLO al usuario afectado
// (publishToUser), así que si esto llega, es sobre MI propia
// sesión — no hace falta comparar userId contra nada.
//
// OJO: igual que con ROLE_PERMISSIONS, pedir /auth/me sola no
// alcanza — hay que pasar por /auth/refresh para que el
// accessToken se reemita con los permisos al día (authService.refresh
// ya deja el token guardado vía authSession.set internamente).
export function userPermissionOverrideHandler(
  _event: RealtimeEvent,
) {

  authService.refresh()
    .then(({ user, permissions }) => {

      useAuthStore.getState().setUser(user)
      usePermissionStore.getState().setPermissions(permissions)

    })
    .catch(() => {
      // No crítico: en el peor caso, la próxima navegación (que ya
      // dispara sus propios chequeos contra el backend) va a
      // encontrar el 403/permiso real si hiciera falta.
    })

}