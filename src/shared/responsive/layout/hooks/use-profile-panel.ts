"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { useManagedOverlay } from "@/shared/stores/hooks/use-managed-overlay"

const SAFE_MARGIN = 16

export function useProfilePanel() {

  const [profileOpen, setProfileOpenState] = useState(false)
  const [canOpenProfile, setCanOpenProfile] = useState(true)
  const [presenceCollapsed, setPresenceCollapsed] = useState(false)

  const { open: overlayOpenForProfile, setOpen: setOverlaySlot } = useManagedOverlay("profile")

  // Wrapper: cualquier lugar que abra el panel de perfil (directo o
  // vía toggleProfile) también reclama el overlay compartido, así
  // Notificaciones/Presencia se cierran solos si estaban abiertos.
  const setProfileOpen = useCallback((next: boolean) => {

    setProfileOpenState(next)
    setOverlaySlot(next)

  }, [setOverlaySlot])

  const [panelHeight, setPanelHeight] = useState(0)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const pendingOpenRef = useRef(false)

  const presenceHeightRef = useRef(0)
  const presenceObserverRef = useRef<ResizeObserver | null>(null)

  const presenceRef = useCallback((node: HTMLDivElement | null) => {

    presenceObserverRef.current?.disconnect()
    presenceObserverRef.current = null

    if (!node) {
      return
    }

    presenceHeightRef.current = node.getBoundingClientRect().height

    const observer = new ResizeObserver(entries => {

      const height = entries[0]?.contentRect.height

      if (height != null) {
        presenceHeightRef.current = height
      }

    })

    observer.observe(node)
    presenceObserverRef.current = observer

  }, [])

  const fitsInViewport = useCallback(() => {

    const container = containerRef.current
    const content = contentRef.current
    const card = cardRef.current

    if (!container || !content || !card) {
      return true
    }

    const aside = container.closest("aside")

    if (!aside) {
      return true
    }

    const asideRect = aside.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()

    const availableHeight =
      cardRect.top -
      asideRect.top -
      SAFE_MARGIN

    const requiredHeight =
      content.getBoundingClientRect().height

    return requiredHeight <= availableHeight

  }, [])

  const closeProfile = useCallback(() => {

    setProfileOpen(false)

    setPresenceCollapsed(false)

  }, [setProfileOpen])

  const update = useCallback(() => {

    const container = containerRef.current
    const card = cardRef.current

    if (!container || !card) {
      return
    }

    const aside = container.closest("aside")

    if (!aside) {
      return
    }

    const asideRect = aside.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const bottomLimit = asideRect.bottom - SAFE_MARGIN

    const baseOverflows = cardRect.bottom > bottomLimit

    if (pendingOpenRef.current) {

      pendingOpenRef.current = false

      const fitsNow = fitsInViewport()

      setCanOpenProfile(fitsNow)

      if (fitsNow) {
        setProfileOpen(true)
      } else {
        setPresenceCollapsed(false)
      }

      return

    }

    const canOpen = fitsInViewport()

    setCanOpenProfile(canOpen)

    if (profileOpen && !canOpen) {
      closeProfile()
    }

  }, [
    fitsInViewport,
    profileOpen,
    presenceCollapsed,
    closeProfile,
  ])

  useEffect(() => {

    if (profileOpen && !overlayOpenForProfile) {
      setProfileOpenState(false)
      setPresenceCollapsed(false)
    }

  }, [overlayOpenForProfile, profileOpen])

  function toggleProfile() {

    if (profileOpen) {
      closeProfile()
      return
    }

    if (fitsInViewport()) {
      setCanOpenProfile(true)
      setProfileOpen(true)
      return
    }

    pendingOpenRef.current = true
    setPresenceCollapsed(true)

  }

  useLayoutEffect(() => {

    update()

  }, [update])

  useEffect(() => {

    const aside =
      containerRef.current?.closest("aside")

    if (!aside) {
      return
    }

    const observer =
      new ResizeObserver(update)

    observer.observe(aside)

    return () => observer.disconnect()

  }, [update])

  useEffect(() => {

    const content = contentRef.current

    if (!content) {
      return
    }

    const observer = new ResizeObserver(entries => {

      const height = entries[0]?.contentRect.height

      if (height != null) {
        setPanelHeight(height)
      }

      update()

    })

    observer.observe(content)

    return () => observer.disconnect()

  }, [update])

  useEffect(() => {

    window.addEventListener("resize", update)

    return () => window.removeEventListener("resize", update)

  }, [update])

  useEffect(() => {

    if (!window.visualViewport) {
      return
    }

    window.visualViewport.addEventListener("resize", update)

    return () => window.visualViewport?.removeEventListener("resize", update)

  }, [update])

  useEffect(() => {

    return () => {
      presenceObserverRef.current?.disconnect()
    }

  }, [])

  useEffect(() => {

    if (!profileOpen) {
      return
    }

    function handlePointerDown(e: PointerEvent) {

      const target = e.target as Node

      // panelRef cubre tanto el panel expandido (que vive dentro de
      // containerRef) como el contenido del Popover colapsado, que
      // Radix monta en un portal fuera de containerRef. Sin este
      // chequeo, un pointerdown dentro del popover (ej. el botón
      // "Editar perfil") se interpreta como click "afuera", cierra
      // el popover en pointerdown, y el click posterior nunca llega
      // a dispararse porque el nodo ya fue desmontado.
      const insideContainer =
        containerRef.current?.contains(target) ?? false

      const insidePanel =
        panelRef.current?.contains(target) ?? false

      if (!insideContainer && !insidePanel) {
        closeProfile()
      }

    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => document.removeEventListener("pointerdown", handlePointerDown)

  }, [profileOpen, closeProfile])

  return {

    profileOpen,
    setProfileOpen,
    toggleProfile,
    canOpenProfile,
    presenceCollapsed,
    presenceRef,
    panelHeight,

    containerRef,
    panelRef,
    contentRef,
    cardRef,

  }

}