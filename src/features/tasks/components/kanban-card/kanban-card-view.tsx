"use client"

import {
  ENTITY_ICONS,
  type EntityIcon,
} from "@/shared/constants/entity-icons"

import {
  formatDate,
} from "@/shared/utils/date-format"

import {
  getBadgeColors,
} from "@/shared/utils/badge-colors"

import {
  cn,
} from "@/shared/utils/utils"

type Props={

  priorityName?:string

  priorityColor?:string

  deliveryDate?:string | null

  reference:string

  lotNumber?:number

  materialName?:string

  thicknessName?:string

  pieces?:number

  colorName?:string

  colorHex?:string

  stageName?:string

  stageCode?:string

  stageColor?:string

  stageIcon?:EntityIcon

  statusName?:string

  statusColor?:string

  statusIcon?:EntityIcon

  taskNumber?:number

  dragPreview?:boolean

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
  dragPreview=false,

}:Props){

  const StageIcon=
    stageIcon &&
    ENTITY_ICONS[stageIcon]

  const StatusIcon=
    statusIcon &&
    ENTITY_ICONS[statusIcon]

  const isFinalized=
    statusName==="Finalizado"

  const placeholderColor=
    "#64748B"

  const stageBadge=
    getBadgeColors(stageColor ?? "#64748B","subtle")

  const statusBadge=
    getBadgeColors(statusColor ?? "#64748B","subtle")

  return(

    <div
      className={cn(
        "flex h-43.5 w-full flex-col justify-between rounded-xl p-4 transition",
        dragPreview
          ?[
              "pointer-events-none",
              "bg-[#101012]/95",
              "backdrop-blur-xl",
              "scale-[1.03]",
              "rotate-[0.5deg]",
              "border border-white/10",
              "ring-1 ring-white/5",
            ]
          :[
              "bg-white/6",
              "hover:bg-white/10",
            ],
      )}
      style={
        dragPreview
          ?{
              boxShadow:`
                0 40px 120px rgba(0,0,0,.75),
                0 0 60px ${priorityColor ?? placeholderColor}25
              `,
            }
          :undefined
      }
    >

      <div>

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2.5">

            <span className="text-sm font-semibold text-neutral-100">
              #{String(taskNumber??0).padStart(3,"0")}
            </span>

            <span
              className="size-1.5 rounded-full"
              style={{
                backgroundColor:priorityColor,
              }}
            />

            <span
              className="text-sm font-bold uppercase tracking-[0.08em]"
              style={{
                color:priorityColor,
              }}
            >
              {priorityName}
            </span>

          </div>

          <span className="text-sm font-semibold text-neutral-400">
            {formatDate(deliveryDate)}
          </span>

        </div>

        <h4
          title={reference}
          className="mt-2 truncate text-base font-semibold text-neutral-100"
        >

          {reference}

        </h4>

        <div className="mt-2 flex flex-col gap-1">

          <div className="flex flex-wrap items-center gap-1.5 text-sm">

            {lotNumber&&<span>L{lotNumber}</span>}

            <span>•</span>

            <span>{materialName}</span>

            {thicknessName&&<span>{thicknessName}</span>}

            <span>•</span>

            <span>{pieces} PIEZAS</span>

          </div>

          {colorName&&(

            <div className="flex items-center gap-1 text-sm">

              <span
                className="size-3 rounded-full border-2 border-white/10"
                style={{
                  backgroundColor:colorHex,
                }}
              />

              <span>{colorName}</span>

            </div>

          )}

        </div>

      </div>

      <div className="flex items-center justify-between">

        <div className="flex flex-wrap items-center gap-2">

          {!isFinalized&&stageName&&(

            <div
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
              style={{
                color:stageBadge.text,
                backgroundColor:stageBadge.background,
              }}
            >

              {StageIcon&&<StageIcon size={15}/>}

              <span>{stageCode ?? stageName}</span>

            </div>

          )}

          <div
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold"
            style={{
              color:statusBadge.text,
              backgroundColor:statusBadge.background,
            }}
          >

            {StatusIcon&&<StatusIcon size={15}/>}

            <span>{statusName}</span>

          </div>

        </div>

      </div>

    </div>

  )

}