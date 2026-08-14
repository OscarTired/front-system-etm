"use client"

import { useRef, useState } from "react"

import { Camera, Trash2 } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"

import { cn } from "@/shared/utils/utils"

type Props = {
  name: string
  avatarUrl?: string | null
  uploading?: boolean
  compact?: boolean
  onSelect: (file: File) => void
  onRemove?: () => void
}

/**
 * Avatar: el nativo del sistema (input file), no sheet vacío.
 * "Cambiar foto" / tap en el círculo → file picker del OS.
 */
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

  const displayUrl = preview ?? avatarUrl
  const size = compact ? "h-16 w-16" : "h-24 w-24"

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    onSelect(file)
    e.target.value = ""
  }

  function openNative() {
    if (uploading) return
    inputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={openNative}
        disabled={uploading}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-full outline-none transition-all focus-visible:outline-none",
          size,
        )}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-white/10 to-foreground/5 text-lg font-semibold text-foreground">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150",
            "tablet:group-hover:opacity-100",
            uploading && "opacity-100",
          )}
        >
          {uploading ? (
            <Spinner size={18} className="text-foreground" />
          ) : (
            <Camera size={16} className="text-foreground" />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openNative}
          disabled={uploading}
          className="text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
        >
          Cambiar foto
        </button>

        {displayUrl && onRemove && (
          <button
            type="button"
            onClick={() => {
              setPreview(null)
              onRemove()
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400/80 transition hover:text-red-400"
          >
            <Trash2 size={11} />
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}
