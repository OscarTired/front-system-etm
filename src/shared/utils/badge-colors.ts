import {
  hexToRgb,
} from "@/shared/utils/color-utils"

export type BadgeVariant =
  | "subtle"
  | "solid"

/** Resolved theme at call time (client). Default dark for SSR safety. */
function isDarkMode(): boolean {
  if (typeof document === "undefined") return true
  return document.documentElement.classList.contains("dark")
}

function getLuminanceFromRgb(
  rgb: { r: number; g: number; b: number }
) {
  const normalize = (value: number) => {
    const channel = value / 255
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  }

  return (
    0.2126 * normalize(rgb.r) +
    0.7152 * normalize(rgb.g) +
    0.0722 * normalize(rgb.b)
  )
}

export function getLuminance(
  hex: string
) {
  return getLuminanceFromRgb(hexToRgb(hex))
}

function getContrastRatio(
  colorA: string,
  colorB: string
) {
  const luminanceA = getLuminance(colorA)
  const luminanceB = getLuminance(colorB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

function contrastFromLuminances(
  lumA: number,
  lumB: number
) {
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

function getContrastText(
  hex: string
) {
  const whiteContrast = getContrastRatio(hex, "#FFFFFF")
  const darkContrast = getContrastRatio(hex, "#111827")
  return whiteContrast > darkContrast ? "#FFFFFF" : "#111827"
}

function rgba(
  hex: string,
  alpha: number
) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Mix toward white (amount 0 = original, 1 = pure white) */
function tintTowardWhite(
  hex: string,
  amount = 0.5
) {
  const { r, g, b } = hexToRgb(hex)
  const mix = (value: number) =>
    Math.round(value + (255 - value) * amount)
  return { r: mix(r), g: mix(g), b: mix(b) }
}

/** Mix toward black (amount 0 = original, 1 = pure black) */
function tintTowardBlack(
  hex: string,
  amount = 0.5
) {
  const { r, g, b } = hexToRgb(hex)
  const mix = (value: number) =>
    Math.round(value * (1 - amount))
  return { r: mix(r), g: mix(g), b: mix(b) }
}

function rgbString(
  rgb: { r: number; g: number; b: number },
  alpha = 1
) {
  return alpha >= 1
    ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * Texto legible GARANTIZADO contra el fondo que se está usando de
 * verdad — en vez de oscurecer el hex un % fijo (lo que había antes,
 * y lo que rompía colores que ya arrancan claros: "Producción" usa
 * #f99d9d, un rosa salmón — oscurecerlo un 55-72% seguía dando un
 * tono parecido en luminosidad al fondo, también derivado del mismo
 * hex, así que el contraste colapsaba para ESE color puntual aunque
 * funcionara bien para otros más saturados).
 *
 * Acá se prueban niveles de oscurecimiento crecientes hasta lograr
 * contraste real (WCAG AA, 4.5:1) contra el fondo específico. Si
 * ningún nivel de oscurecer el propio matiz alcanza — el fondo es
 * demasiado claro para ese color en particular —, cae a un gris casi
 * negro fijo, que da contraste de sobra contra cualquier pastel.
 */
function getReadableTextFor(
  hex: string,
  backgroundRgb: { r: number; g: number; b: number }
) {
  const bgLum = getLuminanceFromRgb(backgroundRgb)
  const MIN_CONTRAST = 4.5

  for (const amount of [0.55, 0.65, 0.72, 0.8, 0.88, 0.94]) {
    const candidate = tintTowardBlack(hex, amount)
    const candidateLum = getLuminanceFromRgb(candidate)
    if (contrastFromLuminances(candidateLum, bgLum) >= MIN_CONTRAST) {
      return rgbString(candidate)
    }
  }

  return "#111827"
}

/**
 * Subtle text must stay readable on the tinted background.
 * - Dark UI: lighten toward white (historic behavior)
 * - Light UI: ver getReadableTextFor — ya no es un % fijo
 */
function getSubtleText(
  hex: string,
  dark: boolean
) {
  if (dark) {
    return rgbString(tintTowardWhite(hex, 0.84))
  }
  return getReadableTextFor(hex, tintTowardWhite(hex, 0.72))
}

export function getBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle",
  /** Si se pasa, NO lee el DOM — fuente de verdad para reactividad */
  theme?: "light" | "dark",
) {
  const dark = theme ? theme === "dark" : isDarkMode()

  switch (variant) {
    case "solid":
      return {
        background: hex,
        backgroundHover: hex,
        backgroundActive: hex,
        glow: rgba(hex, 0.25),
        text: getContrastText(hex),
        shadow: {
          default: "none",
          hover: `0 4px 12px rgba(0,0,0,${dark ? 0.16 : 0.1})`,
          active: `0 8px 20px rgba(0,0,0,${dark ? 0.24 : 0.14})`,
        },
      }

    default: {

      if (!dark) {
        // Light: NADA de alpha-transparencia. Mezclar un color
        // semi-transparente con un fondo claro lo desatura sin
        // importar qué % de alpha uses — es matemática, no un
        // número que se pueda ajustar. En vez de eso, un color
        // OPACO mezclado hacia blanco: se ve saturado por sí
        // mismo, sin depender de qué haya detrás (por eso "PAUSADO"
        // se veía vívido en dark y lavado en light con el mismo hex).
        const bg = rgbString(tintTowardWhite(hex, 0.72))
        const bgHover = rgbString(tintTowardWhite(hex, 0.60))
        const bgActive = rgbString(tintTowardWhite(hex, 0.48))

        return {
          background: bg,
          backgroundHover: bgHover,
          backgroundActive: bgActive,
          glow: rgba(hex, 0.18),
          text: getReadableTextFor(hex, tintTowardWhite(hex, 0.72)),
          shadow: {
            default: "none",
            hover: `
              0 0 0 1px ${rgba(hex, 0.25)},
              0 4px 12px rgba(0,0,0,0.06)
            `,
            active: `
              0 0 0 1px ${rgba(hex, 0.35)},
              0 8px 20px rgba(0,0,0,0.1)
            `,
          },
        }
      }

      // Dark: sigue exactamente igual — acá la transparencia sí
      // funciona (mezclar con un fondo casi negro da un glow sutil
      // correcto), no se tocó nada de este branch.
      const bgAlpha = 0.14
      const bgHover = 0.2
      const bgActive = 0.28

      return {
        background: rgba(hex, bgAlpha),
        backgroundHover: rgba(hex, bgHover),
        backgroundActive: rgba(hex, bgActive),
        glow: rgba(hex, 0.1),
        text: getSubtleText(hex, dark),
        shadow: {
          default: "none",
          hover: `
            0 0 0 1px ${rgba(hex, 0.12)},
            0 4px 12px rgba(0,0,0,0.1)
          `,
          active: `
            0 0 0 1px ${rgba(hex, 0.18)},
            0 8px 20px rgba(0,0,0,0.18)
          `,
        },
      }
    }
  }
}

export function getProcessCardTextColor(
  hex: string,
  theme?: "light" | "dark",
) {
  return getBadgeColors(hex, "subtle", theme).text
}