"use client"

import { Toaster } from "sonner"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react"

import { Spinner } from "@/shared/ui/spinner/spinner"

export function Sonner() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      closeButton
      icons={{
        success: (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ),
        error: (
          <XCircle className="h-4 w-4 text-red-500" />
        ),
        warning: (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        ),
        info: (
          <Info className="h-4 w-4 text-blue-500" />
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
          toast: "!bg-card !text-foreground !border !border-0 !border-border !rounded-xl !p-4 !gap-3 shadow-lg",
          icon: "!m-0 !shrink-0",
          content: "!gap-1",
          title: "!text-sm !font-medium !text-foreground",
          description: "!text-sm !text-muted-foreground",
          closeButton: "!size-5 !rounded-full !border-0 !bg-foreground/5 !text-muted-foreground hover:!bg-foreground/10 hover:!text-foreground",
        },
      }}
    />
  )
}