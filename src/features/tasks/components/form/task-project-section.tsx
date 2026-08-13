"use client"

import { Folder } from "lucide-react"

import { FormSection } from "@/shared/ui/dialogs/form-dialog/form-section"
import { ContextPicker } from "@/features/tasks/components/context-picker"

import type { TaskFormSectionProps } from "./types"

export function TaskProjectSection({
  form,
  update,
  errors,
}: TaskFormSectionProps) {

  return (

    <FormSection
      title="Proyecto"
      icon={Folder}
    >

      <div className="space-y-1.5">

        <p className="text-sm font-medium text-muted-foreground">
          Proyecto
        </p>

        <div className="flex justify-center">

          <ContextPicker
            mode="projects"
            value={{
              projectId: form.projectId,
              taskId: "",
            }}
            onChange={next =>
              update({
                projectId: next.projectId,
              })
            }
          />

        </div>

        {errors?.projectId && (

          <p className="text-xs font-medium text-red-400">

            * {errors.projectId}

          </p>

        )}

      </div>

    </FormSection>

  )

}