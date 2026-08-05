import type { PieceOutline } from "../engine/types"

export function rectOutline(w: number, h: number): PieceOutline {
  return {
    points: [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ],
  }
}

/** Descarga clásica al directorio de Descargas del navegador. */
export function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: { description: string; accept: Record<string, string[]> }[]
}

type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>

function getShowSaveFilePicker(): ShowSaveFilePicker | null {
  if (typeof window === "undefined" || !window.isSecureContext) return null
  const fn = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker
  return typeof fn === "function" ? fn.bind(window) : null
}

/**
 * Guarda un archivo de texto pidiendo ubicación (Chrome/Edge vía File System Access API).
 * Fallback a downloadTextFile en Firefox/Safari o si el usuario cancela.
 */
export async function saveTextFile(
  fileName: string,
  content: string,
  mimeType: string,
  extensions?: string[],
): Promise<"saved" | "downloaded" | "cancelled"> {
  const blob = new Blob([content], { type: mimeType })
  const showSaveFilePicker = getShowSaveFilePicker()

  if (showSaveFilePicker) {
    try {
      const ext =
        extensions ?? (fileName.includes(".") ? ["." + fileName.split(".").pop()!] : [])
      const handle = await showSaveFilePicker({
        suggestedName: fileName,
        types: ext.length
          ? [{ description: "Archivo", accept: { [mimeType]: ext } }]
          : undefined,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return "saved"
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled"
      // Cualquier otro error → fallback
    }
  }

  downloadTextFile(fileName, content, mimeType)
  return "downloaded"
}
