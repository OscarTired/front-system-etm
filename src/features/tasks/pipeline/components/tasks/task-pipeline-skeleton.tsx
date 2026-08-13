"use client"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { cn } from "@/shared/utils/utils"

import { PIPELINE_PROCESS_ORDER, PIPELINE_KPI_COLORS } from "../../utils/process-columns"

const KPI_SKELETON_COLORS = Object.values(PIPELINE_KPI_COLORS)

// Color del KPI de "Avance" — es el único visible en el estado
// compacto (default), así que es el único que el skeleton necesita
// simular. El resto de colores queda sin uso acá; se mantiene el
// export por si en algún momento se vuelve a necesitar un skeleton
// expandido (ver nota abajo).
const PROGRESS_COLOR = KPI_SKELETON_COLORS[KPI_SKELETON_COLORS.length - 1]

// Refleja el estado compacto (default) de TaskPipelineHeader: una
// sola fila full-width con ícono + label + dos valores + botón de
// expandir — en vez del grid de 4 cards o el carrusel grande que
// mostraba antes. Debe coincidir en estructura con el render real
// para que no haya salto de layout al terminar de cargar.
function SkeletonKpiCompact() {

  return (

    <div
      className="flex w-full items-center gap-3 rounded-2xl p-3 tablet:gap-4 tablet:p-4"
      style={{
        background: `linear-gradient(135deg, ${PROGRESS_COLOR}20, var(--process-card-end, #101012))`,
      }}
    >

      <span className="h-11 w-11 shrink-0 rounded-xl bg-foreground/5" />

      <span className="hidden h-3 w-16 shrink-0 rounded bg-foreground/10 tablet:block" />

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4 tablet:gap-8">

        <div className="text-right">
          <span className="ml-auto block h-2.5 w-16 rounded bg-foreground/10" />
          <span className="ml-auto mt-2 block h-4 w-8 rounded bg-white/12" />
        </div>

        <span className="h-8 w-px shrink-0 bg-foreground/10" />

        <div className="text-right">
          <span className="ml-auto block h-2.5 w-16 rounded bg-foreground/10" />
          <span className="ml-auto mt-2 block h-4 w-8 rounded bg-white/12" />
        </div>

      </div>

      <span className="h-9 w-9 shrink-0 rounded-full bg-foreground/5" />

    </div>

  )

}

function SkeletonColumnOperator({
  centered = false,
}: {
  centered?: boolean
}) {

  return (

    <div
      className={cn(
        "flex h-10 items-center gap-2 px-1",
        centered ? "justify-center" : "justify-between",
      )}
    >

      {/* Badge operario */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-foreground/5 px-2 py-1",
          centered ? "shrink-0" : "flex-1",
        )}
      >

        <span className="size-4 shrink-0 rounded-full bg-foreground/10" />

        <span className="h-2.5 w-20 rounded bg-foreground/10" />

      </div>

      {/* Badge estado */}
      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1">

        <span className="size-3 rounded bg-foreground/10" />

        <span className="h-2.5 w-14 rounded bg-foreground/10" />

      </div>

    </div>

  )

}

// Header centrado a todo el ancho — calco del header propio que
// arma MobilePipelineCarousel (chip de código + ícono + label +
// contador, centrados como grupo), NO del ColumnHeader de desktop
// (left-aligned, w-72 fijo, contador con ml-auto a la derecha).
function SkeletonMobileHeader() {

  return (

    <div className="flex h-10 items-center justify-center gap-2 border-b border-border px-3">

      <span className="size-6 shrink-0 rounded-md bg-foreground/10" />
      <span className="size-4 shrink-0 rounded bg-foreground/10" />
      <span className="h-3.5 w-24 rounded bg-foreground/10" />
      <span className="h-3.5 w-4 rounded bg-foreground/5" />

    </div>

  )

}

const SKELETON_ROWS = [1, 0.85, 0.7, 0.55]

function SkeletonCardCompact({
  opacity,
}: {
  opacity: number
}) {

  return (

    <div
      className="flex h-12 items-center gap-2.5 rounded-xl bg-foreground/5 px-3"
      style={{ opacity }}
    >

      <span className="h-3.5 w-9 rounded bg-foreground/10" />

      <span className="size-1.5 rounded-full bg-foreground/15" />

      <span className="h-3.5 flex-1 rounded bg-foreground/10" />

      <span className="h-5 w-14 rounded-md bg-foreground/10" />

    </div>

  )

}

function SkeletonColumn({
  isMobile,
}: {
  isMobile: boolean
}) {

  return (

    <div className={cn("flex h-full shrink-0 flex-col overflow-hidden", isMobile ? "w-full" : "w-72")}>

      <div className="flex shrink-0 flex-col">

        <div className="flex items-center gap-2 border-b border-border px-3 py-3">

          <span className="size-6 rounded-md bg-foreground/10" />
          <span className="size-4 rounded bg-foreground/10" />
          <span className="h-3.5 w-24 rounded bg-foreground/10" />
          <span className="ml-auto h-3.5 w-4 rounded bg-foreground/5" />

        </div>

        <div className="border-b border-border px-2 py-1">

          <SkeletonColumnOperator />

        </div>

      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">

        <div className="flex flex-col gap-2">

          {SKELETON_ROWS.map((opacity, i) => (

            <SkeletonCardCompact
              key={i}
              opacity={opacity}
            />

          ))}

        </div>

      </div>

    </div>

  )

}

export function TaskPipelineSkeleton() {

  const { isMobile } = useResponsive()

  if (isMobile) {

    return (

      <div className="flex w-full animate-pulse flex-col">

        <SkeletonKpiCompact />

        <div className="mt-3">

          <SkeletonMobileHeader />

          <div className="border-b border-border px-2 py-1">

            <SkeletonColumnOperator centered />

          </div>

          {/* Igual que MobilePipelineCarousel */}
          <div className="mt-2">

            <div className="flex flex-col gap-2 px-2 py-2">

              {SKELETON_ROWS.map((opacity, i) => (

                <SkeletonCardCompact
                  key={i}
                  opacity={opacity}
                />

              ))}

            </div>

          </div>

        </div>

      </div>

    )

  }

  return (

    <div className="flex h-full min-h-0 w-full animate-pulse flex-col overflow-hidden">

      <div className="shrink-0">

        <SkeletonKpiCompact />

      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">

        <div className="flex h-full gap-4">

          {PIPELINE_PROCESS_ORDER.map(code => (

            <SkeletonColumn
              key={code}
              isMobile={false}
            />

          ))}

        </div>

      </div>

    </div>

  )

}