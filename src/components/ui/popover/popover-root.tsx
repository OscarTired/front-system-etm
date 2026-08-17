"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Drawer } from "vaul"

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
            <Drawer.Root
              open={isOpen}
              onOpenChange={next => {
                handleOpenChange(next)
                if (!next && typeof document !== "undefined") {

                // Vaul / Radix a veces dejan body con background black,
                // overflow hidden o pointer-events none tras cerrar.
                const unlock = () => {
                  const body = document.body
                  const html = document.documentElement
                  for (const el of [body, html]) {
                    el.style.removeProperty("background")
                    el.style.removeProperty("background-color")
                    el.style.removeProperty("overflow")
                    el.style.removeProperty("pointer-events")
                    el.style.removeProperty("padding-right")
                    el.style.removeProperty("margin-right")
                    el.removeAttribute("data-scroll-locked")
                    el.removeAttribute("data-aria-hidden")
                  }
                  body.style.pointerEvents = ""
                  // Restaurar fondo del tema (nunca black residual)
                  if (!body.style.backgroundColor) {
                    body.style.backgroundColor = "var(--background)"
                  }
                  document
                    .querySelectorAll(
                      "[data-vaul-drawer-wrapper], [vaul-drawer-wrapper]",
                    )
                    .forEach(node => {
                      if (node instanceof HTMLElement) {
                        node.style.removeProperty("transform")
                        node.style.removeProperty("border-radius")
                        node.style.removeProperty("overflow")
                        node.style.removeProperty("background")
                      }
                    })
                }
                requestAnimationFrame(unlock)
                window.setTimeout(unlock, 320)

                }
              }}
              onAnimationEnd={open => {
                if (!open && typeof document !== "undefined") {

                // Vaul / Radix a veces dejan body con background black,
                // overflow hidden o pointer-events none tras cerrar.
                const unlock = () => {
                  const body = document.body
                  const html = document.documentElement
                  for (const el of [body, html]) {
                    el.style.removeProperty("background")
                    el.style.removeProperty("background-color")
                    el.style.removeProperty("overflow")
                    el.style.removeProperty("pointer-events")
                    el.style.removeProperty("padding-right")
                    el.style.removeProperty("margin-right")
                    el.removeAttribute("data-scroll-locked")
                    el.removeAttribute("data-aria-hidden")
                  }
                  body.style.pointerEvents = ""
                  // Restaurar fondo del tema (nunca black residual)
                  if (!body.style.backgroundColor) {
                    body.style.backgroundColor = "var(--background)"
                  }
                  document
                    .querySelectorAll(
                      "[data-vaul-drawer-wrapper], [vaul-drawer-wrapper]",
                    )
                    .forEach(node => {
                      if (node instanceof HTMLElement) {
                        node.style.removeProperty("transform")
                        node.style.removeProperty("border-radius")
                        node.style.removeProperty("overflow")
                        node.style.removeProperty("background")
                      }
                    })
                }
                requestAnimationFrame(unlock)
                window.setTimeout(unlock, 320)

                }
              }}
              dismissible
              shouldScaleBackground={false}
              setBackgroundColorOnScale={false}
              noBodyStyles
              repositionInputs={false}
              modal
            >
              {children}
            </Drawer.Root>
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
