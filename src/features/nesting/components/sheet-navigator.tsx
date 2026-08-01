"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

export interface SheetNavigatorProps {
  currentIndex: number
  totalSheets: number
  label: string
  onChange: (index: number) => void
}

export function SheetNavigator({ currentIndex, totalSheets, label, onChange }: SheetNavigatorProps) {
  if (totalSheets === 0) return null

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/3 p-2">
      <button
        type="button"
        disabled={currentIndex <= 0}
        onClick={() => onChange(currentIndex - 1)}
        className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <select
        value={currentIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 truncate rounded-lg border-none bg-transparent px-1 py-1 text-center text-sm font-medium text-neutral-200 outline-none"
      >
        {Array.from({ length: totalSheets }, (_, i) => (
          <option key={i} value={i} className="bg-[#101012] text-neutral-200">
            Plancha {i + 1}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={currentIndex >= totalSheets - 1}
        onClick={() => onChange(currentIndex + 1)}
        className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="shrink-0 text-xs text-neutral-500">{label}</span>
    </div>
  )
}
