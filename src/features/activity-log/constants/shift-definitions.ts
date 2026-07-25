import { Moon, Sun, Sunrise, UtensilsCrossed, type LucideIcon } from "lucide-react"
import type { DayShift } from "../types/activity-log.types"

export type ShiftSlotDefinition = {
  shift: DayShift
  label: string
  hours: string
  // Minutos desde medianoche — igual criterio que
  // getLimaMinutesOfDay() en el backend, para que "¿ya pasó esta
  // franja?" se calcule igual de los dos lados.
  startMinutes: number
  endMinutes: number | null // null = sin hora de cierre (Noche)
  // Si es false, la franja puede quedar sin registrar sin que la UI
  // la marque como pendiente/incompleta (Almuerzo y Noche).
  required: boolean
}

export type ShiftGroupDefinition = {
  key: string
  label: string
  icon: LucideIcon
  slots: ShiftSlotDefinition[]
}

// Reemplaza las 3 franjas viejas (Mañana/Tarde/Noche con actividades
// ilimitadas) por 5 sub-franjas de 1 registro cada una, agrupadas
// visualmente en 3 bloques. Mañana y Tarde muestran sus 2
// sub-franjas juntas en una sola tarjeta; Almuerzo queda como su
// propio bloque angosto entre medio; Noche es una franja suelta sin
// hora de cierre.
export const SHIFT_GROUPS: ShiftGroupDefinition[] = [

  {
    key: "morning",
    label: "Mañana",
    icon: Sunrise,
    slots: [
      {
        shift: "MORNING_1",
        label: "8:30 – 11:00 am",
        hours: "08:30 – 11:00",
        startMinutes: 8 * 60 + 30,
        endMinutes: 11 * 60,
        required: true,
      },
      {
        shift: "MORNING_2",
        label: "11:00 am – 1:00 pm",
        hours: "11:00 – 13:00",
        startMinutes: 11 * 60,
        endMinutes: 13 * 60,
        required: true,
      },
    ],
  },

  {
    key: "lunch",
    label: "Almuerzo",
    icon: UtensilsCrossed,
    slots: [
      {
        shift: "LUNCH",
        label: "Almuerzo",
        hours: "13:00 – 14:00",
        startMinutes: 13 * 60,
        endMinutes: 14 * 60,
        required: false,
      },
    ],
  },

  {
    key: "afternoon",
    label: "Tarde",
    icon: Sun,
    slots: [
      {
        shift: "AFTERNOON_1",
        label: "2:00 – 4:00 pm",
        hours: "14:00 – 16:00",
        startMinutes: 14 * 60,
        endMinutes: 16 * 60,
        required: true,
      },
      {
        shift: "AFTERNOON_2",
        label: "4:00 – 6:00 pm",
        hours: "16:00 – 18:00",
        startMinutes: 16 * 60,
        endMinutes: 18 * 60,
        required: true,
      },
    ],
  },

  {
    key: "night",
    label: "Noche",
    icon: Moon,
    slots: [
      {
        shift: "NIGHT",
        label: "Desde las 6:00 pm",
        hours: "18:00 en adelante",
        startMinutes: 18 * 60,
        endMinutes: null,
        required: false,
      },
    ],
  },

]

export function getMinutesOfDayNow(now: Date): number {
  return now.getHours() * 60 + now.getMinutes()
}

// Deriva un lookup shift -> "hours" (ej. "08:30 – 11:00") a partir
// de SHIFT_GROUPS en vez de repetir los textos de las franjas en
// otro lado — cualquier vista que solo necesite mostrar "en qué
// franja fue esto" (ej. las cards de Bitácora del Equipo) usa esto,
// sin tener que recorrer SHIFT_GROUPS a mano ni mantener un segundo
// mapa de labels en paralelo.
export const SHIFT_HOURS_LABEL: Record<DayShift, string> =
  Object.fromEntries(
    SHIFT_GROUPS.flatMap(
      group => group.slots.map(slot => [slot.shift, slot.hours]),
    ),
  ) as Record<DayShift, string>

// Misma franja que calcula el backend (getShiftForDate) — se
// duplica acá para el preview optimista y para poder avisarle a la
// persona, en el picker, si el slot que tocó ya no es la franja
// "real" actual (ver comentario en activity-picker-dialog.tsx).
export function getCurrentShift(now: Date): DayShift {

  const minutes = getMinutesOfDayNow(now)

  if (minutes < 11 * 60) return "MORNING_1"
  if (minutes < 13 * 60) return "MORNING_2"
  if (minutes < 14 * 60) return "LUNCH"
  if (minutes < 16 * 60) return "AFTERNOON_1"
  if (minutes < 18 * 60) return "AFTERNOON_2"

  return "NIGHT"

}

export function getSlotState(
  slot: ShiftSlotDefinition,
  now: Date,
): "upcoming" | "current" | "past" {

  const minutes = getMinutesOfDayNow(now)

  if (minutes < slot.startMinutes) {
    return "upcoming"
  }

  if (slot.endMinutes === null || minutes < slot.endMinutes) {
    return "current"
  }

  return "past"

}