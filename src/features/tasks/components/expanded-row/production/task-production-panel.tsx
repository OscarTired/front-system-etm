"use client"

import type {
  Task,
} from "@/features/tasks/types/task.types"

import type {
  EntityBase,
} from "@/shared/types/entity-base.types"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  Check,
  ChevronDown,
} from "lucide-react"

import {
  createWorkflowView,
} from "@/features/workflow/view/create-workflow-view"

import {
  getCurrentStep,
} from "@/features/workflow/selectors/get-current-step"

import {
  WORKFLOW_STATUS_DEFINITIONS,
} from "@/features/workflow/constants/workflow-status-definitions"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"

import {
  cn,
} from "@/shared/utils/utils"

import {
  TaskRouteViewer,
} from "./task-route-viewer"

type Props = {
  task: Task
}

export function TaskProductionPanel({
  task,
}: Props) {

  const [
    expanded,
    setExpanded,
  ] = useState(false)

  // Autoscroll al paso activo cuando se expande en mobile — así no
  // hay que buscarlo a mano si está lejos en la ruta (ej. tarea con
  // 8 procesos y el activo es el 6°).
  const scrollRef = useRef<HTMLDivElement>(null)

  // grid-template-rows animado (lo que había antes) es interpolado
  // por el navegador de forma poco confiable, sobre todo al
  // CERRAR — algunos navegadores lo animan bien al abrir y de golpe
  // al cerrar. Midiendo la altura real del contenido con JS y
  // animando max-height directo, la transición queda simétrica en
  // los dos sentidos siempre.
  const contentRef = useRef<HTMLDivElement>(null)

  const [
    contentHeight,
    setContentHeight,
  ] = useState(0)

  useEffect(() => {

    if (!contentRef.current) return

    const measure = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight)
      }
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)

    resizeObserver.observe(contentRef.current)

    return () => resizeObserver.disconnect()

  }, [])

  const workflowView =
    createWorkflowView(
      task.workflowSteps,
    )

  const currentStep =
    getCurrentStep(
      task.workflowSteps,
    )

  const status =
    useMemo<EntityBase | undefined>(() => {

      if (
        workflowView.completed
      ) {

        return {
          id: "finalized",
          name: "Finalizado",
          icon: "check",
          color: "#22C55E",
        }

      }

      if (
        !currentStep
      ) {
        return undefined
      }

      const definition =
        WORKFLOW_STATUS_DEFINITIONS[
          currentStep.status
        ]

      return {
        id: currentStep.status,
        name: definition.label,
        icon: definition.icon,
        color: definition.color,
      }

    }, [
      workflowView.completed,
      currentStep,
    ])

  const StatusIcon =
    status?.icon
      ? ENTITY_ICONS[status.icon]
      : undefined

  useEffect(() => {

    if (!expanded || !scrollRef.current) return

    const activeEl = scrollRef.current.querySelector('[data-active="true"]')

    activeEl?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })

  }, [expanded])

  const progressContent = (

    <div className="flex min-w-0 flex-col gap-1.5">

      <div className="flex min-w-0 items-center justify-between gap-2">

        <div className="flex min-w-0 items-center gap-1.5">

          {StatusIcon && status && (
            <StatusIcon size={13} style={{ color: status.color }} />
          )}

          <span
            className="truncate text-xs font-bold uppercase tracking-wide"
            style={{ color: status?.color ?? "#737373" }}
          >
            {status?.name ?? "Sin estado"}
          </span>

        </div>

        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-neutral-500">
          {workflowView.completedSteps}/{workflowView.totalSteps} · <span className="text-cyan-400">{workflowView.progress}%</span>
        </span>

      </div>

      <div className="h-2 min-w-0 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-cyan-500 transition-all"
          style={{
            width: `${workflowView.progress}%`,
          }}
        />

      </div>

    </div>

  )

  return (

    <div className="flex h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4">

      {/* Vista de Escritorio — esta ya funcionaba bien, sin cambios. */}
      <div className="hidden xl:block">
        <div className="flex justify-center">

          <TaskRouteViewer
            taskId={task.id}
            route={task.route}
            currentProcess={
              currentStep?.processCode
            }
          />

        </div>

        <div className="mt-3 flex justify-center">

          <div className="w-full max-w-3xl rounded-xl bg-white/2 px-5 py-3.5">

            {progressContent}

          </div>

        </div>
      </div>

      {/* Vista Móvil / pantallas angostas — rediseñada. Antes había
          un carrusel a mano que repetía EXACTAMENTE la misma info
          que ya mostraba el header colapsado (mismo código, mismo
          estado, dos veces), más 3 cajas tipo pill apiladas
          (header / completados / progreso) sin ninguna jerarquía
          entre ellas — "badge sobre badge". Ahora:
          1. El header colapsado muestra SOLO lo esencial de un
             vistazo (paso actual + % ), nunca se repite abajo.
          2. Al expandir, se reusa TaskRouteViewer — el MISMO
             componente que ya usa desktop, ya tiene su propia
             animación, ya resuelve "ver los 6 procesos de un
             vistazo" sin necesitar flechas para navegar uno por
             uno (eso era lo redundante: para ver otro paso había
             que tocar flechas en vez de simplemente mirarlos todos
             juntos, que es lo que la ruta ya hace bien).
          3. Estado + contador + % + barra quedan en UNA sola
             tarjeta cohesiva, no tres piezas sueltas. */}
      <div className="xl:hidden">

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/4 px-3.5 py-3 text-left transition duration-200 hover:bg-white/6"
        >

          <div className="flex min-w-0 flex-col gap-0.5">

            <span className="min-w-0 truncate text-sm font-bold text-neutral-200">
              Ruta de producción
            </span>

            {/* Solo visible colapsado — al expandir ya se ve en el
                stepper de abajo, mostrar los dos a la vez sí sería
                la repetición que señalaste antes. */}
            {!expanded && status && (
              <span
                className="truncate text-xs font-semibold"
                style={{ color: status.color }}
              >
                {status.name} · {workflowView.progress}%
              </span>
            )}

          </div>

          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-neutral-400 transition-transform duration-300 ease-in-out",
              expanded && "rotate-180",
            )}
          />

        </button>

        <div
          className={cn(
            "overflow-hidden transition-[max-height,opacity,margin-top] duration-300 ease-in-out",
            expanded ? "mt-3 opacity-100" : "mt-0 opacity-0",
          )}
          style={{
            maxHeight: expanded ? contentHeight : 0,
          }}
        >
          <div ref={contentRef}>

            {/* Una sola card, mismo tratamiento que ya usa
                ProcessMiniCard (KPIs) — gradiente sutil con el
                color del estado actual, padding generoso. Antes
                había 3 rounded-xl anidados (contenedor > stepper
                envuelto en otro rounded-xl > progreso en OTRO
                rounded-xl más) sin necesidad; con gap-6 alcanza
                para separar las dos secciones sin encajonarlas
                cada una en su propia caja. */}
            <div
              className="flex flex-col gap-6 rounded-2xl p-5"
              style={{
                background: `linear-gradient(135deg, ${status?.color ?? "#737373"}14, #101012)`,
              }}
            >

              {/* Stepper horizontal — cada nodo usa el color/ícono
                  real de PROCESS_DEFINITIONS (no un círculo neutro
                  genérico), y el estado real del workflow decide
                  completado/actual/pendiente en vez de un TODO sin
                  resolver. task.route es la fuente de la ruta (no
                  task.workflowSteps directo, que no garantiza venir
                  en ese orden). */}
              <div
                ref={scrollRef}
                className="hide-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto px-5"
              >

                <div className="flex items-center">

                  {task.route.map((code, index) => {

                    const definition = PROCESS_DEFINITIONS[code]
                    const ProcessIcon = ENTITY_ICONS[definition.icon]

                    const step = task.workflowSteps.find(
                      s => s.processCode === code,
                    )

                    const isActive = currentStep?.processCode === code

                    const isDone =
                      step?.status === "COMPLETED" ||
                      step?.status === "REVIEWED"

                    const isLast = index === task.route.length - 1

                    // Mismo tratamiento de color que ya usa
                    // DynamicBadge (fondo tenue del color + texto
                    // aclarado, cero glow) — antes esto tenía un
                    // borde saturado + box-shadow difuminado
                    // ("neón"), acá directamente no hay sombra.
                    const colors = getBadgeColors(definition.color, "subtle")

                    return (

                      <div
                        key={code}
                        data-active={isActive}
                        className="flex items-center"
                      >

                        <div className="flex flex-col items-center gap-1.5">

                          <div
                            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                            style={
                              isActive || isDone
                                ? {
                                    // Mismo color, distinta intensidad:
                                    // activo usa el fondo "fuerte" que
                                    // ya expone getBadgeColors,
                                    // completado el sutil normal — sin
                                    // necesitar un ring aparte.
                                    backgroundColor: isActive
                                      ? colors.backgroundActive
                                      : colors.background,
                                  }
                                : {
                                    backgroundColor: "rgba(255,255,255,0.03)",
                                    opacity: 0.45,
                                  }
                            }
                          >

                            {isDone ? (
                              <Check size={16} style={{ color: colors.text }} />
                            ) : (
                              <ProcessIcon
                                size={16}
                                style={{ color: isActive ? colors.text : "#737373" }}
                              />
                            )}

                          </div>

                          <span
                            className="text-[10px] font-bold"
                            style={{
                              color:
                                isActive || isDone
                                  ? colors.text
                                  : "#525252",
                            }}
                          >
                            {definition.code}
                          </span>

                        </div>

                        {!isLast && (

                          <div className="mx-1.5 h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-white/8">

                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: isDone ? "100%" : "0%",
                                backgroundColor: colors.text,
                              }}
                            />

                          </div>

                        )}

                      </div>

                    )

                  })}

                </div>

              </div>

              {progressContent}

            </div>

          </div>
        </div>

      </div>

    </div>

  )

}
