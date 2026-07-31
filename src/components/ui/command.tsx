"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { Search } from "lucide-react"

import { cn } from "@/shared/utils/utils"
import { VerticalScroll } from "@/shared/ui/vertical-scroll/vertical-scroll"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type CommandProps = React.ComponentProps<typeof CommandPrimitive>

type CommandDialogProps = React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  showCloseButton?: boolean
}

type CommandInputProps = React.ComponentProps<typeof CommandPrimitive.Input>

type CommandListProps = React.ComponentProps<typeof CommandPrimitive.List>

type CommandEmptyProps = React.ComponentProps<typeof CommandPrimitive.Empty>

type CommandGroupProps = React.ComponentProps<typeof CommandPrimitive.Group>

type CommandSeparatorProps = React.ComponentProps<typeof CommandPrimitive.Separator>

type CommandItemProps = React.ComponentProps<typeof CommandPrimitive.Item>

export function Command({
  className,
  ...props
}: CommandProps) {
  return (
    <CommandPrimitive
      className={cn(
        "flex flex-col overflow-hidden rounded-xl text-white",
        className
      )}
      {...props}
    />
  )
}

export function CommandDialog({
  title = "Buscar",
  description = "",
  children,
  showCloseButton = false,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent
        className="overflow-hidden p-0"
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function CommandInput({
  className,
  ...props
}: CommandInputProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-3">
      <Search
        size={15}
        className="text-neutral-500"
      />
      <CommandPrimitive.Input
        className={cn(
          "flex-1 bg-transparent text-sm text-neutral-300 outline-none placeholder:text-neutral-600",
          className
        )}
        {...props}
      />
    </div>
  )
}

export const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>(
  (
    {
      className,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <VerticalScroll
        containerClassName="relative overflow-hidden rounded-xl"
        className={cn("hide-scrollbar outline-none", className)}
        style={style}
        arrowTopOffset={4}
        arrowBottomOffset={4}
        arrowAlign="center"
        arrowClassName="bg-[#18181b]/80 backdrop-blur-xl text-neutral-200"
      >
        <CommandPrimitive.List ref={ref} {...props} />
      </VerticalScroll>
    )
  }
)

CommandList.displayName =
  CommandPrimitive.List.displayName

export function CommandEmpty({
  className,
  ...props
}: CommandEmptyProps) {
  return (
    <CommandPrimitive.Empty
      className={cn(
        "py-6 text-center text-sm text-neutral-500",
        className
      )}
      {...props}
    />
  )
}

export function CommandGroup({
  className,
  ...props
}: CommandGroupProps) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "p-0",
        className
      )}
      {...props}
    />
  )
}

export function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  return (
    <CommandPrimitive.Separator
      className={cn(
        "h-px bg-white/10",
        className
      )}
      {...props}
    />
  )
}

export function CommandItem({
  className,
  children,
  ...props
}: CommandItemProps) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer",
        "hover:bg-white/5",
        "data-[disabled=true]:pointer-events-none",
        "data-[disabled=true]:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </CommandPrimitive.Item>
  )
}

export function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "ml-auto text-xs text-neutral-500",
        className
      )}
      {...props}
    />
  )
}