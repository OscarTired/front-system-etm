"use client"

import {
  PropsWithChildren,
} from "react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useDragScroll,
} from "./use-drag-scroll"

type Props =
  PropsWithChildren<{
    className?: string
  }>

export function HorizontalScroll({
  children,
  className,
}: Props) {

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  return (

    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        className="hide-scrollbar flex-1 min-h-0 overflow-x-auto overflow-y-hidden overscroll-x-contain cursor-grab select-none scrollbar-none active:cursor-grabbing"
      >

        <div
          className={cn(
            "flex h-full min-h-0 w-max items-start gap-4",
            className,
          )}
        >

          {children}

        </div>

      </div>

    </div>

  )

}