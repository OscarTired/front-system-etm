"use client"

import {
  PropsWithChildren,
  useMemo,
} from "react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useDragScroll,
} from "./use-drag-scroll"

import {
  useHorizontalFade,
} from "../../hooks/use-horizontal-fade"

import {
  getHorizontalMaskStyle,
} from "./get-horizontal-mask-style"

type Props =
  PropsWithChildren<{
    className?: string
    fade?: boolean
  }>

export function HorizontalScroll({
  children,
  className,
  fade = true,
}: Props) {

  const {
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleClickCapture,
    stopDragging,
  } = useDragScroll()

  const {
    leftFade,
    rightFade,
  } = useHorizontalFade({
    containerRef,
  })

  const maskStyle = useMemo(() => {

    if (!fade) {
      return undefined
    }

    return getHorizontalMaskStyle(leftFade, rightFade)

  }, [
    fade,
    leftFade,
    rightFade,
  ])

  return (

    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={handleClickCapture}
        style={maskStyle}
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