import type { CSSProperties } from "react"

export function getHorizontalMaskStyle(
  leftFade: number = 0,
  rightFade: number = 0,
  maxPercent: number = 40, // Tope máximo en % (ej. 40% del ancho total)
): CSSProperties {
  const safeLeft = Math.max(0, leftFade)
  const safeRight = Math.max(0, rightFade)

  if (safeLeft === 0 && safeRight === 0) {
    return {}
  }

  // Usamos clamp para asegurar: min(0px, valor_deseado, max_porcentaje)
  const gradient = `linear-gradient(
    to right,
    transparent 0px,
    black clamp(0px, ${safeLeft}px, ${maxPercent}%),
    black calc(100% - clamp(0px, ${safeRight}px, ${maxPercent}%)),
    transparent 100%
  )`

  return {
    maskImage: gradient,
    WebkitMaskImage: gradient,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    willChange: "mask-image, -webkit-mask-image",
    transform: "translateZ(0)",
  } as CSSProperties
}