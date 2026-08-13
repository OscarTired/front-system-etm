import type {
  LucideIcon,
} from "lucide-react"

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  title: string
  description?: string
  icon: LucideIcon
}

export function FormDialogHeader({
  title,
  description,
  icon: Icon,
}: Props) {

  return (

    <DialogHeader className="px-5 py-4">

      <div className="flex items-start gap-4">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">

          <Icon
            size={18}
            strokeWidth={2.4}
          />

        </div>

        <div className="min-w-0">

          <DialogTitle className="text-lg font-bold text-foreground">

            {title}

          </DialogTitle>

          <DialogDescription
            className={
              description
                ? "mt-1 text-sm text-muted-foreground"
                : "sr-only"
            }
          >

            {description ?? `${title} dialog`}

          </DialogDescription>

        </div>

      </div>

    </DialogHeader>

  )

}