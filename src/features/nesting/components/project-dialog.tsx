"use client"

import { useCallback, useEffect, useState } from "react"
import {
  FolderOpen,
  Save,
  Trash2,
  Cloud,
  HardDrive,
  RefreshCw,
  FileJson,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { FormDialogHeader } from "@/shared/ui/dialogs/form-dialog/form-dialog-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/shared/ui/spinner/spinner"
import {
  nestingProjectsApi,
  type NestingProjectRecord,
} from "../api/nesting-projects.api"

type Mode = "save" | "open"

type Props = {
  open: boolean
  mode: Mode
  onClose: () => void
  suggestedName?: string
  onSaveToBackend: (name: string, existingId?: string) => Promise<void>
  onSaveLocal: (name: string) => Promise<void>
  onOpenFromBackend: (id: string) => Promise<void>
  onOpenLocalFile: (file: File) => Promise<void>
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ProjectDialog({
  open,
  mode,
  onClose,
  suggestedName = "proyecto-nesting",
  onSaveToBackend,
  onSaveLocal,
  onOpenFromBackend,
  onOpenLocalFile,
}: Props) {
  const [items, setItems] = useState<NestingProjectRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [name, setName] = useState(suggestedName)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await nestingProjectsApi.list())
    } catch {
      setItems([])
      toast.error("No se pudo listar proyectos del servidor")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setName(suggestedName)
    void refresh()
  }, [open, suggestedName, refresh])

  async function handleSaveNew() {
    const n = name.trim() || "proyecto-nesting"
    setSaving(true)
    try {
      await onSaveToBackend(n)
      toast.success("Proyecto guardado en el servidor")
      await refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleOverwrite(id: string, fallbackName: string) {
    setBusyId(id)
    try {
      await onSaveToBackend(name.trim() || fallbackName, id)
      toast.success("Proyecto actualizado")
      await refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    } finally {
      setBusyId(null)
    }
  }

  async function handleOpen(id: string) {
    setBusyId(id)
    try {
      await onOpenFromBackend(id)
      toast.success("Proyecto cargado")
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al abrir")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este proyecto del servidor?")) return
    setBusyId(id)
    try {
      await nestingProjectsApi.remove(id)
      toast.success("Proyecto eliminado")
      await refresh()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusyId(null)
    }
  }

  async function handleLocalSave() {
    setSaving(true)
    try {
      await onSaveLocal(name.trim() || "proyecto-nesting")
      toast.success("Archivo descargado")
      onClose()
    } catch {
      toast.error("No se pudo guardar el archivo local")
    } finally {
      setSaving(false)
    }
  }

  function handleLocalFilePick(file: File | undefined) {
    if (!file) return
    void (async () => {
      try {
        await onOpenLocalFile(file)
        toast.success("Proyecto cargado desde archivo")
        onClose()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Archivo inválido")
      }
    })()
  }

  const title = mode === "save" ? "Guardar proyecto" : "Abrir proyecto"
  const Icon = mode === "save" ? Save : FolderOpen

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="large"
        className="flex h-[85vh] max-h-[85vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0 text-foreground shadow-2xl"
      >
        <div className="shrink-0">
          <FormDialogHeader title={title} icon={Icon} />
        </div>

        {mode === "save" && (
          <div className="shrink-0 space-y-3 border-0 px-5 py-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Nombre del proyecto
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-lg border-none bg-foreground/5 px-3 text-sm text-foreground outline-none focus:bg-foreground/10 focus:ring-1 focus:ring-white/20"
                placeholder="proyecto-nesting"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={saving} onClick={() => void handleSaveNew()} className="gap-1.5">
                {saving ? (
                  <Spinner className="h-3.5 w-3.5 text-foreground" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                Guardar en servidor
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void handleLocalSave()} className="gap-1.5 text-muted-foreground">
                {saving ? (
                  <Spinner className="h-3.5 w-3.5 text-foreground" />
                ) : (
                  <HardDrive className="h-3.5 w-3.5" />
                )}
                Descargar .json
              </Button>
            </div>
          </div>
        )}

        {mode === "open" && (
          <div className="shrink-0 border-0 px-5 py-3">
            <label className="group flex cursor-pointer items-center gap-3 rounded-xl bg-foreground/5 p-3 transition-colors hover:bg-foreground/10">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground group-hover:text-foreground">
                <HardDrive size={18} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-foreground">Abrir archivo local</span>
                <span className="truncate text-[11px] text-muted-foreground">.json — ProjectFile v1 o v2</span>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  handleLocalFilePick(e.target.files?.[0])
                  e.target.value = ""
                }}
              />
            </label>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Proyectos en el servidor
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            {loading ? (
              <Spinner className="h-3 w-3 text-muted-foreground" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Actualizar
          </button>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-5 pb-5">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Spinner className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Cargando…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-xs text-muted-foreground">
              <FileJson className="h-8 w-8 opacity-40" />
              No hay proyectos guardados en el servidor.
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => {
                const meta = item.metadata
                const label = meta?.name || item.originalName.replace(/\.json$/i, "") || item.id
                const busy = busyId === item.id
                return (
                  <li key={item.id} className="flex items-center gap-2 rounded-xl bg-foreground/5 p-2.5 transition-colors hover:bg-foreground/5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{label}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {meta
                          ? `${meta.pieceCount} piezas · ${meta.sheetCount} planchas · v${meta.formatVersion}`
                          : item.extension}
                        {" · "}
                        {formatBytes(item.size)}
                        {" · "}
                        {formatDate(item.updatedAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {mode === "open" && (
                        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void handleOpen(item.id)} className="h-8 text-xs">
                          {busy ? <Spinner className="mr-1.5 h-3 w-3 text-muted-foreground" /> : null}
                          Abrir
                        </Button>
                      )}
                      {mode === "save" && (
                        <Button type="button" size="sm" variant="ghost" disabled={busy || saving} onClick={() => void handleOverwrite(item.id, label)} className="h-8 text-xs">
                          {busy ? <Spinner className="mr-1.5 h-3 w-3 text-muted-foreground" /> : null}
                          Sobrescribir
                        </Button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                        title="Eliminar"
                      >
                        {busy ? (
                          <Spinner className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}