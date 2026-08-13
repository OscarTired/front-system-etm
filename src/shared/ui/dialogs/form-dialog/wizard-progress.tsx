"use client"

import { cn } from "@/shared/utils/utils"

type Step = {
  label: string
}

type Props = {
  steps: readonly Step[]
  step: number
}

// Indicador de progreso genérico para cualquier wizard de FormDialog
// (barras + "Paso X de Y · Label") — usado tanto por TaskForm como
// por ProjectForm, en vez de duplicar el mismo componente dos veces.
export function WizardProgress({ steps, step }: Props) {

  return (

    <div className="space-y-2">

      <div className="flex items-center gap-2">

        {steps.map((s, index) => (

          <div
            key={s.label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= step ? "bg-white/70" : "bg-foreground/10",
            )}
          />

        ))}

      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Paso {step + 1} de {steps.length} · {steps[step].label}
      </p>

    </div>

  )

}