"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

import {
  cn,
} from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

// Un popover flotante (menú que sale pegado al trigger) no es un
// patrón mobile-friendly: en pantallas chicas termina recortado,
// tapado por el teclado, o con el dedo lejos de las opciones. En
// mobile queremos el patrón nativo de iOS/Android: un bottom sheet
// que sube desde abajo con su propio drag handle.
//
// En vez de que cada uno de los ~25 lugares de la app que usan
// <Popover> decida esto por su cuenta, el propio componente cambia
// de primitivo por debajo según el breakpoint: mobile usa
// DialogPrimitive (mismo que Sheet/Dialog) estilado como bottom
// sheet, tablet+ sigue usando PopoverPrimitive tal cual estaba.
// Root/Trigger/Content tienen que ser todos del mismo primitivo (el
// contexto de Radix no es intercambiable entre paquetes), así que
// este modo se guarda en un contexto propio y chico para que los
// tres se pongan de acuerdo.
const PopoverModeContext =
  React.createContext(false)

// Expone el `onOpenChange` del Root al Content, para que el bottom
// sheet pueda cerrarse a sí mismo en respuesta a un gesto de swipe
// (el drag handle vive dentro del Content, no tiene forma de tocar
// el Root directamente salvo por contexto).
const PopoverCloseContext =
  React.createContext<() => void>(() => {})

// Expone el `open` del Root al Content — sin esto, después de
// cerrar arrastrando con el dedo, dragY/dismissing (el estado del
// gesto) quedaban pegados en su último valor (el sheet empujado
// bien afuera de la pantalla) para siempre, porque nada le avisaba
// al Content que el sheet se había vuelto a abrir para resetearlos.
const PopoverOpenContext =
  React.createContext(false)

type PopoverProps =
  React.ComponentProps<
    typeof PopoverPrimitive.Root
  > & {
    // Escape hatch puntual: casos como el autocomplete de menciones
    // (sigue al cursor mientras se escribe, no es un menú que se
    // "abre") no tienen sentido como bottom sheet ni en mobile.
    forceFloating?: boolean
  }

type PopoverTriggerProps =
  React.ComponentProps<
    typeof PopoverPrimitive.Trigger
  >

type PopoverContentProps =
  React.ComponentProps<
    typeof PopoverPrimitive.Content
  > & {
    portal?: boolean
  }

type PopoverAnchorProps =
  React.ComponentProps<
    typeof PopoverPrimitive.Anchor
  >

export function Popover({
  forceFloating = false,
  children,
  ...props
}: PopoverProps) {

  const { isMobile } = useResponsive()

  const useSheet = isMobile && !forceFloating

  if (useSheet) {

    const close = () => props.onOpenChange?.(false)

    return (

      <PopoverModeContext.Provider value={true}>
        <PopoverOpenContext.Provider value={props.open ?? false}>
          <PopoverCloseContext.Provider value={close}>
            <DialogPrimitive.Root {...props}>
              {children}
            </DialogPrimitive.Root>
          </PopoverCloseContext.Provider>
        </PopoverOpenContext.Provider>
      </PopoverModeContext.Provider>

    )
  }

  return (

    <PopoverModeContext.Provider value={false}>
      <PopoverPrimitive.Root
        data-slot="popover"
        {...props}
      >
        {children}
      </PopoverPrimitive.Root>
    </PopoverModeContext.Provider>

  )

}

export function PopoverTrigger({
  className,
  ...props
}: PopoverTriggerProps) {

  const isSheet =
    React.useContext(PopoverModeContext)

  if (isSheet) {
    return (
      <DialogPrimitive.Trigger
        data-slot="popover-trigger"
        className={className}
        {...props}
      />
    )
  }

  return (

    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={className}
      {...props}
    />

  )

}

// Umbral de distancia (px) o velocidad (px/ms) a partir del cual un
// swipe hacia abajo se interpreta como "cerrar" en vez de "soltó a
// mitad de camino, que vuelva a su lugar" — mismos valores que usan
// los bottom sheets nativos de iOS/Android como referencia.
const SHEET_DISMISS_DISTANCE = 90
const SHEET_DISMISS_VELOCITY = 0.5

function useSheetDragToDismiss(close: () => void, isOpen: boolean) {

  const [dragY, setDragY] = React.useState(0)

  // Antes, al soltar más allá del umbral, se llamaba close() Y
  // setDragY(0) en el mismo tick — eso hacía que el transform
  // inline (dragY volviendo a 0, animado) compitiera con la propia
  // animación data-[state=closed] de Radix (slide-out-to-bottom)
  // sobre la MISMA propiedad transform, al mismo tiempo — de ahí la
  // animación "rara"/no fina al arrastrar para cerrar. El fix: al
  // descartar, seguir el MISMO movimiento hacia abajo desde donde
  // quedó el dedo (nunca vuelve a 0), y recién llamar a close()
  // cuando esa animación de salida termina — así solo hay UNA
  // animación de transform en juego en todo momento.
  const [dismissing, setDismissing] = React.useState(false)

  const draggingRef = React.useRef(false)
  const startYRef = React.useRef(0)
  const startTimeRef = React.useRef(0)

  function onPointerDown(event: React.PointerEvent) {
    draggingRef.current = true
    startYRef.current = event.clientY
    startTimeRef.current = performance.now()

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // noop
    }
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!draggingRef.current) return

    // Solo permitimos arrastrar hacia abajo — hacia arriba no tiene
    // a dónde ir, el sheet ya está en su altura máxima.
    const delta = Math.max(0, event.clientY - startYRef.current)
    setDragY(delta)
  }

  function endDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false

    const elapsed = Math.max(performance.now() - startTimeRef.current, 1)
    const velocity = dragY / elapsed

    if (dragY > SHEET_DISMISS_DISTANCE || velocity > SHEET_DISMISS_VELOCITY) {

      // Termina el gesto en la MISMA dirección, bien afuera de la
      // pantalla — nunca vuelve a 0, así no hay ningún salto ni
      // segunda animación compitiendo.
      setDismissing(true)
      setDragY(window.innerHeight)

      // 220ms: un toque más que la transición de 200ms de abajo,
      // para no cortarla a mitad de camino.
      window.setTimeout(close, 220)

      return

    }

    setDragY(0)
  }

  // Sin esto, después de descartar arrastrando (dragY termina en
  // window.innerHeight, dismissing en true — ver endDrag arriba),
  // la próxima vez que se abre el mismo sheet esos valores seguían
  // ahí: el transform inline seguía empujándolo bien afuera de la
  // pantalla, así que "se abría" (el estado open de Radix cambiaba)
  // pero no se veía nada, solo el overlay con blur detrás. Cada vez
  // que isOpen pasa a true, se resetea todo a su estado inicial.
  React.useEffect(() => {

    if (isOpen) {
      setDragY(0)
      setDismissing(false)
    }

  }, [isOpen])

  return {
    dragY,
    isDragging: draggingRef.current,
    dismissing,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }

}

export function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  avoidCollisions = true,
  collisionPadding = 12,
  portal = true,
  children,
  ...props
}: PopoverContentProps) {

  const isSheet =
    React.useContext(PopoverModeContext)

  const close =
    React.useContext(PopoverCloseContext)

  const isOpen =
    React.useContext(PopoverOpenContext)

  const { dragY, isDragging, dismissing, dragHandleProps } =
    useSheetDragToDismiss(close, isOpen)

  if (isSheet) {

    const mobileContentClass =
      isSheet
        ? undefined
        : className

    return (

      <DialogPrimitive.Portal>

        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />

        <DialogPrimitive.Content
          data-drag-scroll-ignore
          onOpenAutoFocus={event => {
            event.preventDefault()
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col",
            "rounded-t-3xl bg-popover shadow-2xl outline-none select-none",
            !dismissing && "data-[state=open]:animate-in data-[state=closed]:animate-out",
            !dismissing && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            !dismissing && "data-[state=closed]:duration-200 data-[state=open]:duration-300",
          )}
          style={{
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: isDragging
              ? "none"
              : dismissing
                ? "transform 200ms cubic-bezier(0.32,0.72,0,1)"
                : "transform 200ms ease-out",
          }}
        >

          <VisuallyHidden asChild>
            <DialogPrimitive.Title>Opciones</DialogPrimitive.Title>
          </VisuallyHidden>

          {/* Drag handle — mismo lenguaje visual que el bottom sheet
              nativo de iOS, ahora también arrastrable: mantiene el
              cierre por tap-afuera (Overlay de Radix) y suma el
              gesto de swipe hacia abajo desde acá. */}
          <div
            {...dragHandleProps}
            className="flex shrink-0 touch-none cursor-grab justify-center pb-1 pt-2.5 active:cursor-grabbing"
          >
            <div className="h-1.5 w-9 rounded-full bg-white/15" />
          </div>

          <div
            onWheel={event => {

              const element =
                event.currentTarget

              const isScrollable =
                element.scrollHeight >
                element.clientHeight

              if (isScrollable) {
                event.stopPropagation()
              }

            }}
            className={cn(
              "flex flex-col gap-2.5 overflow-y-auto overscroll-contain",
              "px-2.5 pt-1 text-sm",
              "pb-[calc(env(safe-area-inset-bottom)+14px)]",
              mobileContentClass,
            )}
            {...props}
          >
            {children}
          </div>

        </DialogPrimitive.Content>

      </DialogPrimitive.Portal>

    )

  }

  const content = (

    <PopoverPrimitive.Content
      // Se renderiza vía Portal fuera del árbol del overlay/scroll,
      // así que necesita su propio marcador para que useDragScroll
      // no le cancele los clicks después de un scroll horizontal.
      data-drag-scroll-ignore
      align={align}
      side={side}
      sideOffset={sideOffset}
      // true por default (el propio default de Radix): así el
      // popover se reposiciona/desliza para entrar en la pantalla
      // cuando no hay espacio de sobra — sin esto, listas largas
      // (ej. un select de Etapa con muchas opciones) se cortaban
      // abajo del viewport sin ninguna forma de llegar a las
      // opciones de más abajo.
      //
      // El caso puntual donde SÍ conviene avoidCollisions={false}
      // (evitar que el teclado virtual, al abrirse/cerrarse, haga
      // flippear el popover de lado y se sienta como un salto) es
      // angosto — algún select pegado a un input de texto en un
      // formulario. Eso lo tiene que pedir explícito el consumidor
      // puntual pasando la prop, no todos los popovers de la app
      // por un default global.
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      onOpenAutoFocus={event => {
        event.preventDefault()
      }}
      onCloseAutoFocus={event => {
        event.preventDefault()
      }}
      onWheel={event => {

        const element =
          event.currentTarget

        const isScrollable =
          element.scrollHeight >
          element.clientHeight

        if (isScrollable) {
          event.stopPropagation()
        }

      }}
      onTouchMove={event => {

        // El popover sale por Portal directo a document.body, como
        // hermano del Dialog (no descendiente). El scroll-lock que
        // Radix Dialog instala globalmente sobre "touchmove" no lo
        // reconoce como parte del árbol permitido y le hace
        // preventDefault, dejando el contenido sin poder scrollear
        // con el dedo en mobile.
        //
        // A diferencia del "onWheel" de arriba, acá no podemos
        // chequear "isScrollable" sobre currentTarget: el scroll
        // real ocurre en un hijo interno (ej. CommandList con
        // overflow-y-auto), no en este wrapper — currentTarget es
        // siempre este nodo exterior, que no tiene overflow propio,
        // así que ese chequeo nunca daría true. Cortamos la
        // propagación siempre; no hay downside si no hay nada para
        // scrollear, simplemente no pasa nada.
        event.stopPropagation()

      }}
      className={cn(
        "z-40",
        "pointer-events-auto",
        "flex",
        "flex-col",
        "gap-2.5",
        "rounded-xl",
        "bg-popover",
        "p-2.5",
        "text-sm",
        "shadow-xl",
        "outline-none",
        // Mismo patrón que ya usa DropdownMenuContent — sin esto el
        // Popover (compartido por TODA la app: filtros, selects, el
        // picker de "Otros" tipos de actividad, Convocar) aparecía y
        // desaparecía de golpe, sin transición.
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-open:animate-in",
        "data-open:fade-in-0",
        "data-open:zoom-in-95",
        "data-closed:animate-out",
        "data-closed:fade-out-0",
        "data-closed:zoom-out-95",
        className
      )}
      {...props}
    >
      {children}
    </PopoverPrimitive.Content>

  )

  if (!portal) {
    return content
  }

  return (

    <PopoverPrimitive.Portal>
      {content}
    </PopoverPrimitive.Portal>

  )

}
export function PopoverAnchor({
  asChild,
  children,
  ...props
}: PopoverAnchorProps) {

  const isSheet =
    React.useContext(PopoverModeContext)

  if (isSheet) {

    // Sin equivalente en un bottom sheet (no hay nada que anclar
    // espacialmente a un punto de la pantalla) — se limita a dejar
    // pasar los children tal cual para no romper el layout del
    // consumidor.
    if (asChild && React.isValidElement(children)) {
      return children
    }

    return (
      <span {...props}>
        {children}
      </span>
    )

  }

  return (

    <PopoverPrimitive.Anchor
      data-slot="popover-anchor"
      asChild={asChild}
      {...props}
    >
      {children}
    </PopoverPrimitive.Anchor>

  )

}

export function PopoverHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {

  return (

    <div
      data-slot="popover-header"
      className={cn(
        "flex flex-col gap-0.5 text-sm",
        className
      )}
      {...props}
    />

  )

}

export function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {

  return (

    <h2
      data-slot="popover-title"
      className={cn(
        "font-medium",
        className
      )}
      {...props}
    />

  )

}

export function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {

  return (

    <p
      data-slot="popover-description"
      className={cn(
        "text-muted-foreground",
        className
      )}
      {...props}
    />

  )

}

export {
  PopoverPrimitive,
}