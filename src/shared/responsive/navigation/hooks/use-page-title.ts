"use client"

import { useEffect } from "react"

import { usePageTitleStore } from "../page-title-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type Options = {
  /** Título corto para topbar móvil (evita "Bitácora d…") */
  mobile?: string
}

export function usePageTitle(title: string, options?: Options) {
  const setTitle = usePageTitleStore(s => s.setTitle)
  const { isMobile } = useResponsive()
  const resolved =
    isMobile && options?.mobile ? options.mobile : title

  useEffect(() => {
    setTitle(resolved)
    return () => setTitle("")
  }, [resolved, setTitle])
}
