"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import { Spinner } from "@/shared/ui/spinner/spinner"

type EditableProps = {
  value: string | number | null
  placeholder?: string
  suffix?: string
  numeric?: boolean
  disabled?: boolean
  treatZeroAsEmpty?: boolean
  onSave: (
    value: string | null
  ) => void | Promise<void>
}

export function ProcessEditableValue({
  value,
  placeholder = "Ingresar",
  suffix,
  numeric,
  disabled,
  treatZeroAsEmpty = true,
  onSave,
}: EditableProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(
    value === null || value === undefined
      ? ""
      : String(value)
  )

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(
      value === null || value === undefined
        ? ""
        : String(value)
    )
  }, [value])

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
  }, [editing])

  const save = async () => {
    if (saving) return

    const normalized = draft.trim()
    const isZero =
      numeric &&
      treatZeroAsEmpty &&
      normalized !== "" &&
      Number(normalized) === 0

    const toSave =
      normalized === "" || isZero
        ? null
        : normalized

    setSaving(true)

    try {
      await onSave(toSave)
      setEditing(false)
    } catch {
      inputRef.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  if (editing && !disabled) {
    return (
      <div className="relative flex w-full min-w-0 items-center">
        <input
          ref={inputRef}
          type={numeric ? "number" : "text"}
          value={draft}
          disabled={saving}
          onChange={event => {
            const next = event.target.value
            if (numeric) {
              if (next !== "" && !/^\d*\.?\d*$/.test(next)) {
                return
              }
            }
            setDraft(next)
          }}
          onBlur={save}
          onKeyDown={event => {
            if (event.key === "Enter") save()
            if (event.key === "Escape") setEditing(false)
          }}
          className="block w-full min-w-0 border-0 bg-transparent p-0 pr-5 text-left font-inherit leading-inherit text-inherit outline-none disabled:opacity-60"
        />

        {saving && (
          <Spinner
            size={13}
            className="absolute right-0 text-muted-foreground"
          />
        )}
      </div>
    )
  }

  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value)) ||
    (typeof value === "string" && value.trim() === "")

  const hasValue = !isEmpty

  return (
    <span
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      onClick={() => {
        if (disabled) return
        setEditing(true)
      }}
      onKeyDown={event => {
        if (disabled) return

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          setEditing(true)
        }
      }}
      className={
        disabled
          ? "block w-full min-w-0 truncate cursor-default text-left font-inherit leading-inherit text-muted-foreground"
          : "block w-full min-w-0 truncate cursor-pointer text-left font-inherit leading-inherit text-inherit"
      }
    >
      {hasValue
        ? (suffix ? `${value} ${suffix}` : value)
        : (
          <span className="block min-w-0 truncate text-muted-foreground font-normal">
            {placeholder}
          </span>
        )
      }
    </span>
  )
}