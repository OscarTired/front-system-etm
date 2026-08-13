import {
  hexToRgb,
} from "@/shared/utils/color-utils"

export type BadgeVariant =
  | "subtle"
  | "solid"

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
 * Lee tokens de tema (globals.css). Sin hex hardcodeados en la lógica.
 * Mismos tokens en :root y .dark → look unificado.
 */
function readCssNumber(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function readChipSurfaceRgb(): { r: number; g: number; b: number } {
  if (typeof document === "undefined") return { r: 16, g: 16, b: 18 }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--chip-surface-rgb")
    .trim()
  const parts = raw.split(/\s+/).map(Number)
  if (parts.length >= 3 && parts.every(Number.isFinite)) {
    return { r: parts[0], g: parts[1], b: parts[2] }
  }
  return { r: 16, g: 16, b: 18 }
}

function blendOnChipSurface(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  const s = readChipSurfaceRgb()
  return {
    r: Math.round(r * alpha + s.r * (1 - alpha)),
    g: Math.round(g * alpha + s.g * (1 - alpha)),
    b: Math.round(b * alpha + s.b * (1 - alpha)),
  }
}

function getSubtleText(hex: string) {
  const tint = readCssNumber("--chip-text-tint", 0.84)
  return rgbString(tintTowardWhite(hex, tint))
}

/** Texto del chip por luminancia del fondo (no por tema). */
function getChipText(
  hex: string,
  backgroundRgb: { r: number; g: number; b: number },
) {
  const bgLum = getLuminanceFromRgb(backgroundRgb)
  if (bgLum < 0.45) {
    return getSubtleText(hex)
  }
  return getReadableTextFor(hex, backgroundRgb)
}

export function getBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle",
  _theme?: "light" | "dark",
) {
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
          hover: `0 4px 12px rgba(0,0,0,0.16)`,
          active: `0 8px 20px rgba(0,0,0,0.24)`,
        },
      }

    default: {
      const a = readCssNumber("--chip-bg-alpha", 0.50)
      const aHover = readCssNumber("--chip-bg-alpha-hover", 0.58)
      const aActive = readCssNumber("--chip-bg-alpha-active", 0.66)

      const bg = blendOnChipSurface(hex, a)
      return {
        background: rgbString(bg),
        backgroundHover: rgbString(blendOnChipSurface(hex, aHover)),
        backgroundActive: rgbString(blendOnChipSurface(hex, aActive)),
        glow: rgba(hex, 0.12),
        text: getChipText(hex, bg),
        shadow: {
          default: "none",
          hover: `
            0 0 0 1px ${rgba(hex, 0.14)},
            0 4px 12px rgba(0,0,0,0.12)
          `,
          active: `
            0 0 0 1px ${rgba(hex, 0.2)},
            0 8px 20px rgba(0,0,0,0.18)
          `,
        },
      }
    }
  }
}

export function getProcessCardTextColor(
  hex: string,
  _theme?: "light" | "dark",
) {
  return getBadgeColors(hex, "subtle").text
}
