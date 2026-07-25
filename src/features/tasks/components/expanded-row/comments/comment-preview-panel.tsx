"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

export function CommentPreviewPanel() {

  return (

    <div className="flex h-full min-h-0 flex-col rounded-xl bg-white/2">

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">

        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-300">

          Últimos comentarios

        </span>

        <button
          type="button"
          className="text-sm font-medium text-neutral-300 transition-colors hover:text-cyan-300"
        >

          Ver historial →

        </button>

      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3">

        <div className="flex h-full items-center justify-center">

          <div className="text-center">

            <p className="text-sm font-medium text-neutral-400">

              No existen registros

            </p>

          </div>

        </div>

      </ScrollArea>

    </div>

  )

}