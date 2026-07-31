"use client"

import { useRef, useState } from "react"

import { Camera, Trash2, Upload, Image as ImageIcon } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"

import { cn } from "@/shared/utils/utils"
// Importa tu Popover personalizado aquí (ajusta la ruta según tu estructura)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Props = {
  name: string
  avatarUrl?: string | null
  uploading?: boolean
  compact?: boolean
  onSelect: (file: File) => void
  onRemove?: () => void
}

export function AvatarPicker({
  name,
  avatarUrl,
  uploading,
  compact = false,
  onSelect,
  onRemove,
}: Props) {

  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const displayUrl = preview ?? avatarUrl
  const size = compact ? "h-16 w-16" : "h-24 w-24"

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    onSelect(file)
    setIsOpen(false) // Cierra el popover al seleccionar
  }

  function handleRemove() {
    setPreview(null)
    onRemove?.()
    setIsOpen(false) // Cierra el popover al eliminar
  }

  return (
    <div className="flex flex-col items-center gap-2">

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/15 outline-none transition-all focus:ring-primary/50",
              size,
            )}
          >
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-white/10 to-white/3 text-lg font-semibold text-white">
                {name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            {/* Overlay que aparece en hover (desktop) o cuando el popover está abierto */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150 tablet:group-hover:opacity-100",
                isOpen && "opacity-100",
              )}
            >
              {uploading ? (
                <Spinner
                  size={18}
                  className="text-white"
                />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </div>
          </button>
        </PopoverTrigger>

        {/* Contenido del Popover con tus opciones */}
        <PopoverContent
          floatingClassName="w-48"
          className="p-1.5 bg-neutral-900 border-white/10 text-neutral-200 shadow-xl rounded-xl"
        >
          <div className="flex flex-col gap-1">
            
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                inputRef.current?.click()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Upload size={14} className="text-neutral-400" />
              Cambiar foto
            </button>

            {displayUrl && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400/90 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={14} />
                Eliminar foto
              </button>
            )}

          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />

      {/* Texto de apoyo opcional abajo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[11px] font-medium text-neutral-400 hover:text-white transition"
        >
          Cambiar foto
        </button>

        {displayUrl && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400/80 hover:text-red-400 transition"
          >
            <Trash2 size={11} />
            Eliminar
          </button>
        )}
      </div>

    </div>
  )
}