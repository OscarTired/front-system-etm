"use client"

import {
  useRouter,
} from "next/navigation"

import {
  PROCESS_ORDER,
} from "@/features/tasks/constants/process.constants"

import type {
  ProcessCode,
} from "@/features/tasks/types/task.types"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  ENTITY_ICONS,
} from "@/shared/constants/entity-icons"

type Props={
  taskId:string
  route:ProcessCode[]
  currentProcess?:ProcessCode
}

const PROCESS_ENTRIES=
  Object.entries(
    PROCESS_ORDER
  ).sort(
    ([,a],[,b])=>
      a.order-b.order
  )

export function TaskRouteViewer({
  taskId,
  route,
  currentProcess,
}:Props){

  const router=
    useRouter()

  return(

    <div className="flex justify-center">

      <div className="flex flex-wrap justify-center gap-2 pt-5">

        {PROCESS_ENTRIES.map(
          ([code])=>{

            const processCode=
              code as ProcessCode

            const enabled=
              route.includes(
                processCode
              )

            const process=
              PROCESS_DEFINITIONS[
                processCode
              ]

            const Icon=
              ENTITY_ICONS[
                process.icon
              ]

            const isCurrent=
              currentProcess===
              processCode

            return(

              <div
                key={processCode}
                className="relative"
              >

                {isCurrent && (

                  <span
                    className="pointer-events-none absolute -top-4.5 left-1/2 -translate-x-1/2 hidden whitespace-nowrap text-[9px] font-bold uppercase tracking-widest sm:block"
                    style={{
                      color:process.color,
                    }}
                  >

                    Actual

                  </span>

                )}

                <button
                  type="button"
                  disabled={!enabled}
                  onClick={()=>{

                    sessionStorage.setItem(
                      "process-origin-task-id",
                      taskId
                    )

                    router.push(
                      `/processes?code=${processCode}&taskId=${taskId}`
                    )

                  }}
                  className="transition-all duration-200 disabled:pointer-events-none"
                >

                  <DynamicBadge
                    label={processCode}
                    color={process.color}
                    iconComponent={Icon}
                    muted={!enabled}
                    active={isCurrent}
                    pulse={isCurrent}
                    width="process"
                  />

                </button>

              </div>

            )

          }
        )}

      </div>

    </div>

  )

}