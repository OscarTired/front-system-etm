"use client"

import {
  PrimaryAction,
} from "@/shared/ui/actions/primary-action"

type Props = {
  taskId: string
}

export function CommentComposer({
  taskId,
}: Props) {

  return (

    <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-white/2 p-2.5">

      <textarea
        id={`comment-${taskId}`}
        name={`comment-${taskId}`}
        placeholder="Escribe una observación..."
        className="text-sm font-medium min-h-9 flex-1 resize-none bg-transparent text-white outline-none placeholder:text-neutral-600"
      />

      <div className="mt-1 flex justify-end">

        <PrimaryAction
          label="Enviar"
          onClick={() => {}}
        />

      </div>

    </div>

  )

}