"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/utils/utils"
import { SidebarRow } from "../sidebar/sidebar-row"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"

type Props = {
  href: string
  label: string
  active: boolean
  icon: LucideIcon // <-- Se actualiza aquí para coincidir con SidebarRow
  count?: number
  collapsed?: boolean
  isDrawer?: boolean
  onMouseEnter?: () => void
  onTouchStart?: () => void
}

export function SidebarItem({
  href,
  label,
  active,
  icon: Icon,
  count,
  collapsed,
  isDrawer = false,
  onMouseEnter,
  onTouchStart,
}: Props) {
  const closeDrawer = useMobileNavStore((s) => s.closeDrawer)

  if (isDrawer) {
    return (
      <Link
        href={href}
        onMouseEnter={onMouseEnter}
        onTouchStart={onTouchStart}
        // Antes el drawer solo se cerraba reactivamente cuando el
        // pathname terminaba de cambiar (ver sidebar-drawer.tsx), lo
        // cual pasa justo en el mismo instante en que el contenido de
        // abajo se remonta completo (key={pathname} en VerticalScroll,
        // dentro de app-shell.tsx). Esas dos cosas — remount de
        // contenido + animación de cierre del drawer — arrancando a la
        // vez es lo que se percibía como "parpadeo" (como si cerrara y
        // volviera a abrirse). Cerrar aquí, en el click, hace que la
        // animación de cierre ya esté en curso (o resuelta) para cuando
        // el contenido nuevo se monta, en vez de competir con él. El
        // efecto por pathname en sidebar-drawer.tsx queda como red de
        // seguridad (ej. navegación por atrás/adelante del navegador,
        // que no pasa por este click).
        onClick={() => closeDrawer()}
        className={cn("w-full block", active && "pointer-events-none")}
      >
        <SidebarRow
          icon={Icon}
          label={label}
          active={active}
          count={count}
          isDrawer
        />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      className={cn("w-full block", active && "pointer-events-none")}
    >
      <SidebarRow
        icon={Icon}
        label={label}
        collapsed={collapsed}
        active={active}
        count={count}
      />
    </Link>
  )
}