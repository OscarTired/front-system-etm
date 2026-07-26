"use client"

import type { Task } from "@/features/tasks/types/task.types"
import type { EntityBase } from "@/shared/types/entity-base.types"

import { useMemo, useState, useEffect, useRef } from "react"
import { ChevronDown, Check } from "lucide-react"

import { createWorkflowView } from "@/features/workflow/view/create-workflow-view"
import { getCurrentStep } from "@/features/workflow/selectors/get-current-step"
import { WORKFLOW_STATUS_DEFINITIONS } from "@/features/workflow/constants/workflow-status-definitions"
import { ENTITY_ICONS } from "@/shared/constants/entity-icons"
import { cn } from "@/shared/utils/utils"

type Props = {
  task: Task
}

export function TaskProductionPanel({ task }: Props) {
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const workflowView = createWorkflowView(task.workflowSteps)
  const currentStep = getCurrentStep(task.workflowSteps)

  // Autoscroll para centrar el paso activo en móvil cuando se expande
  useEffect(() => {
    if (expanded && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('[data-active="true"]')
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      }
    }
  }, [expanded])

  const status = useMemo<EntityBase | undefined>(() => {
    if (workflowView.completed) {
      return { id: "finalized", name: "Finalizado", icon: "check", color: "#22C55E" }
    }
    if (!currentStep) return undefined

    const definition = WORKFLOW_STATUS_DEFINITIONS[currentStep.status]
    return {
      id: currentStep.status,
      name: definition.label,
      icon: definition.icon,
      color: definition.color,
    }
  }, [workflowView.completed, currentStep])

  const StatusIcon = status?.icon ? ENTITY_ICONS[status.icon] : undefined

  return (
    <div className="flex h-full min-h-43.5 w-full flex-col justify-center rounded-xl bg-white/2 p-4">
      
      {/* --- DESKTOP VIEW (Mantenida intacta según tu lógica) --- */}
      <div className="hidden xl:block">{/* ... tu código desktop ... */}</div>

      {/* --- MOBILE VIEW --- */}
      <div className="xl:hidden">
        {/* Cabecera del Acordeón (Ahora incluye una mini barra de progreso absoluta en la base) */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-white/4 transition duration-200 hover:bg-white/6"
        >
          <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex flex-col items-start gap-0.5">
              <span className="min-w-0 truncate text-sm font-bold text-neutral-200">
                Ruta de producción
              </span>
              {!expanded && status && (
                <span className="text-xs font-medium" style={{ color: status.color }}>
                  {status.name} • {workflowView.progress}%
                </span>
              )}
            </div>

            <ChevronDown
              size={18}
              className={cn(
                "text-neutral-400 transition-transform duration-300 ease-in-out",
                expanded && "rotate-180"
              )}
            />
          </div>

          {/* Barra de progreso sutil en la base del botón cuando está colapsado */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all duration-300",
              expanded ? "opacity-0" : "opacity-100"
            )}
            style={{ width: `${workflowView.progress}%` }}
          />
        </button>

        {/* Contenido Expandido */}
        <div
          className={cn(
            "grid overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
            
            {/* 1. Header del estado actual dentro del panel */}
            <div className="mb-6 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  {StatusIcon && status && (
                    <StatusIcon size={16} style={{ color: status.color }} />
                  )}
                  <span
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: status?.color ?? "#737373" }}
                  >
                    {status?.name ?? "Sin estado"}
                  </span>
               </div>
               <span className="text-xs font-semibold text-neutral-500">
                 {workflowView.completedSteps}/{workflowView.totalSteps}
               </span>
            </div>

            {/* 2. El Stepper Horizontal (Reemplazo conceptual del TaskRouteViewer) */}
            <div 
              ref={scrollRef}
              className="hide-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-2"
            >
              <div className="flex items-center">
                {task.workflowSteps.map((step, index) => {
                  const isCompleted = step.status === 'COMPLETED'; // Ajusta según tu lógica
                  const isActive = currentStep?.id === step.id;
                  const isLast = index === task.workflowSteps.length - 1;

                  return (
                    <div 
                      key={step.id} 
                      className="flex items-center snap-center"
                      data-active={isActive}
                    >
                      {/* Nodo del paso */}
                      <div className="flex flex-col items-center gap-2">
                        <div 
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                            isActive ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.3)]" : 
                            isCompleted ? "border-neutral-700 bg-neutral-800" : 
                            "border-neutral-800 bg-transparent opacity-50"
                          )}
                        >
                          {isCompleted ? (
                            <Check size={16} className="text-neutral-400" />
                          ) : (
                            <span className={cn(
                              "text-xs font-bold", 
                              isActive ? "text-cyan-400" : "text-neutral-500"
                            )}>
                              {step.processCode} {/* ej: CT, PL */}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Línea conectora */}
                      {!isLast && (
                        <div className="mx-2 h-0.5 w-8 shrink-0 rounded-full bg-neutral-800">
                           {/* Llenado de la línea si el paso actual ya se completó */}
                           <div 
                             className="h-full bg-cyan-500/50 transition-all duration-500" 
                             style={{ width: isCompleted ? '100%' : '0%' }}
                           />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
