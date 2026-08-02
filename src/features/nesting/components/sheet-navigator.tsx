"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  Button,
} from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SheetNavigatorProps {
  currentIndex: number
  totalSheets: number
  label: string
  onChange: (index: number) => void
}

export function SheetNavigator({ currentIndex, totalSheets, label, onChange }: SheetNavigatorProps) {
  if (totalSheets === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentIndex <= 0}
        onClick={() => onChange(currentIndex - 1)}
        className="text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
        aria-label="Plancha anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="min-w-0 flex-1 justify-center truncate text-neutral-200 hover:bg-white/5 hover:text-white"
          >
            <span className="truncate">Plancha {currentIndex + 1}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuRadioGroup
            value={String(currentIndex)}
            onValueChange={(value) => onChange(Number(value))}
          >
            {Array.from({ length: totalSheets }, (_, i) => (
              <DropdownMenuRadioItem key={i} value={String(i)}>
                Plancha {i + 1}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentIndex >= totalSheets - 1}
        onClick={() => onChange(currentIndex + 1)}
        className="text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
        aria-label="Plancha siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
    </div>
  )
}
