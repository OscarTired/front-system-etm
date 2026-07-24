"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Search,
  MessageSquarePlus,
  MoreHorizontal,
  Camera,
  X,
} from "lucide-react"

import {
  FormDialog,
} from "@/shared/ui/dialogs/form-dialog/form-dialog"

import {
  FormField,
} from "@/shared/ui/dialogs/form-dialog/form-field"

import {
  cn,
} from "@/shared/utils/utils"

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

import {
  ContextPicker,
  type ContextPickerValue,
} from "@/features/tasks/components/context-picker"

import {
  useActivityTypes,
} from "../hooks/use-activity-types"

import {
  useCreateActivityLog,
} from "../hooks/use-create-activity-log"

import {
  getActivityIcon,
} from "../constants/activity-icons"

import {
  getCurrentShift,
} from "../constants/shift-definitions"

import type {
  ShiftSlotDefinition,
} from "../constants/shift-definitions"

import type {
  ActivityDepartment,
} from "../types/activity-log.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Slot sobre el que se tocó "+ Registrar" — solo para mostrar
  // contexto y el aviso de abajo. Lo que realmente queda guardado
  // como franja lo decide el servidor a partir de la hora real al
  // momento de guardar (ver activity-log.service.ts), no este valor.
  activeSlot?: ShiftSlotDefinition | null
  // Bitácora de Producción (default) o de Ingeniería — decide qué
  // tipos de actividad se listan acá.
  department?: ActivityDepartment
}

const EMPTY_CONTEXT: ContextPickerValue = {
  projectId: "",
  taskId: "",
}

// Convierte un File a data URI (base64) — mismo mecanismo que usa
// CommentComposer para adjuntar fotos.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(file)
  })
}

export function ActivityPickerDialog({
  open,
  onOpenChange,
  activeSlot,
  department = "PRODUCCION",
}: Props) {

  const {
    types,
  } = useActivityTypes(false, department)

  const {
    createLog,
    creating,
  } = useCreateActivityLog(types, department)

  const [
    selectedTypeId,
    setSelectedTypeId,
  ] = useState<string | null>(null)

  const [
    note,
    setNote,
  ] = useState("")

  const [
    context,
    setContext,
  ] = useState<ContextPickerValue>(EMPTY_CONTEXT)

  // Sólo se muestra el mensaje rojo después de un intento de
  // guardar fallido — igual que el form de Task, no molesta con
  // rojo mientras la persona todavía está eligiendo tipo/proyecto.
  const [
    submitAttempted,
    setSubmitAttempted,
  ] = useState(false)

  // Estado para alternar la visibilidad de la caja de detalle
  // (nota + foto juntas) en móviles
  const [
    showDetail,
    setShowDetail,
  ] = useState(false)

  // Foto adjunta opcional (detalle) — mismo patrón que CommentComposer:
  // se guarda el File para la preview local y se convierte a base64
  // recién al enviar.
  const [
    photo,
    setPhoto,
  ] = useState<File | null>(null)

  const [
    photoPreviewUrl,
    setPhotoPreviewUrl,
  ] = useState<string | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)

  // Popover de "Otros" tipos de actividad (los que no son `pinned`)
  const [
    otherTypesOpen,
    setOtherTypesOpen,
  ] = useState(false)

  // 100% data-driven: qué va fijo y qué va dentro de "Otros" lo
  // decide el campo `pinned` de cada tipo (administrable desde la
  // pantalla de Tipos de Actividad) — nada de códigos hardcodeados
  // acá, así que un tipo nuevo cae automáticamente en "Otros" salvo
  // que se lo marque como fijo desde el admin.
  const primaryTypes = types.filter(type => type.pinned)
  const otherTypes = types.filter(type => !type.pinned)

  const selectedOtherType = otherTypes.find(
    type => type.id === selectedTypeId,
  )

  // Genera/limpia la preview local de la foto
  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(photo)
    setPhotoPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [photo])

  function handleClose() {

    setSelectedTypeId(null)
    setNote("")
    setContext(EMPTY_CONTEXT)
    setSubmitAttempted(false)
    setShowDetail(false)
    setPhoto(null)
    setOtherTypesOpen(false)

    onOpenChange(false)

  }

  const canSave =
    !!selectedTypeId && !!context.projectId

  const errors = {

    projectId:

      submitAttempted && !context.projectId

        ? "El proyecto es obligatorio"

        : undefined,

  }

  function handleSelectType(typeId: string) {

    const isDeselecting = selectedTypeId === typeId

    setSelectedTypeId(isDeselecting ? null : typeId)

    if (!isDeselecting) {
      setOtherTypesOpen(false)
    }

  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setPhoto(file ?? null)
    // Permite volver a elegir el mismo archivo si lo saca y lo vuelve a poner
    event.target.value = ""
  }

  async function handleSubmit() {

    if (!canSave) {

      setSubmitAttempted(true)

      return

    }

    const photoBase64 = photo
      ? await fileToBase64(photo).catch(() => undefined)
      : undefined

    await createLog({
      activityTypeId: selectedTypeId!,
      projectId: context.projectId,
      taskId:
        context.taskId || undefined,
      // La franja que la persona tocó a mano — se respeta tal cual
      // aunque ya haya pasado (se olvidó y lo registra tarde). Sin
      // esto, el backend recalculaba la franja por la hora real y
      // el registro terminaba en la franja equivocada.
      shift: activeSlot?.shift,
      note:
        note.trim() || undefined,
      photoBase64,
    }).catch(() => {
      // El rollback (si falla de verdad)
      // ya lo maneja useCreateActivityLog.
    })

    handleClose()

  }

  return (

    <FormDialog
      open={open}
      title="¿Qué estás haciendo?"
      icon={Search}
      canSave={!!selectedTypeId}
      saving={creating}
      saveLabel="Registrar"
      savingLabel="Guardando..."
      onClose={handleClose}
      onSave={handleSubmit}
    >

      <div className="flex flex-col gap-4">

        {activeSlot && activeSlot.shift !== getCurrentShift(new Date()) && (

          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Ya pasó la hora de &ldquo;{activeSlot.label}&rdquo; — se
            va a guardar igual en esta franja. Si quieres, detalla abajo
            por qué se registra recién ahora.
          </p>

        )}

        {/* 1. Proyectos */}
        <div className="flex flex-col gap-2 rounded-xl bg-white/4 p-3">

          <FormField label="Proyecto *" error={errors.projectId}>

            <ContextPicker
              mode="projects"
              value={context}
              onChange={next =>
                setContext({

                  projectId: next.projectId,

                  // Si cambia el proyecto, la tarea elegida antes
                  // ya no aplica.
                  taskId:
                    next.projectId === context.projectId
                      ? context.taskId
                      : "",

                })
              }
            />

          </FormField>

          {/* 2. Tareas */}
          <FormField label="Tarea (opcional)">

            <ContextPicker
              mode="tasks"
              // Sin proyecto elegido todavía, taskProjectId queda
              // undefined y el picker simplemente lista tareas de
              // todos los proyectos — elegir una tarea acá también
              // completa el proyecto solo (ver selectTask).
              taskProjectId={context.projectId || undefined}
              value={context}
              onChange={next =>
                setContext({
                  projectId: next.projectId,
                  taskId: next.taskId,
                })
              }
            />

          </FormField>

        </div>

        {/* 3. Detalle (nota + foto, igual que CommentComposer: viven
            dentro de la misma caja, la cámara está adentro del
            input, no es un botón aparte) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-400">Detalle</span>

            <button
              type="button"
              onClick={() => setShowDetail(prev => !prev)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
                showDetail || note.trim() || photo
                  ? "bg-white/12 text-white"
                  : "bg-white/4 text-neutral-400 hover:bg-white/8 hover:text-white"
              )}
            >
              <MessageSquarePlus size={15} />
              <span>{showDetail || note.trim() || photo ? "Ocultar detalle" : "Añadir detalle"}</span>
              {(note.trim() || photo) && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500" />
              )}
            </button>

          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              showDetail || note.trim() || photo
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0 pointer-events-none"
            )}
          >

            {/* Misma caja para nota y foto — igual que
                comment-composer.tsx: la foto aparece al costado del
                textarea, y el botón de cámara vive en el pie de esta
                misma caja. */}
            <div className="flex flex-col gap-2 rounded-xl bg-white/4 p-2.5">

              <div className="flex min-h-0 flex-1 gap-3">

                {photoPreviewUrl && (

                  <div className="relative shrink-0">

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviewUrl}
                      alt="Foto adjunta"
                      className="h-16 w-16 rounded-lg object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    >
                      <X size={12} />
                    </button>

                  </div>

                )}

                <textarea
                  value={note}
                  onChange={event =>
                    setNote(event.target.value)
                  }
                  placeholder={
                    activeSlot && activeSlot.shift !== getCurrentShift(new Date())
                      ? "Ej: se me pasó registrarlo antes..."
                      : "Detalle opcional..."
                  }
                  className="min-h-16 min-w-0 flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
                />

              </div>

              <div className="flex items-center">

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Camera size={16} strokeWidth={2.4} />
                </button>

              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />

            </div>

          </div>

        </div>

        {/* 4. Iconos / Tipos de Actividad */}
        <div className="grid grid-cols-3 gap-2">

          {primaryTypes.map(type => {

            const Icon =
              getActivityIcon(type.icon)

            const isSelected =
              selectedTypeId === type.id

            return (

              <button
                key={type.id}
                type="button"
                onClick={() =>
                  setSelectedTypeId(prev =>
                    prev === type.id ? null : type.id,
                  )
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors",
                  isSelected
                    ? "bg-white/12"
                    : "bg-white/4 hover:bg-white/8",
                )}
              >

                <div
                  className="flex size-9 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${type.color}22`,
                    color: type.color,
                  }}
                >

                  <Icon size={17} />

                </div>

                <span className="text-[11px] font-medium leading-tight text-neutral-300">
                  {type.label}
                </span>

              </button>

            )

          })}

          {/* Botón "Otros" con popover para el resto de los tipos (los que no son pinned) */}
          {otherTypes.length > 0 && (

            <Popover open={otherTypesOpen} onOpenChange={setOtherTypesOpen}>

              <PopoverTrigger asChild>

                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors",
                    selectedOtherType || otherTypesOpen
                      ? "bg-white/12"
                      : "bg-white/4 hover:bg-white/8",
                  )}
                >

                  <div
                    className="flex size-9 items-center justify-center rounded-full"
                    style={
                      selectedOtherType
                        ? {
                            backgroundColor: `${selectedOtherType.color}22`,
                            color: selectedOtherType.color,
                          }
                        : { backgroundColor: "rgba(255,255,255,0.08)", color: "#a3a3a3" }
                    }
                  >
                    {selectedOtherType ? (
                      (() => {
                        const SelectedIcon = getActivityIcon(selectedOtherType.icon)
                        return <SelectedIcon size={17} />
                      })()
                    ) : (
                      <MoreHorizontal size={17} />
                    )}
                  </div>

                  <span className="truncate text-[11px] font-medium leading-tight text-neutral-300">
                    {selectedOtherType ? selectedOtherType.label : "Otros"}
                  </span>

                </button>

              </PopoverTrigger>

              {/* align="end" en vez de "center": el botón vive en la
                  última columna de la grilla (borde derecho del
                  dialog) — centrado se salía del dialog en desktop.
                  Alineado al borde derecho del trigger, y
                  avoidCollisions (default del componente) lo
                  reacomoda solo si ni así entra en pantalla. */}
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-64"
              >

                <div className="grid grid-cols-3 gap-2">
                  {otherTypes.map(type => {
                    const Icon = getActivityIcon(type.icon)
                    const isSelected = selectedTypeId === type.id

                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleSelectType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors",
                          isSelected
                            ? "bg-white/12"
                            : "bg-white/4 hover:bg-white/8",
                        )}
                      >
                        <div
                          className="flex size-8 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${type.color}22`,
                            color: type.color,
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <span className="text-[10px] font-medium leading-tight text-neutral-300">
                          {type.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

              </PopoverContent>

            </Popover>

          )}

        </div>

      </div>

    </FormDialog>

  )

}