"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import { ActionDialog } from "@/shared/ui/dialogs/action-dialog/action-dialog"
import { FormDialog } from "@/shared/ui/dialogs/form-dialog/form-dialog"

import { TaskFormValue, useTaskForm } from "../../hooks/use-task-form"
import { useTasks } from "../../hooks/use-tasks"

import { TaskForm, TASK_FORM_STEP_COUNT, TaskFormWizardProgress } from "../form/task-form"

import type { Task } from "../../types/task.types"
import type { TaskFormErrors } from "../form/types"

type Props={
  open:boolean
  onClose:()=>void
  projectId?:string
  task?:Task
  promptOpenAfterCreate?:boolean
}

function validateTask(
  form: TaskFormValue,
  projectLocked: boolean,
): TaskFormErrors {

  const errors: TaskFormErrors = {}

  if (!projectLocked && !form.projectId) {
    errors.projectId = "Selecciona un proyecto"
  }

  if (!form.reference.trim()) {
    errors.reference = "Falta completar"
  }

  if (form.lotNumber <= 0) {
    errors.lotNumber = "Falta completar"
  }

  if (form.route.length === 0) {
    errors.route = "Selecciona al menos un proceso"
  }

  if (!form.deliveryDate) {
    errors.deliveryDate = "Selecciona una fecha"
  }

  if (!form.priorityId) {
    errors.priorityId = "Selecciona una prioridad"
  }

  if (!form.materialId) {
    errors.materialId = "Selecciona un material"
  }

  if (!form.thicknessId) {
    errors.thicknessId = "Selecciona un espesor"
  }

  if (form.pieces <= 0) {
    errors.pieces = "Falta completar"
  }

  const requiresAssembly =
    form.route.includes("EN")

  const requiresPaint =
    form.route.includes("PT")

  if (
    requiresAssembly &&
    form.assemblyCount <= 0
  ) {
    errors.assemblyCount =
      "Ingresa la cantidad ensamblada"
  }

  if (
    requiresPaint &&
    !form.colorId
  ) {
    errors.colorId =
      "Selecciona un color"
  }

  if (
    requiresPaint &&
    form.paintKg <= 0
  ) {
    errors.paintKg =
      "Ingresa los kg de pintura"
  }

  return errors

}

const STEP_ERROR_KEYS: Record<number, (keyof TaskFormErrors)[]> = {
  0: ["projectId"],
  1: ["reference", "lotNumber", "route", "deliveryDate", "priorityId", "colorId", "paintKg", "assemblyCount"],
  2: ["materialId", "thicknessId", "pieces"],
}

export function TaskDialog({
  open,
  onClose,
  projectId,
  task,
  promptOpenAfterCreate=false,
}:Props){

  const{
    form,
    update,
    buildTask,
    canSave,
  }=useTaskForm(
    task,
    projectId,
  )

  const{
    create,
    update:updateTask,
  }=useTasks()

  const router=useRouter()

  const { isMobile } = useResponsive()

  const [step, setStep] = useState(0)
  const [stepAttempted, setStepAttempted] = useState<Set<number>>(new Set())

  useEffect(() => {

    if (open) {
      setStep(0)
      setStepAttempted(new Set())
    }

  }, [open])

  const[
    confirmOpenTask,
    setConfirmOpenTask,
  ]=useState(false)

  const[
    createdTaskId,
    setCreatedTaskId,
  ]=useState<string|null>(null)

  const[
    saving,
    setSaving,
  ]=useState(false)

  const[
    attempted,
    setAttempted,
  ]=useState(false)

  const projectLocked=!!projectId

  const routeStarted =
    !!task &&
    task.workflowSteps.some(
      step =>
        step.status !== "PENDING" &&
        step.status !== "QUEUE",
    )

  // Producción iniciada: no quitar procesos de la ruta original; sí agregar.
  const lockedRouteCodes =
    routeStarted && task ? [...task.route] : []

  const routeLocked = false

  const errors=
    validateTask(
      form,
      projectLocked,
    )

  const isValid=
    Object.keys(errors).length===0

  const close=()=>{

    setAttempted(false)

    onClose()

  }

  const save=async()=>{

    if(!isValid){

      setAttempted(true)

      return

    }

    setSaving(true)

    try{

      if(task){

        const data=buildTask()

        await updateTask({

          id:task.id,

          dto:data,

        })

        close()

        return

      }

      const createdTask=
        await create(buildTask())

      if(promptOpenAfterCreate){

        setCreatedTaskId(
          createdTask.id,
        )

        setConfirmOpenTask(true)

        setSaving(false)

        return

      }

      close()

    }catch(error){

      console.error(
        "TASK SAVE ERROR",
        error,
      )

      // No se llama reset() acá a propósito: si el guardado falla
      // (ej. lote duplicado/menor, error de servidor), el
      // formulario debe quedar tal cual el usuario lo dejó para que
      // pueda corregir el campo puntual y reintentar — no perder
      // todo lo que ya cargó.

    }finally{

      setSaving(false)

    }

  }

  function stepHasErrors(stepIndex: number) {
    return STEP_ERROR_KEYS[stepIndex].some(key => errors[key])
  }

  function handleWizardNext() {

    if (stepHasErrors(step)) {

      setStepAttempted(prev => new Set(prev).add(step))

      return

    }

    setStep(current => current + 1)

  }

  function handleWizardBack() {
    setStep(current => Math.max(0, current - 1))
  }

  const isLastStep = step === TASK_FORM_STEP_COUNT - 1

  const showWizardFooter = isMobile && !isLastStep

  const footerCancelLabel =
    isMobile && step > 0
      ? "Atrás"
      : "Cancelar"

  const footerOnCancelClick =
    isMobile && step > 0
      ? handleWizardBack
      : close

  const footerSaveLabel =
    showWizardFooter
      ? "Siguiente"
      : task
        ? "Guardar"
        : "Crear tarea"

  const footerSavingLabel =
    task
      ? "Guardando..."
      : "Creando tarea..."

  const footerCanSave =
    showWizardFooter
      ? !stepHasErrors(step)
      : canSave && isValid

  const footerOnSave =
    showWizardFooter
      ? handleWizardNext
      : save


  const addMaterialLine = () => {
    const current =
      form.materials?.length
        ? form.materials
        : [
            {
              materialId: form.materialId,
              thicknessId: form.thicknessId,
              pieces: form.pieces || 1,
            },
          ]
    update({
      materials: [
        ...current,
        { materialId: "", thicknessId: "", pieces: 1 },
      ],
    })
  }

  const showAddMaterial =
    !isMobile || step === TASK_FORM_STEP_COUNT - 1

  const materialFooterStart = showAddMaterial ? (
    <button
      type="button"
      onClick={addMaterialLine}
      className="inline-flex items-center gap-1.5 rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
    >
      <Plus size={15} strokeWidth={2.5} />
      Añadir material
    </button>
  ) : undefined

  const visibleErrors =
    isMobile
      ? (stepAttempted.has(step) ? errors : undefined)
      : (attempted ? errors : undefined)

  return(

    <>

      <FormDialog
        open={open}
        title={
          task
            ? "Editar tarea"
            : "Nueva tarea"
        }
        icon={Plus}
        canSave={footerCanSave}
        saving={saving}
        saveLabel={footerSaveLabel}
        savingLabel={footerSavingLabel}
        cancelLabel={footerCancelLabel}
        onCancelClick={footerOnCancelClick}
        subHeader={isMobile ? <TaskFormWizardProgress step={step} /> : undefined}
        onClose={close}
        onSave={footerOnSave}
        footerStart={materialFooterStart}
      >

        <TaskForm
          form={{
            ...form,
            projectId:
              projectId ??
              form.projectId,
          }}
          update={update}
          projectLocked={projectLocked}
          routeLocked={routeLocked}
          lockedRouteCodes={lockedRouteCodes}
          step={step}
          errors={visibleErrors}
        />

      </FormDialog>

      <ActionDialog
        open={confirmOpenTask}
        title="Abrir tarea"
        description="
          La tarea fue creada correctamente.
          ¿Deseas abrirla ahora?
        "
        cancelLabel="Más tarde"
        confirmLabel="Abrir"
        onClose={()=>{

          setCreatedTaskId(null)

          setConfirmOpenTask(false)

          close()

        }}
        onConfirm={()=>{

          if(createdTaskId){

            if(form.projectId){

              sessionStorage.setItem(
                "task-origin-project-id",
                form.projectId,
              )

            }else{

              sessionStorage.removeItem(
                "task-origin-project-id",
              )

            }

            router.push(
              `/tasks?taskId=${createdTaskId}`,
            )

          }

          setCreatedTaskId(null)

          setConfirmOpenTask(false)

          close()

        }}
      />

    </>

  )

}