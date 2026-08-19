"use client"

import type { LucideIcon } from "lucide-react"

import { Spinner } from "@/shared/ui/spinner/spinner"
import { cn } from "@/shared/utils/utils"

type Props = {
  label: string
  icon?: LucideIcon
  disabled?: boolean
  isLoading?: boolean
  onClick: () => void
  /** Solo icono (+). label queda como aria/title. */
  iconOnly?: boolean
}

export function PrimaryAction({
  label,
  icon: Icon,
  disabled = false,
  isLoading = false,
  onClick,
  iconOnly = false,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition",
        iconOnly
          ? "size-10 rounded-xl"
          : "h-10 gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold",
        disabled
          ? "cursor-not-allowed bg-foreground/10 text-foreground/35"
          : "bg-foreground text-background hover:bg-foreground/90",
        isLoading && "cursor-wait opacity-80",
      )}
    >
      {isLoading ? (
        <Spinner size={16} />
      ) : (
        <>
          {Icon ? <Icon size={iconOnly ? 18 : 16} strokeWidth={2.5} /> : null}
          {!iconOnly && label}
        </>
      )}
    </button>
  )
}
