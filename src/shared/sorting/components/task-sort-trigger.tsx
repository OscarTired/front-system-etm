"use client"

import { forwardRef } from "react"
import { ArrowUpDown } from "lucide-react"

import { FabTrigger } from "@/shared/ui/speed-dial-fab/fab-trigger"

type Props = {
  label: string
  active?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export const TaskSortTrigger = forwardRef<HTMLButtonElement, Props>(
  ({ label, active = false, ...props }, ref) => (
    <FabTrigger ref={ref} icon={ArrowUpDown} label={label} active={active} {...props} />
  ),
)

TaskSortTrigger.displayName = "TaskSortTrigger"