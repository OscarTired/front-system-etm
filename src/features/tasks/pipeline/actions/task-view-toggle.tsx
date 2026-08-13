"use client"

import { cn } from "@/shared/utils/utils"

export type TaskView = "card" | "kanban"

type Props = {
  value: TaskView
  onChange: (view: TaskView) => void
}

export function TaskViewToggle({
  value,
  onChange,
}: Props) {

  return (

    <div className="inline-flex items-center rounded-lg bg-foreground/5 p-1">

      {(
        [
          { key: "card", label: "Card" },
          { key: "kanban", label: "Kanban" },
        ] as const
      ).map(
        option => (

          <button
            key={option.key}
            type="button"
            onClick={() =>
              onChange(option.key)
            }
            className={cn(
              "rounded-md px-3 py-0.5 text-sm font-semibold transition",
              value === option.key
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-muted-foreground",
            )}
          >

            {option.label}

          </button>

        ),
      )}

    </div>

  )

}