"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { X } from "lucide-react"

import { cn } from "@/shared/utils/utils"

// Mismo patrón que dialog.tsx (mismo primitivo de Radix por
// debajo) — la diferencia real es solo de posicionamiento/anim:
// Dialog centra y escala, Sheet desliza desde el borde derecho y
// ocupa todo el alto. Se separa en su propio archivo en vez de
// agregarle una prop "variant" a Dialog porque Sheet es un patrón
// de uso genuinamente distinto (panel de trabajo persistente, no
// una confirmación/formulario modal puntual).

type SheetProps =
  React.ComponentProps<typeof DialogPrimitive.Root>

type SheetTriggerProps =
  React.ComponentProps<typeof DialogPrimitive.Trigger>

type SheetCloseProps =
  React.ComponentProps<typeof DialogPrimitive.Close>

type SheetContentProps =
  React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean
  }

export function Sheet(props: SheetProps) {
  return <DialogPrimitive.Root {...props} />
}

export function SheetTrigger(props: SheetTriggerProps) {
  return <DialogPrimitive.Trigger {...props} />
}

export function SheetClose(props: SheetCloseProps) {
  return <DialogPrimitive.Close {...props} />
}

export function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {

  return (

    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />

  )

}

export function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: SheetContentProps) {

  return (

    <DialogPrimitive.Portal>

      <SheetOverlay />

      <DialogPrimitive.Content
        onWheel={event => event.stopPropagation()}
        onOpenAutoFocus={event => event.preventDefault()}
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex h-dvh w-full max-w-md flex-col",
          "border-l border-white/8 bg-[#101012] shadow-2xl outline-none select-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          "data-[state=closed]:duration-200 data-[state=open]:duration-300",
          className,
        )}
        {...props}
      >

        {children}

        {showCloseButton && (

          <SheetClose
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </SheetClose>

        )}

      </DialogPrimitive.Content>

    </DialogPrimitive.Portal>

  )

}

export function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {

  return (
    <div
      className={cn("flex shrink-0 flex-col gap-1 border-b border-white/8 px-5 py-4", className)}
      {...props}
    />
  )

}

export function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {

  return (
    <DialogPrimitive.Title
      className={cn("text-base font-bold tracking-wide text-white", className)}
      {...props}
    />
  )

}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {

  return (
    <DialogPrimitive.Description
      className={cn("text-xs text-neutral-500", className)}
      {...props}
    />
  )

}