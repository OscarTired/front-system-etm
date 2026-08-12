"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { X } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { useResponsive } from "@/shared/responsive/hooks/use-responsive"

type DialogProps =
  React.ComponentProps<
    typeof DialogPrimitive.Root
  >

type DialogTriggerProps =
  React.ComponentProps<
    typeof DialogPrimitive.Trigger
  >

type DialogCloseProps =
  React.ComponentProps<
    typeof DialogPrimitive.Close
  >

type DialogPortalProps =
  React.ComponentProps<
    typeof DialogPrimitive.Portal
  >

type DialogOverlayProps =
  React.ComponentProps<
    typeof DialogPrimitive.Overlay
  >

type DialogContentProps =
  React.ComponentProps<
    typeof DialogPrimitive.Content
  > & {
    showCloseButton?: boolean
    // "default": diálogo centrado, sin cambios entre breakpoints
    // (usado por confirmaciones chicas como ActionDialog).
    // "large": formularios grandes (Nueva tarea, Editar perfil,
    // Nuevo usuario) — en mobile se vuelve pantalla completa
    // (edge-to-edge, sin esquinas redondeadas); en desktop se
    // comporta exactamente igual que "default" más el ancho que
    // el propio consumidor defina vía className.
    size?: "default" | "large"
  }

export function Dialog({
  onOpenChange,
  open,
  ...props
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  // Disparar evento global para cerrar popovers cuando se abre un diálogo
  React.useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent("close-all-popovers"))
    }
  }, [isOpen])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  )
}

export function DialogTrigger(
  props: DialogTriggerProps
) {

  return (
    <DialogPrimitive.Trigger
      {...props}
    />
  )

}

export function DialogClose(
  props: DialogCloseProps
) {

  return (
    <DialogPrimitive.Close
      {...props}
    />
  )

}

export function DialogPortal(
  props: DialogPortalProps
) {

  return (
    <DialogPrimitive.Portal
      {...props}
    />
  )

}

export function DialogOverlay({
  className,
  ...props
}: DialogOverlayProps) {

  return (

    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-40",
        "bg-black/50",
        "backdrop-blur-sm",
        className
      )}
      {...props}
    />

  )

}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "default",
  ...props
}: DialogContentProps) {

  const { isMobile } = useResponsive()

  const isFullscreenMobile =
    size === "large" && isMobile

  return (

    <DialogPortal>

      <DialogOverlay />

      <DialogPrimitive.Content
        onWheel={event=>
          event.stopPropagation()
        }
        onOpenAutoFocus={event => {
          event.preventDefault()
        }}
        className={cn(
          "fixed",
          "left-1/2",
          "top-1/2",
          "z-40",
          "w-full",
          "max-w-lg",
          "max-h-[90vh]",
          "-translate-x-1/2",
          "-translate-y-1/2",
          "overflow-hidden",
          "overscroll-contain",
          "rounded-2xl",
          "bg-[#171717]",
          "p-6",
          "shadow-2xl",
          "outline-none",
          "select-none",
          className,
          // Override de pantalla completa: se coloca AL FINAL a
          // propósito — tailwind-merge resuelve conflictos de
          // utilidades quedándose con la última, así que esto
          // siempre gana sobre el className que pase FormDialog
          // (ej. w-180 max-w-180) o cualquier otro consumidor,
          // sin que cada uno tenga que saber de responsive.
          isFullscreenMobile && [
            "inset-0",
            "left-0",
            "top-0",
            "w-screen",
            "h-dvh",
            "max-w-none",
            "max-h-none",
            "translate-x-0",
            "translate-y-0",
            "rounded-none",
            "border-0",
          ],
        )}
      >

        {children}

        {showCloseButton && (

          <DialogClose
            className={cn(
              "absolute",
              "right-3",
              "top-3",
              "z-10",
              "flex",
              "h-7",
              "w-7",
              "items-center",
              "justify-center",
              "rounded-lg",
              "text-neutral-400",
              "transition-colors",
              "hover:bg-white/5",
              "hover:text-white",
              isFullscreenMobile && "h-9 w-9 bg-white/5",
            )}
          >

            <X size={isFullscreenMobile ? 18 : 16} />

          </DialogClose>

        )}

      </DialogPrimitive.Content>

    </DialogPortal>

  )

}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {

  return (

    <div
      className={cn(
        "flex flex-col gap-2",
        className
      )}
      {...props}
    />

  )

}

type DialogFooterProps =
  React.ComponentProps<"div">

export function DialogFooter({
  className,
  children,
  ...props
}: DialogFooterProps) {

  return (

    <div
      className={cn(
        "mt-6",
        "flex",
        "justify-end",
        "gap-2",
        className
      )}
      {...props}
    >

      {children}

    </div>

  )

}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<
  typeof DialogPrimitive.Title
>) {

  return (

    <DialogPrimitive.Title
      className={cn(
        "text-lg",
        "font-semibold",
        "text-white",
        className
      )}
      {...props}
    />

  )

}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<
  typeof DialogPrimitive.Description
>) {

  return (

    <DialogPrimitive.Description
      className={cn(
        "text-sm",
        "text-neutral-400",
        className
      )}
      {...props}
    />

  )

}