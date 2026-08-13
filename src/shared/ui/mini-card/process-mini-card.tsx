"use client"

import type {
  LucideIcon,
} from "lucide-react"

import type {
  ReactNode,
} from "react"

import {
  useBadgeColors,
} from "@/shared/utils/use-badge-colors"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

type Row = {
  label: string
  value: ReactNode
  secondary?: string
  editable?: boolean
}

type CardProps = {
  label: string
  icon: LucideIcon
  color: string
  rows: Row[]
  size?: "default" | "large"
}

export function ProcessMiniCard({
  label,
  icon: Icon,
  color,
  rows,
  size = "default",
}: CardProps) {
  const { isMobile } = useResponsive()

  const badgeColors =
    useBadgeColors(
      color,
      "subtle"
    )

  const textColor = badgeColors.text

  const isLarge = size === "large"

  return (
    <div
      className={cn(
        "flex h-full select-none flex-col overflow-hidden rounded-xl",
        isLarge
          ? "justify-center gap-5 p-6"
          : isMobile ? "gap-3 p-4" : "min-h-43.5 p-5",
      )}
      style={{
        background:
          // El primer stop viene de useBadgeColors (ya sabe que un
          // mismo % de alpha se ve MUY distinto según qué haya
          // detrás: contra negro un 14% de color se lee como un
          // glow visible, contra blanco un 14% casi no se nota —
          // por eso esa función ya usa 24% en light. Antes acá se
          // armaba el color a mano con `${color}33` (20% fijo,
          // pensado solo para dark), y quedaba lavado en light.
          `linear-gradient(
            135deg,
            ${badgeColors.background},
            var(--process-card-end, var(--process-card-end))
          )`,
      }}
    >
      <div className={cn("flex min-w-0 items-center justify-between gap-2", !isLarge && !isMobile && "mb-3")}>
        <span
          className={cn(
            "min-w-0 truncate font-bold uppercase tracking-[0.18em]",
            isLarge ? "text-sm" : "text-xs",
          )}
          style={{
            color: textColor,
          }}
        >
          {label}
        </span>

        <Icon
          size={isLarge ? 26 : 20}
          className="shrink-0"
          style={{
            color: textColor,
          }}
        />
      </div>

      {isLarge ? (
        <div className="flex min-w-0 flex-col gap-4">
          {rows.map(
            row => (
              <div
                key={row.label}
                className="flex min-w-0 items-baseline justify-between gap-2"
              >
                <p className="min-w-0 shrink truncate text-xs font-bold uppercase tracking-[0.14em] text-on-glass-muted">
                  {row.label}
                </p>

                <div className="flex min-w-0 flex-1 justify-end items-baseline gap-1.5">
                  <span
                    className={
                      row.editable === false
                        ? "min-w-0 truncate whitespace-nowrap text-2xl font-semibold leading-tight text-on-glass-muted"
                        : "min-w-0 truncate whitespace-nowrap text-2xl font-bold leading-tight"
                    }
                    style={
                      row.editable === false
                        ? undefined
                        : { color: textColor }
                    }
                  >
                    {row.value}
                  </span>

                  {row.secondary && (
                    <span className="max-w-24 shrink-0 truncate text-xs leading-tight text-on-glass-muted">
                      {row.secondary}
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      ) : isMobile ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          {rows.map(
            row => (
              <div
                key={row.label}
                className="flex min-w-0 items-baseline justify-between gap-2"
              >
                <p className="min-w-0 shrink truncate text-[11px] font-bold uppercase tracking-[0.14em] text-on-glass-muted">
                  {row.label}
                </p>

                <div className="flex min-w-0 flex-1 justify-end items-baseline gap-1.5">
                  <span
                    className={
                      row.editable === false
                        ? "min-w-0 truncate whitespace-nowrap text-sm font-semibold leading-tight text-on-glass-muted"
                        : "min-w-0 truncate whitespace-nowrap text-sm font-bold leading-tight"
                    }
                    style={
                      row.editable === false
                        ? undefined
                        : { color: textColor }
                    }
                  >
                    {row.value}
                  </span>

                  {row.secondary && (
                    <span className="max-w-20 shrink-0 truncate text-[11px] leading-tight text-on-glass-muted">
                      {row.secondary}
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        // grid + auto-fit/minmax en vez de flex-1 a partes iguales:
        // con flex-1, 3 renglones SIEMPRE se dividen en 3 franjas
        // iguales sin importar cuánto ancho real haya, así que en
        // una card angosta con 3 renglones cada uno queda apretado
        // aunque la pantalla sea enorme (el resto del ancho lo
        // absorben las OTRAS cards del grid de 4 columnas, no esta).
        // Con auto-fit, cada renglón pide un mínimo (minmax) y el
        // browser decide solo cuántos entran por línea: si hay
        // espacio de sobra, todos caben en una fila y crecen para
        // llenarlo (sin truncar); si no alcanza, el que no entra
        // pasa a una segunda línea en vez de comprimirse a la
        // fuerza. Se sacan los divisores border-l porque con wrap
        // ya no hay un "primero de la fila" fijo — un borde
        // colgando al inicio de la segunda línea se vería roto.
        <div
          className="grid min-w-0 flex-1 content-center gap-x-4 gap-y-2.5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(6.5rem, 1fr))" }}
        >
          {rows.map(
            row => (
              <div
                key={row.label}
                className="min-w-0"
              >
                <p className="text-xs font-bold uppercase truncate tracking-[0.16em] text-on-glass-muted">
                  {row.label}
                </p>

                <div
                  className={
                    row.editable === false
                      ? "mt-1.5 min-w-0 text-lg font-semibold leading-tight truncate text-on-glass-muted"
                      : "mt-1.5 min-w-0 text-lg font-bold leading-tight truncate"
                  }
                  style={
                    row.editable === false
                      ? undefined
                      : { color: textColor }
                  }
                >
                  {row.value}
                </div>

                {row.secondary && (
                  <p className="mt-1 text-xs leading-tight truncate text-on-glass-muted">
                    {row.secondary}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
