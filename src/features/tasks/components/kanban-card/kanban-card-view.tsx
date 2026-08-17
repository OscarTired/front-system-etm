"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { type EntityIcon } from "@/shared/constants/entity-icons"
import { MessageSquare } from "lucide-react"
import { formatDate } from "@/shared/utils/date-format"
import { EntityChip } from "@/shared/ui/entity-chip/entity-chip"
import { cn } from "@/shared/utils/utils"

type Props = {
  priorityName?: string
  priorityColor?: string
  deliveryDate?: string | null
  reference: string
  lotNumber?: number
  materialName?: string
  thicknessName?: string
  pieces?: number
  colorName?: string
  colorHex?: string
  stageName?: string
  stageCode?: string
  stageColor?: string
  stageIcon?: EntityIcon
  statusName?: string
  statusColor?: string
  statusIcon?: EntityIcon
  taskNumber?: number
  commentCount?: number
  hideCommentBadge?: boolean
  /** Acciones dentro del footer (layout). Compiten por ancho con el status. */
  footerActions?: ReactNode
  dragPreview?: boolean
}

export function KanbanCardView({
  priorityName,
  priorityColor,
  deliveryDate,
  reference,
  lotNumber,
  materialName,
  thicknessName,
  pieces,
  colorName,
  colorHex,
  stageName,
  stageCode,
  stageColor,
  stageIcon,
  statusName,
  statusColor,
  statusIcon,
  taskNumber,
  commentCount = 0,
  hideCommentBadge = false,
  footerActions,
  dragPreview = false,
}: Props) {
  const isFinalized = statusName === "Finalizado"
  const placeholderColor = "#64748B"

  const chipsRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const [statusIconOnly, setStatusIconOnly] = useState(false)
  const hasFooterActions = Boolean(footerActions)

  useLayoutEffect(() => {
    if (!hasFooterActions) {
      setStatusIconOnly(false)
      return
    }
    const chips = chipsRef.current
    const probe = probeRef.current
    if (!chips || !probe) return

    const check = () => {
      const stageW = stageRef.current?.offsetWidth ?? 0
      const gap = stageW > 0 ? 8 : 0
      const available = chips.clientWidth - stageW - gap
      setStatusIconOnly(probe.offsetWidth > available + 0.5)
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(chips)
    return () => ro.disconnect()
  }, [hasFooterActions, statusName, stageName, stageCode])

  return (
    <div
      className={cn(
        "flex h-43.5 w-full flex-col justify-between rounded-xl p-4 transition",
        dragPreview
          ? [
              "pointer-events-none",
              "bg-muted/95",
              "backdrop-blur-xl",
              "scale-[1.03]",
              "rotate-[0.5deg]",
              "border border-border",
              "ring-1 ring-white/5",
            ]
          : ["bg-foreground/5", "hover:bg-foreground/10"],
      )}
      style={
        dragPreview
          ? {
              boxShadow: `
                0 40px 120px rgba(0,0,0,.75),
                0 0 60px ${priorityColor ?? placeholderColor}25
              `,
            }
          : undefined
      }
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-foreground">
              #{String(taskNumber ?? 0).padStart(3, "0")}
            </span>
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: priorityColor }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: priorityColor }}
            >
              {priorityName}
            </span>
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">
              {formatDate(deliveryDate)}
            </span>
            {!hideCommentBadge && commentCount > 0 && (
              <span
                title={
                  commentCount === 1
                    ? "1 mensaje"
                    : `${commentCount} mensajes`
                }
                className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 text-[10px] font-semibold tabular-nums text-sky-700 dark:text-sky-300"
              >
                <MessageSquare size={10} strokeWidth={2.5} />
                {commentCount}
              </span>
            )}
          </span>
        </div>

        <h4
          title={reference}
          className="mt-2 truncate text-base font-semibold text-foreground"
        >
          {reference}
        </h4>

        <div className="mt-2 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            {lotNumber && <span>L{lotNumber}</span>}
            <span>•</span>
            <span>{materialName}</span>
            {thicknessName && <span>{thicknessName}</span>}
            <span>•</span>
            <span>{pieces} PIEZAS</span>
          </div>
          {colorName && (
            <div className="flex items-center gap-1 text-sm">
              <span
                className="size-3 rounded-full border-2 border-border"
                style={{ backgroundColor: colorHex }}
              />
              <span>{colorName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <div
          ref={chipsRef}
          className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
        >
          {!isFinalized && stageName && (
            <div ref={stageRef} className="shrink-0">
              <EntityChip
                label={stageCode ?? stageName}
                color={stageColor}
                icon={stageIcon}
              />
            </div>
          )}
          <EntityChip
            label={statusName ?? ""}
            color={statusColor}
            icon={statusIcon}
            iconOnly
          />
          {hasFooterActions && (
            <div
              ref={probeRef}
              className="pointer-events-none absolute -z-10 opacity-0"
              aria-hidden
            >
              <EntityChip
                label={statusName ?? ""}
                color={statusColor}
                icon={statusIcon}
              />
            </div>
          )}
        </div>
        {footerActions ? (
          <div className="flex shrink-0 items-center gap-1">{footerActions}</div>
        ) : null}
      </div>
    </div>
  )
}
