import { hexToRgb } from "@/shared/utils/color-utils"

export type BadgeVariant = "subtle" | "solid"

type Rgb = { r: number; g: number; b: number }

// ---------------------------------------------------------------------------
// Color math (WCAG + mezcla)
// ---------------------------------------------------------------------------

function getLuminanceFromRgb(rgb: Rgb) {
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

export function getLuminance(hex: string) {
  return getLuminanceFromRgb(hexToRgb(hex))
}

function getContrastRatio(colorA: string, colorB: string) {
  const luminanceA = getLuminance(colorA)
  const luminanceB = getLuminance(colorB)
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

function contrastFromLuminances(lumA: number, lumB: number) {
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

function getContrastText(hex: string) {
  const whiteContrast = getContrastRatio(hex, "#FFFFFF")
  const darkContrast = getContrastRatio(hex, "#111827")
  return whiteContrast > darkContrast ? "#FFFFFF" : "#111827"
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function tintTowardWhite(hex: string, amount = 0.5): Rgb {
  const { r, g, b } = hexToRgb(hex)
  const mix = (value: number) => Math.round(value + (255 - value) * amount)
  return { r: mix(r), g: mix(g), b: mix(b) }
}

function tintTowardBlack(hex: string, amount = 0.5): Rgb {
  const { r, g, b } = hexToRgb(hex)
  const mix = (value: number) => Math.round(value * (1 - amount))
  return { r: mix(r), g: mix(g), b: mix(b) }
}

function rgbString(rgb: Rgb, alpha = 1) {
  return alpha >= 1
    ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

function withAlpha(cssColor: string, alpha: number): string {
  const m = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`
  return cssColor
}

/** Distancia euclídea RGB — proxy barato de “se distingue del surface”. */
function rgbDistance(a: Rgb, b: Rgb) {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// ---------------------------------------------------------------------------
// Tokens de tema (globals.css) — sin hex hardcodeados de marca
// ---------------------------------------------------------------------------

function readCssNumber(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function readChipSurfaceRgb(): Rgb {
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

function blendOnChipSurface(hex: string, alpha: number): Rgb {
  const { r, g, b } = hexToRgb(hex)
  const s = readChipSurfaceRgb()
  return {
    r: Math.round(r * alpha + s.r * (1 - alpha)),
    g: Math.round(g * alpha + s.g * (1 - alpha)),
    b: Math.round(b * alpha + s.b * (1 - alpha)),
  }
}

// ---------------------------------------------------------------------------
// Texto legible contra el fondo REAL del chip
// ---------------------------------------------------------------------------

/**
 * Oscurece el matiz de dominio hasta WCAG ~AA+ contra `backgroundRgb`.
 * Si el matiz no alcanza, cae a #111827 (siempre legible sobre pasteles).
 */
function getReadableTextFor(hex: string, backgroundRgb: Rgb) {
  const bgLum = getLuminanceFromRgb(backgroundRgb)
  const MIN_CONTRAST = 5.5

  for (const amount of [0.42, 0.52, 0.62, 0.72, 0.82, 0.9, 0.96]) {
    const candidate = tintTowardBlack(hex, amount)
    if (
      contrastFromLuminances(getLuminanceFromRgb(candidate), bgLum) >=
      MIN_CONTRAST
    ) {
      return rgbString(candidate)
    }
  }
  return "#111827"
}

function getSubtleText(hex: string) {
  const tint = readCssNumber("--chip-text-tint", 0.84)
  return rgbString(tintTowardWhite(hex, tint))
}

/** Texto del chip por luminancia del fondo (no por tema a ciegas). */
function getChipText(hex: string, backgroundRgb: Rgb) {
  const bgLum = getLuminanceFromRgb(backgroundRgb)
  if (bgLum < 0.45) {
    return getSubtleText(hex)
  }
  return getReadableTextFor(hex, backgroundRgb)
}

// ---------------------------------------------------------------------------
// subtle: identidad de color SIN lavar (causa raíz del pastel en light)
// ---------------------------------------------------------------------------

/**
 * Alpha base viene de CSS. En superficies claras (light) un alpha fijo
 * deja hex saturados y pasteles igual de “muertos”. Aquí se sube el alpha
 * solo hasta que el fondo se separe del surface lo suficiente para que
 * el matiz se reconozca — sin convertir el chip en solid.
 *
 * Misma idea que ScrollArea robusto: reglas explícitas, un solo sitio,
 * sin parches por pantalla.
 */
const MIN_SURFACE_SEPARATION = 36
const MAX_SUBTLE_ALPHA = 0.72

function resolveSubtleAlpha(hex: string, baseAlpha: number): number {
  const surface = readChipSurfaceRgb()
  const surfaceLum = getLuminanceFromRgb(surface)

  // Dark surface: el alpha del token ya da color; no forzar más.
  if (surfaceLum < 0.45) {
    return Math.min(baseAlpha, MAX_SUBTLE_ALPHA)
  }

  let alpha = baseAlpha
  while (alpha < MAX_SUBTLE_ALPHA) {
    const bg = blendOnChipSurface(hex, alpha)
    if (rgbDistance(bg, surface) >= MIN_SURFACE_SEPARATION) break
    alpha = Math.min(MAX_SUBTLE_ALPHA, alpha + 0.04)
  }
  return alpha
}

function subtlePalette(hex: string) {
  const base = readCssNumber("--chip-bg-alpha", 0.5)
  const baseHover = readCssNumber("--chip-bg-alpha-hover", 0.58)
  const baseActive = readCssNumber("--chip-bg-alpha-active", 0.66)

  const a = resolveSubtleAlpha(hex, base)
  // Hover/active mantienen la misma “ganancia” relativa sobre el base efectivo
  const boostHover = Math.max(0, baseHover - base)
  const boostActive = Math.max(0, baseActive - base)
  const aHover = Math.min(MAX_SUBTLE_ALPHA, a + boostHover)
  const aActive = Math.min(MAX_SUBTLE_ALPHA, a + boostActive)

  const bg = blendOnChipSurface(hex, a)
  const text = getChipText(hex, bg)

  return {
    background: rgbString(bg),
    backgroundHover: rgbString(blendOnChipSurface(hex, aHover)),
    backgroundActive: rgbString(blendOnChipSurface(hex, aActive)),
    glow: rgba(hex, 0.12),
    text,
    textMuted: withAlpha(text, 0.62),
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

function solidPalette(hex: string) {
  return {
    background: hex,
    backgroundHover: hex,
    backgroundActive: hex,
    glow: rgba(hex, 0.25),
    text: getContrastText(hex),
    textMuted: withAlpha(getContrastText(hex), 0.62),
    shadow: {
      default: "none",
      hover: `0 4px 12px rgba(0,0,0,0.16)`,
      active: `0 8px 20px rgba(0,0,0,0.24)`,
    },
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function getBadgeColors(
  hex: string,
  variant: BadgeVariant = "subtle",
  _theme?: "light" | "dark",
) {
  if (variant === "solid") return solidPalette(hex)
  return subtlePalette(hex)
}

export function getProcessCardTextColor(
  hex: string,
  _theme?: "light" | "dark",
) {
  return getBadgeColors(hex, "subtle").text
}

/**
 * Superficie glass de dominio (KPI, process cards, pintura).
 * Texto: contraste WCAG contra el stop MÁS CLARO del card (peor caso).
 */
export function getGlassSurface(hex: string, theme?: "light" | "dark") {
  const resolved: "light" | "dark" =
    theme === "dark" || theme === "light"
      ? theme
      : typeof document !== "undefined" &&
          document.documentElement.classList.contains("dark")
        ? "dark"
        : "light"

  const c = getBadgeColors(hex, "subtle", resolved)

  if (resolved === "dark") {
    return {
      background: `linear-gradient(135deg, ${c.background}, var(--process-card-end))`,
      backgroundInset: `linear-gradient(135deg, ${c.background}, color-mix(in oklab, var(--on-glass-foreground) 4%, var(--process-card-end)))`,
      text: c.text,
      textMuted:
        (c as { textMuted?: string }).textMuted ?? "var(--on-glass-muted)",
      textFaint: "var(--on-glass-faint)",
    }
  }

  const start = blendOnChipSurface(hex, 0.38)
  const end = blendOnChipSurface(hex, 0.18)
  const text = getChipText(hex, end)

  return {
    background: `linear-gradient(135deg, ${rgbString(start)}, ${rgbString(end)})`,
    backgroundInset: `linear-gradient(135deg, ${rgbString(start)}, ${rgbString(end)})`,
    text,
    textMuted: withAlpha(text, 0.72),
    textFaint: withAlpha(text, 0.45),
  }
}
