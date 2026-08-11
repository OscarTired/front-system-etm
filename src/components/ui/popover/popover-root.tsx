"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

import {
  PopoverCloseContext,
  PopoverModeContext,
  PopoverOpenContext,
} from "./contexts"

type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root> & {
  forceFloating?: boolean
  ignoreGlobalClose?: boolean
}

/**
 * Cierra popovers flotantes al scrollear fuera de su contenido.
 * No aplica a sheets (dialog móvil): el scroll interno del sheet debe vivir.
 */
function useCloseOnExternalScroll(
  isOpen: boolean,
  enabled: boolean,
  close: () => void,
) {
  React.useEffect(() => {
    if (!isOpen || !enabled) return

    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) {
        // scroll en document/window
        close()
        return
      }
      if (
        target.closest(
          '[data-slot="popover-content"], [data-slot="popover-sheet"]',
        )
      ) {
        return
      }
      close()
    }

    document.addEventListener("scroll", onScroll, true)
    return () => document.removeEventListener("scroll", onScroll, true)
  }, [isOpen, enabled, close])
}

export function Popover({
  forceFloating = false,
  ignoreGlobalClose = false,
  children,
  onOpenChange,
  open,
  ...props
}: PopoverProps) {
  const { isMobile } = useResponsive()
  const useSheet = isMobile && !forceFloating

  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  const close = React.useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  React.useEffect(() => {
    if (ignoreGlobalClose) return

    const onCloseAll = () => {
      if (isOpen) handleOpenChange(false)
    }

    window.addEventListener("close-all-popovers", onCloseAll)
    return () => window.removeEventListener("close-all-popovers", onCloseAll)
  }, [isOpen, handleOpenChange, ignoreGlobalClose])

  // Solo floating: el sheet tiene scroll propio y no debe cerrarse al listar opciones.
  useCloseOnExternalScroll(
    isOpen,
    !ignoreGlobalClose && !useSheet,
    close,
  )

  if (useSheet) {
    return (
      <PopoverModeContext.Provider value={true}>
        <PopoverOpenContext.Provider value={isOpen}>
          <PopoverCloseContext.Provider value={close}>
            <DialogPrimitive.Root
              open={isOpen}
              onOpenChange={handleOpenChange}
              {...props}
            >
              {children}
            </DialogPrimitive.Root>
          </PopoverCloseContext.Provider>
        </PopoverOpenContext.Provider>
      </PopoverModeContext.Provider>
    )
  }

  return (
    <PopoverModeContext.Provider value={false}>
      <PopoverOpenContext.Provider value={isOpen}>
        <PopoverCloseContext.Provider value={close}>
          <PopoverPrimitive.Root
            data-slot="popover"
            open={isOpen}
            onOpenChange={handleOpenChange}
            {...props}
          >
            {children}
          </PopoverPrimitive.Root>
        </PopoverCloseContext.Provider>
      </PopoverOpenContext.Provider>
    </PopoverModeContext.Provider>
  )
}
