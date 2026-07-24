// app-shell.tsx
"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { AppSidebar } from "./app-sidebar"
import { SidebarShowButton } from "./sidebar-show-button"
import { useSidebarStore } from "@/shared/stores/sidebar-store"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { useMobileNavStore } from "@/shared/responsive/navigation/mobile-nav-store"
import { SidebarDrawer } from "@/shared/responsive/mobile/sidebar-drawer"
import { TopBar } from "@/shared/responsive/mobile/top-bar"
import { BottomNavigation } from "../mobile/bottom-navigation"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

type Props = {
  children: ReactNode
}

function DesktopTopBar() {

  return (

    <div className="flex h-12 shrink-0 items-center px-3">

      <SidebarShowButton />

    </div>

  )

}

const CURVE_RADIUS = 28

// Antes esto se hacía con clip-path: inset(... round Npx), pero
// clip-path con "round" tiene un bug conocido en navegadores basados
// en Chromium: a zoom de página != 100% el radio se rasteriza mal y
// la curva se ve cuadrada. border-radius no sufre ese bug (el
// navegador lo trata como una propiedad geométrica normal del box,
// no como una máscara rasterizada) y anima igual de bien. El <main>
// ya tiene overflow-hidden, así que el border-radius recorta el
// contenido exactamente como lo hacía el clip-path.
const CURVE_ROUNDED = `${CURVE_RADIUS}px 0px 0px ${CURVE_RADIUS}px`
const CURVE_SQUARE = "0px 0px 0px 0px"

const TRANSITION_TIMING = "300ms cubic-bezier(.22,1,.36,1)"

type ContentTransitionProperty = "margin-left" | "transform"

function buildContentTransitionBase(
  property: ContentTransitionProperty,
) {
  return `${property} ${TRANSITION_TIMING}`
}

function buildContentTransitionWithClip(
  property: ContentTransitionProperty,
) {
  return `${buildContentTransitionBase(property)}, border-radius ${TRANSITION_TIMING}`
}

const SIDEBAR_OPEN_WIDTH = 248
const SIDEBAR_COLLAPSED_WIDTH = 72

function DesktopShell({ children }: Props) {

  const lastVisibleMode = useSidebarStore(state => state.lastVisibleMode)
  const visualState = useSidebarStore(state => state.visualState)
  const notifyContentTransitionEnd = useSidebarStore(
    state => state.notifyContentTransitionEnd,
  )
  const notifyClipTransitionEnd = useSidebarStore(
    state => state.notifyClipTransitionEnd,
  )

  const CONTENT_TRANSITION_BASE = buildContentTransitionBase("margin-left")
  const CONTENT_TRANSITION_WITH_CLIP = buildContentTransitionWithClip("margin-left")

  const borderRadius =
    visualState === "hidden" || visualState === "curve-closing"
      ? CURVE_SQUARE
      : CURVE_ROUNDED

  const contentTransition =
    visualState === "curve-closing"
      ? CONTENT_TRANSITION_WITH_CLIP
      : CONTENT_TRANSITION_BASE

  const targetOffset =
    lastVisibleMode === "open"
      ? SIDEBAR_OPEN_WIDTH
      : SIDEBAR_COLLAPSED_WIDTH

  const offset =
    visualState === "visible" || visualState === "moving-in"
      ? targetOffset
      : 0

  const handleTransitionEnd = (
    event: React.TransitionEvent<HTMLElement>,
  ) => {

    if (event.target !== event.currentTarget) return

    if (event.propertyName === "margin-left") {
      notifyContentTransitionEnd()
      return
    }

    // Fin de FASE 2: la curva terminó de cerrarse.
    if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }

  }

  return (

    <div className="relative h-screen overflow-hidden bg-[#1d1c1c] text-white">

      <AppSidebar />

      <main
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-screen min-w-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          marginLeft: offset,
          borderRadius,
          transition: contentTransition,
        }}
      >

        <DesktopTopBar />

        <div className="hide-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

          {children}

        </div>

      </main>

    </div>

  )

}

const DRAWER_REVEAL_OFFSET = 248

// Umbral de arrastre para decidir qué hacer al soltar: si quedó
// por debajo de este % del ancho revelado, se termina de cerrar;
// si no, vuelve a abrirse del todo. 0.6 = hay que arrastrar más de
// la mitad del camino para que "gane" el cierre.
const CLOSE_THRESHOLD_RATIO = 0.6

// Cuánto movimiento (px) hace falta antes de decidir si el gesto
// es horizontal (cerrar el drawer) o vertical (dejar que la lista
// de abajo scrollee normal, sin interferir).
const DIRECTION_LOCK_THRESHOLD = 6

function CompactShell({ children }: Props) {
  const visualState = useMobileNavStore(s => s.visualState)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)
  const notifyContentTransitionEnd = useMobileNavStore(s => s.notifyContentTransitionEnd)
  const notifyClipTransitionEnd = useMobileNavStore(s => s.notifyClipTransitionEnd)

  const targetOffset = DRAWER_REVEAL_OFFSET
  const stateOffset = visualState === "visible" || visualState === "moving-in" ? targetOffset : 0

  const contentRef = useRef<HTMLDivElement>(null)

  // Mientras el dedo está arrastrando, este valor pisa al offset
  // que vendría del estado (stateOffset) para que el panel siga el
  // dedo 1:1, sin la transición de 300ms de por medio (eso se
  // aplica recién al soltar, animando desde donde quedó). El ref
  // guarda el mismo valor para poder leerlo de forma síncrona en
  // touchend sin depender de un closure potencialmente desactualizado
  // (el efecto de abajo no se re-crea en cada frame de arrastre).
  const [dragOffset, setDragOffset] = useState<number | null>(null)
  const dragOffsetRef = useRef<number | null>(null)

  // Evita que el "click" sintético que el navegador dispara justo
  // después de un touchend de arrastre también dispare el
  // onClickCapture de "tocar afuera para cerrar" de más abajo,
  // pisando el snap-back a abierto que acabamos de decidir.
  const suppressClickRef = useRef(false)

  useEffect(() => {

    const el = contentRef.current

    if (!el) {
      return
    }

    // Estado del gesto en curso. Vive en un ref (no en React state)
    // porque touchmove dispara muy seguido y no necesitamos
    // re-renderizar por esto, solo por dragOffset.
    let drag: {
      startX: number
      startY: number
      direction: "horizontal" | "vertical" | null
      dragged: boolean
    } | null = null

    const handleTouchStart = (event: TouchEvent) => {

      // Solo tiene sentido arrastrar para CERRAR cuando el drawer
      // ya está completamente abierto. Mientras se abre/cierra
      // (moving-in, moving-out, curve-closing) dejamos que termine
      // su propia animación tranquila.
      if (visualState !== "visible") {
        return
      }

      const touch = event.touches[0]

      drag = {
        startX: touch.clientX,
        startY: touch.clientY,
        direction: null,
        dragged: false,
      }

    }

    const handleTouchMove = (event: TouchEvent) => {

      if (!drag) {
        return
      }

      const touch = event.touches[0]

      const deltaX = touch.clientX - drag.startX
      const deltaY = touch.clientY - drag.startY

      if (drag.direction === null) {

        if (
          Math.abs(deltaX) < DIRECTION_LOCK_THRESHOLD &&
          Math.abs(deltaY) < DIRECTION_LOCK_THRESHOLD
        ) {
          return
        }

        drag.direction =
          Math.abs(deltaX) > Math.abs(deltaY)
            ? "horizontal"
            : "vertical"

        if (drag.direction === "vertical") {
          // Es un scroll vertical de la página, no un gesto para
          // cerrar el drawer — soltamos el seguimiento y dejamos
          // que el navegador scrollee como siempre.
          drag = null
          return
        }

      }

      // Solo nos importa arrastrar hacia la IZQUIERDA (cerrar). Un
      // arrastre hacia la derecha no hace nada (ya está abierto del
      // todo, no hay más para revelar).
      const nextOffset = Math.min(
        DRAWER_REVEAL_OFFSET,
        Math.max(0, DRAWER_REVEAL_OFFSET + deltaX),
      )

      drag.dragged = true

      dragOffsetRef.current = nextOffset
      setDragOffset(nextOffset)

      // Necesitamos preventDefault para que el navegador no intente
      // además scrollear/hacer bounce mientras arrastramos — por
      // eso este listener se agrega manual con passive:false más
      // abajo, en vez de depender del onTouchMove sintético de
      // React (que en touchmove viene passive por defecto y no
      // puede prevenir nada).
      event.preventDefault()

    }

    const handleTouchEnd = () => {

      if (!drag || !drag.dragged) {
        drag = null
        return
      }

      const finalOffset =
        dragOffsetRef.current ?? DRAWER_REVEAL_OFFSET

      const closeThreshold =
        DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO

      suppressClickRef.current = true

      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 300)

      dragOffsetRef.current = null
      setDragOffset(null)

      // Con el pisado manual ya suelto, si se cerró el estado pasa
      // a "moving-out" (offset objetivo 0); si no, sigue "visible"
      // (offset objetivo DRAWER_REVEAL_OFFSET) — ambos casos animan
      // con la transición normal desde donde quedó el dedo.
      if (finalOffset < closeThreshold) {
        closeDrawer()
      }

      drag = null

    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {

      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
      el.removeEventListener("touchcancel", handleTouchEnd)

    }

  }, [visualState, closeDrawer])

  const isDragging = dragOffset !== null
  const offset = isDragging ? dragOffset : stateOffset

  // Mantenemos la lógica de transición, pero forzamos un orden de ejecución CSS
  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    
    // IMPORTANTE: Solo escuchamos la propiedad específica para no disparar dos veces
    if (event.propertyName === "transform") {
      notifyContentTransitionEnd()
    } else if (event.propertyName === "border-radius") {
      notifyClipTransitionEnd()
    }
  }

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />
      <div
        ref={contentRef}
        onTransitionEnd={handleTransitionEnd}
        className="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050505]"
        style={{
          transform: `translateX(${offset}px)`,
          borderRadius: visualState === "hidden" || visualState === "curve-closing" ? CURVE_SQUARE : CURVE_ROUNDED,
          // Mientras se arrastra con el dedo, sin transición — tiene
          // que seguir al dedo en tiempo real. Al soltar (isDragging
          // pasa a false), vuelve la transición normal para animar
          // suave desde donde quedó hasta el destino final.
          transition: isDragging
            ? "none"
            : "transform 300ms cubic-bezier(.22,1,.36,1), border-radius 300ms cubic-bezier(.22,1,.36,1)",
        }}
        onClickCapture={
          // OJO: este div envuelve también el TopBar (con el botón
          // hamburguesa). Por eso este handler de "tocar afuera para
          // cerrar" solo debe activarse cuando el drawer está
          // realmente asentado y abierto ("visible"). Si se activara
          // también durante "moving-out"/"curve-closing" (mientras
          // anima su cierre), un segundo toque rápido sobre la
          // hamburguesa quedaría atrapado acá (preventDefault +
          // stopPropagation) y nunca llegaría al onClick real del
          // botón — el usuario sentiría que "el primer toque no
          // abre" hasta que termine la animación de cierre.
          visualState === "visible"
            ? (event) => {
                event.preventDefault()
                event.stopPropagation()

                if (suppressClickRef.current) {
                  suppressClickRef.current = false
                  return
                }

                closeDrawer()
              }
            : undefined
        }
      >
        {/* TopBar/BottomNav flotan ENCIMA con position:absolute — no
            adentro del área que scrollea (ahí adentro, la máscara de
            fade de VerticalScroll las desvanecería según el scroll,
            que está mal, tienen que quedar siempre visibles), y no
            como hermanos flex empujando contenido (eso hacía que el
            bottom nav se "moviera" con poco contenido en vez de
            quedar siempre pegado abajo). VerticalScroll ocupa TODO
            el alto — su padding interno (abajo, en className) deja
            lugar para que el último contenido no quede tapado. */}
        <TopBar />

        <VerticalScroll
          containerClassName="h-full"
          className="overflow-x-hidden pt-14 pb-20"
          arrowTopOffset={64}
          arrowBottomOffset={88}
        >
          {children}
        </VerticalScroll>

        <BottomNavigation />
      </div>
    </div>
  )
}


export function AppShell({ children }: Props) {

  const { isMobile, ready } = useResponsive()

  // Antes de la primera medición real (matchMedia), `isMobile`
  // solo refleja la adivinanza por User-Agent del server — puede
  // estar mal (ventana de desktop angosta, tablet en landscape,
  // etc.), y como Compact/DesktopShell son árboles completamente
  // distintos (sidebar vs. bottom nav), adivinar mal se veía como
  // un parpadeo de todo el shell apenas hidrataba. Se muestra un
  // frame en blanco (mismo fondo, sin contenido) en vez de eso —
  // dura lo mismo que tardaba el salto, pero sin el flash de un
  // layout completo por otro.
  if (!ready) {
    return <div className="h-full bg-[#050505]" />
  }

  if (isMobile) {
    return (
      <CompactShell>
        {children}
      </CompactShell>
    )
  }


  return (
    <DesktopShell>
      {children}
    </DesktopShell>
  )

}