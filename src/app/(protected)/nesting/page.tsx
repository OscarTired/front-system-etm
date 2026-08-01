"use client"

import { NestingPage as NestingWorkspace } from "@/features/nesting/components/nesting-page"
import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"

// A propósito NO usa el layout estándar de página (header + padding)
// que usan el resto de las páginas del ERP: este módulo es un
// workspace tipo CAD/CAM (toolbar propio + 3 columnas fijas), no un
// formulario con contenido debajo.
//
// `h-full` acá SÍ resuelve correctamente: AppShell pone `h-screen` en
// <main>, y {children} (esto) vive dentro de un wrapper con
// `min-h-0 flex-1` (ver app-shell.tsx) — la cadena de altura está
// acotada de verdad, no hace falta position:fixed ni inventar
// variables CSS.
export default function NestingRoute() {
  usePageTitle("Nesting")

  return (
    <div className="h-full min-h-180">
      <NestingWorkspace />
    </div>
  )
}