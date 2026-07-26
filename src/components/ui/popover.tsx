"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import {
  cn,
} from "@/shared/utils/utils"

type PopoverProps =
  React.ComponentProps<
    typeof PopoverPrimitive.Root
  >

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

export function Popover(
  props: PopoverProps
) {

  return (

    <PopoverPrimitive.Root
      data-slot="popover"
      {...props}
    />

  )

}

export function PopoverTrigger({
  className,
  ...props
}: PopoverTriggerProps) {

  return (

    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      className={className}
      {...props}
    />

  )

}

export function PopoverContent({
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  avoidCollisions = true,
  collisionPadding = 12,
  portal = true,
  ...props
}: PopoverContentProps) {

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
    />

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
export function PopoverAnchor(
  props: PopoverAnchorProps
) {

  return (

    <PopoverPrimitive.Anchor
      data-slot="popover-anchor"
      {...props}
    />

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