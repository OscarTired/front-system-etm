"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Drawer } from "vaul"
import { usePathname } from "next/navigation"

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

function unlockSheetArtifacts() {
  if (typeof document === "undefined") return
  const body = document.body
  const html = document.documentElement
  for (const el of [body, html]) {
    el.style.removeProperty("background")
    el.style.removeProperty("background-color")
    el.style.removeProperty("overflow")
    el.style.removeProperty("pointer-events")
    el.style.removeProperty("padding-right")
    el.style.removeProperty("margin-right")
    el.style.removeProperty("position")
    el.style.removeProperty("top")
    el.style.removeProperty("left")
    el.style.removeProperty("width")
    el.style.removeProperty("height")
    el.removeAttribute("data-scroll-locked")
    el.removeAttribute("data-aria-hidden")
    el.removeAttribute("inert")
  }
  body.style.pointerEvents = ""
  body.style.backgroundColor = "var(--background)"
  document
    .querySelectorAll("[data-vaul-drawer-wrapper], [vaul-drawer-wrapper]")
    .forEach(node => {
      if (node instanceof HTMLElement) {
        node.style.removeProperty("transform")
        node.style.removeProperty("border-radius")
        node.style.removeProperty("overflow")
        node.style.removeProperty("background")
        node.style.removeProperty("background-color")
        node.style.removeProperty("filter")
        node.style.removeProperty("transition")
      }
    })
  document.querySelectorAll("[aria-hidden='true']").forEach(node => {
    if (!(node instanceof HTMLElement)) return
    if (node.closest("[data-slot='popover-sheet'], [data-vaul-drawer]")) return
    if (node.hasAttribute("data-keep-aria-hidden")) return
    if (
      node === body ||
      node.id === "__next" ||
      node.hasAttribute("data-vaul-drawer-wrapper") ||
      node.getAttribute("data-aria-hidden") === "true"
    ) {
      node.removeAttribute("aria-hidden")
      node.removeAttribute("data-aria-hidden")
      node.removeAttribute("inert")
    }
  })
  document.querySelectorAll("[data-vaul-overlay]").forEach(node => {
    if (node instanceof HTMLElement && node.dataset.state === "closed") {
      node.style.pointerEvents = "none"
    }
  })
}

function armGhostClickShield(ms = 400) {
  if (typeof document === "undefined") return
  const existing = document.getElementById("etm-ghost-click-shield")
  if (existing) existing.remove()
  const shield = document.createElement("div")
  shield.id = "etm-ghost-click-shield"
  shield.setAttribute("aria-hidden", "true")
  Object.assign(shield.style, {
    position: "fixed",
    inset: "0",
    zIndex: "9999",
    pointerEvents: "auto",
    background: "transparent",
    touchAction: "none",
  })
  const block = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  shield.addEventListener("pointerdown", block, true)
  shield.addEventListener("pointerup", block, true)
  shield.addEventListener("click", block, true)
  document.body.appendChild(shield)
  window.setTimeout(() => shield.remove(), ms)
}

function scheduleUnlock() {
  unlockSheetArtifacts()
  armGhostClickShield(400)
  requestAnimationFrame(unlockSheetArtifacts)
  window.setTimeout(unlockSheetArtifacts, 50)
  window.setTimeout(unlockSheetArtifacts, 320)
  window.setTimeout(unlockSheetArtifacts, 500)
}

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
  const pathname = usePathname()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen) scheduleUnlock()
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

  React.useEffect(() => {
    if (isOpen) handleOpenChange(false)
    scheduleUnlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    return () => {
      scheduleUnlock()
    }
  }, [])

  useCloseOnExternalScroll(isOpen, !ignoreGlobalClose && !useSheet, close)

  if (useSheet) {
    return (
      <PopoverModeContext.Provider value={true}>
        <PopoverOpenContext.Provider value={isOpen}>
          <PopoverCloseContext.Provider value={close}>
            <Drawer.Root
              open={isOpen}
              onOpenChange={next => {
                handleOpenChange(next)
              }}
              onAnimationEnd={open => {
                if (!open) scheduleUnlock()
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
