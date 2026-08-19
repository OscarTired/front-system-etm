"use client"

import { Toaster } from "sonner"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { useThemeStore } from "@/shared/theme"

/** Ancho único: mensajes, errores, nesting, success. */
const TOAST_W =
  "!w-[min(100vw-2rem,22rem)] !max-w-[min(100vw-2rem,22rem)]"

export function Sonner() {
  const theme = useThemeStore(s => s.resolved)

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      closeButton
      gap={12}
      offset={16}
      visibleToasts={4}
      icons={{
        success: (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ),
        error: <XCircle className="h-4 w-4 text-red-500" />,
        warning: (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ),
        info: <Info className="h-4 w-4 text-sky-500" />,
        loading: (
          <Spinner size={16} className="text-foreground" />
        ),
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: [
            TOAST_W,
            "!bg-card !text-foreground !border !border-border !rounded-xl !p-3.5 !gap-3",
            "!shadow-sm !shadow-black/15 dark:!shadow-black/40",
          ].join(" "),
          icon: "!m-0 !shrink-0",
          content: "!min-w-0 !flex-1 !gap-0.5",
          title:
            "!truncate !text-sm !font-medium !leading-5 !text-foreground",
          description:
            "!truncate !text-sm !leading-5 !text-muted-foreground",
          closeButton:
            "!size-6 !rounded-full !border !border-border !bg-muted !text-foreground hover:!bg-muted/80 hover:!text-foreground !opacity-100",
        },
      }}
    />
  )
}
