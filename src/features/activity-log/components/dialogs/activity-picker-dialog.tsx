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
} from "../../hooks/use-activity-types"

import {
  useCreateActivityLog,
} from "../../hooks/use-create-activity-log"

import {
  getActivityIcon,
} from "../../constants/activity-icons"

import {
  getCurrentShift,
} from "../../constants/shift-definitions"

import type {
  ShiftSlotDefinition,
} from "../../constants/shift-definitions"

import type {
  ActivityDepartment,
} from "../../types/activity-log.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeSlot?: ShiftSlotDefinition | null
  department?: ActivityDepartment
}

const EMPTY_CONTEXT: ContextPickerValue = {
  projectId: "",
  taskId: "",
}

const MAX_SELECTION_BY_DEPARTMENT: Record<ActivityDepartment, number> = {
  PRODUCCION: 1,
  INGENIERIA: 3,
}

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
    selectedTypeIds,
    setSelectedTypeIds,
  ] = useState<string[]>([])

  const [
    note,
    setNote,
  ] = useState("")

  const [
    context,
    setContext,
  ] = useState<ContextPickerValue>(EMPTY_CONTEXT)

  const [
    submitAttempted,
    setSubmitAttempted,
  ] = useState(false)

  const [
    showDetail,
    setShowDetail,
  ] = useState(false)

  const [
    photo,
    setPhoto,
  ] = useState<File | null>(null)

  const [
    photoPreviewUrl,
    setPhotoPreviewUrl,
  ] = useState<string | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)

  const [
    otherTypesOpen,
    setOtherTypesOpen,
  ] = useState(false)

  const primaryTypes = types.filter(type => type.pinned)
  const otherTypes = types.filter(type => !type.pinned)

  const selectedOtherTypes = otherTypes.filter(
    type => selectedTypeIds.includes(type.id),
  )

  const selectedOtherType =
    selectedOtherTypes.length === 1 ? selectedOtherTypes[0] : undefined

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

    setSelectedTypeIds([])
    setNote("")
    setContext(EMPTY_CONTEXT)
    setSubmitAttempted(false)
    setShowDetail(false)
    setPhoto(null)
    setOtherTypesOpen(false)

    onOpenChange(false)

  }

  const canSave =
    selectedTypeIds.length > 0 && !!context.projectId

  const errors = {

    projectId:

      submitAttempted && !context.projectId

        ? "El proyecto es obligatorio"

        : undefined,

  }

  const maxSelection = MAX_SELECTION_BY_DEPARTMENT[department]

  function handleSelectType(typeId: string) {

    setSelectedTypeIds(prev => {

      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId)
      }

      if (maxSelection === 1) {
        return [typeId]
      }

      if (prev.length >= maxSelection) {
        return prev
      }

      return [...prev, typeId]

    })

  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setPhoto(file ?? null)
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

    await Promise.all(
      selectedTypeIds.map(activityTypeId =>
        createLog({
          activityTypeId,
          projectId: context.projectId,
          taskId:
            context.taskId || undefined,
          shift: activeSlot?.shift,
          note:
            note.trim() || undefined,
          photoBase64,
        }),
      ),
    ).catch(() => {
    })

    handleClose()

  }

  return (

    <FormDialog
      open={open}
      title="¿Qué estás haciendo?"
      icon={Search}
      canSave={canSave}
      saving={creating}
      saveLabel={selectedTypeIds.length > 1 ? `Registrar (${selectedTypeIds.length})` : "Registrar"}
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

        {/* 3. Detalle (nota + foto) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-400">Detalle</span>

            <button
              type="button"
              onClick={() => setShowDetail(prev => !prev)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors tablet:hidden",
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
              "overflow-hidden transition-all duration-200 tablet:max-h-none tablet:opacity-100 tablet:pointer-events-auto",
              showDetail || note.trim() || photo
                ? "max-h-40 opacity-100"
                : "max-h-0 opacity-0 pointer-events-none tablet:max-h-none tablet:opacity-100"
            )}
          >

            <div className="flex flex-col gap-2 rounded-xl bg-white/4 p-2.5">

              <div className="flex min-h-0 flex-1 gap-3">

                {photoPreviewUrl && (
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviewUrl}
                      alt="Foto adjunta"
                      className="size-14 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      aria-label="Quitar foto"
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-neutral-900 text-neutral-200 ring-1 ring-white/15 hover:bg-neutral-800"
                    >
                      <X size={11} />
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
                onChange={handlePhotoChange}
                className="hidden"
              />

            </div>

          </div>

        </div>

        {/* 4. Iconos / Tipos de Actividad */}
        {maxSelection > 1 && (
          <div className="mb-1 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              Tipos de actividad
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                selectedTypeIds.length >= maxSelection
                  ? "text-amber-400"
                  : "text-neutral-500",
              )}
            >
              {selectedTypeIds.length}/{maxSelection}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">

          {primaryTypes.map((type, index) => {

            const Icon =
              getActivityIcon(type.icon)

            const isSelected =
              selectedTypeIds.includes(type.id)

            const isDisabled =
              maxSelection > 1 &&
              !isSelected &&
              selectedTypeIds.length >= maxSelection

            return (

              <button
                key={type.id}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelectType(type.id)}
                style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
                className={cn(
                  "animate-comment-in relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors",
                  isSelected
                    ? "bg-white/12"
                    : isDisabled
                      ? "cursor-not-allowed bg-white/4 opacity-40"
                      : "bg-white/4 hover:bg-white/8",
                )}
              >

                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                    ✓
                  </span>
                )}

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

          {/* Botón "Otros" con popover adaptado para BottomSheet */}
          {otherTypes.length > 0 && (

            <Popover open={otherTypesOpen} onOpenChange={setOtherTypesOpen}>

              <PopoverTrigger asChild>

                <button
                  type="button"
                  className={cn(
                    "relative flex w-full flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors",
                    selectedOtherTypes.length > 0 || otherTypesOpen
                      ? "bg-white/12"
                      : "bg-white/4 hover:bg-white/8",
                  )}
                >

                  {selectedOtherTypes.length > 1 && (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                      {selectedOtherTypes.length}
                    </span>
                  )}

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
                    {selectedOtherType
                      ? selectedOtherType.label
                      : selectedOtherTypes.length > 1
                        ? "Varios"
                        : "Otros"}
                  </span>

                </button>

              </PopoverTrigger>

              <PopoverContent
                side="top"
                align="center"
                sideOffset={8}
                className="w-full max-w-lg p-4"
              >

                <div className="grid grid-cols-3 gap-2.5 w-full">
                  {otherTypes.map((type, index) => {
                    const Icon = getActivityIcon(type.icon)
                    const isSelected = selectedTypeIds.includes(type.id)

                    const isDisabled =
                      maxSelection > 1 &&
                      !isSelected &&
                      selectedTypeIds.length >= maxSelection

                    // Si es el 7mo ítem (el único elemento en la última fila de 3 columnas),
                    // le asignamos col-start-2 para forzarlo exactamente al centro.
                    const isSoleLastItem =
                      index === otherTypes.length - 1 && otherTypes.length % 3 === 1

                    return (
                      <button
                        key={type.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelectType(type.id)}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-2.5 text-center transition-colors w-full",
                          isSelected
                            ? "bg-white/12"
                            : isDisabled
                              ? "cursor-not-allowed bg-white/4 opacity-40"
                              : "bg-white/4 hover:bg-white/8",
                          isSoleLastItem && "col-start-2"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute right-1.5 top-1.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                            ✓
                          </span>
                        )}
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