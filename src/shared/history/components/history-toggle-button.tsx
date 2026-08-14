"use client"

import { History } from "lucide-react"

import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Props = {
  count: number
  active: boolean
  onClick: () => void
}

export function HistoryToggleButton({ count, active, onClick }: Props) {
  const { isMobile } = useResponsive()

  const badge =
    count > 0 ? (
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold select-none transition-colors duration-200",
          // Desktop toolbar: mismo azul que NotificationBell / TAREAS
          !isMobile && "bg-primary text-primary-foreground shadow-sm",
          // Mobile FAB (bg-foreground): contraste invertido
          isMobile && "bg-background text-foreground shadow-sm ring-1 ring-border",
          active && "animate-history-bounce ring-2 ring-primary/40",
        )}
      >
        {count > 9 ? "9+" : count}
      </span>
    ) : undefined

  return (
    <FabTrigger
      icon={History}
      label="HISTORIAL"
      active={active}
      onClick={onClick}
      badge={badge}
    />
  )
}
