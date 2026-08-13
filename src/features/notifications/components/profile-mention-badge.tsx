"use client"

import { useNotifications } from "../hooks/use-notifications"
import { cn } from "@/shared/utils/utils"

type Props = { className?: string }

export function ProfileMentionBadge({ className }: Props) {

  const { notifications } = useNotifications()

  const hasUnreadMention = notifications.some(
    n => n.type === "MENTION" && !n.read,
  )

  if (!hasUnreadMention) return null

  return (
    <span className={cn("h-2.5 w-2.5 rounded-full border-2 border-background bg-cyan-400", className)} />
  )

}