"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Search,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

type Props = {
  value: string
  onChange: (value: string) => void
}

export function EntityToolbarSearch({
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(
    Boolean(value)
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ignoreBlurRef = useRef(false)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Listener para cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (!value) {
          setOpen(false)
          inputRef.current?.blur()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [value])

  const handleToggle = () => {
    ignoreBlurRef.current = true

    if (open) {
      onChange("")
      setOpen(false)
      // El botón hace preventDefault en mousedown (para no perder el
      // focus a mitad del click), pero eso también bloquea el blur
      // por defecto del navegador — sin este blur explícito, el
      // input se queda con foco real y en mobile el teclado no se
      // cierra aunque la fila visualmente se colapse.
      inputRef.current?.blur()
      return
    }

    setOpen(true)
  }

  const handleBlur = () => {
    if (
      ignoreBlurRef.current
    ) {
      ignoreBlurRef.current =
        false

      return
    }

    if (!value) {
      setOpen(false)
    }
  }

  return (
    <div className="flex justify-end">
      <div
        ref={containerRef}
        className={cn(
          "flex items-center overflow-hidden transition-all duration-200 ease-out",
          open
            ? "w-60"
            : "w-8"
        )}
      >
        <button
          type="button"
          onMouseDown={event =>
            event.preventDefault()
          }
          onClick={handleToggle}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200",
            open
              ? "bg-[#101012]"
              : "hover:bg-[#101012]"
          )}
        >
          <Search
            size={14}
            strokeWidth={2}
          />
        </button>

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center transition-all duration-200",
            open
              ? "pl-2.5 opacity-100"
              : "pl-0 opacity-0 pointer-events-none"
          )}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={event =>
              onChange(
                event.target.value
              )
            }
            onBlur={handleBlur}
            placeholder="Buscar..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
      </div>
    </div>
  )
}