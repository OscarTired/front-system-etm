"use client"

import { forwardRef } from "react"
import { Download } from "lucide-react"

import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export const ExportTrigger = forwardRef<HTMLButtonElement, Props>(
  ({ active = false, ...props }, ref) => (
    <FabTrigger ref={ref} icon={Download} label="EXPORTAR" active={active} {...props} />
  ),
)

ExportTrigger.displayName = "ExportTrigger"