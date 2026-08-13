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

export function getLuminance(
  hex: string
) {
  const { r, g, b } = hexToRgb(hex)

  const normalize = (value: number) => {
    const channel = value / 255
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  }

  return (
    0.2126 * normalize(r) +
    0.7152 * normalize(g) +
    0.0722 * normalize(b)
  )
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
 * Subtle text must stay readable on the tinted background.
 * - Dark UI: lighten toward white (historic behavior)
 * - Light UI: darken toward black so chips aren't washed out
 */
function getSubtleText(
  hex: string,
  dark: boolean
) {
  if (dark) {
    return rgbString(tintTowardWhite(hex, 0.84))
  }
  // Light mode: keep brand hue but ensure contrast on pale bg
  const darkened = tintTowardBlack(hex, 0.35)
  const lum =
    (0.2126 * darkened.r + 0.7152 * darkened.g + 0.0722 * darkened.b) / 255
  if (lum > 0.45) {
    return rgbString(tintTowardBlack(hex, 0.55))
  }
  return rgbString(darkened)
}

export function getBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle"
) {
  const dark = isDarkMode()

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
      // Subtle backgrounds: slightly stronger on light so chips don't look empty
      const bgAlpha = dark ? 0.14 : 0.16
      const bgHover = dark ? 0.2 : 0.22
      const bgActive = dark ? 0.28 : 0.3

      return {
        background: rgba(hex, bgAlpha),
        backgroundHover: rgba(hex, bgHover),
        backgroundActive: rgba(hex, bgActive),
        glow: rgba(hex, dark ? 0.1 : 0.12),
        text: getSubtleText(hex, dark),
        shadow: {
          default: "none",
          hover: `
            0 0 0 1px ${rgba(hex, dark ? 0.12 : 0.2)},
            0 4px 12px rgba(0,0,0,${dark ? 0.1 : 0.06})
          `,
          active: `
            0 0 0 1px ${rgba(hex, dark ? 0.18 : 0.28)},
            0 8px 20px rgba(0,0,0,${dark ? 0.18 : 0.1})
          `,
        },
      }
    }
  }
}

export function getProcessCardTextColor(
  hex: string
) {
  return getBadgeColors(hex, "subtle").text
}