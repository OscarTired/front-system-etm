import type { DayShift } from "./activity-log.types"

export type SlotState = "upcoming" | "current" | "past"

export type ShiftSlotStatus = {
  shift: DayShift
  state: SlotState
  open: boolean
  startMinutes: number
  endMinutes: number | null
  required: boolean
}

export type ShiftSchedule = {
  date: string
  isToday: boolean
  currentShift: DayShift | null
  serverNow: string
  nextBoundaryAt: string | null
  slots: ShiftSlotStatus[]
}
