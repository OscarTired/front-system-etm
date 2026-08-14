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

export function Sonner() {
  const theme = useThemeStore((s) => s.resolved)

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      closeButton
      expand
      gap={12}
      offset={16}
      visibleToasts={4}
      icons={{
        success: (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ),
        error: (
          <XCircle className="h-4 w-4 text-red-500" />
        ),
        warning: (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        ),
        info: (
          <Info className="h-4 w-4 text-sky-500" />
        ),
        loading: (
          <Spinner
            size={16}
            className="text-foreground"
          />
        ),
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "!bg-card !text-foreground !border !border-border !rounded-xl !p-4 !gap-3 !shadow-lg",
          icon: "!m-0 !shrink-0",
          content: "!gap-1",
          title: "!text-sm !font-medium !text-foreground",
          description: "!text-sm !text-muted-foreground",
          closeButton:
            "!size-5 !rounded-full !border-0 !bg-foreground/10 !text-muted-foreground hover:!bg-foreground/15 hover:!text-foreground",
        },
      }}
    />
  )
}
