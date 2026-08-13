"use client"

import { MessageSquare } from "lucide-react"

export function EmptyComments() {

  return (

    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">

      <MessageSquare className="h-6 w-6 text-muted-foreground/80" />

      <p className="text-sm font-medium text-muted-foreground">
        No existen mensajes
      </p>

      <p className="text-xs text-muted-foreground">
        Sé el primero en comentar.
      </p>

    </div>

  )

}