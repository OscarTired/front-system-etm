"use client"

import { MessageSquare } from "lucide-react"

export function EmptyComments() {

  return (

    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">

      <MessageSquare className="h-6 w-6 text-neutral-600" />

      <p className="text-sm font-medium text-neutral-400">
        No existen mensajes
      </p>

      <p className="text-xs text-neutral-500">
        Sé el primero en comentar.
      </p>

    </div>

  )

}