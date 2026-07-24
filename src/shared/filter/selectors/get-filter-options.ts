import type {
  FilterField,
  FilterModule,
  FilterOption,
} from "../types/filter.types"

import type {
  Client,
} from "@/features/clients/types/client.types"

import type {
  Priority,
} from "@/features/priorities/types/priority.types"

import type {
  Stage,
} from "@/features/stages/types/stage.types"

import type {
  Status,
} from "@/features/statuses/types/status.types"

import type {
  User,
} from "@/features/users/types/user.types"

import {
  PROCESS_DEFINITIONS,
} from "@/features/processes/constants/process-definitions"

import {
  isProjectManager,
} from "@/features/users/utils/is-project-manager"

import {
  WORKFLOW_STATUS_DEFINITIONS,
} from "@/features/workflow/constants/workflow-status-definitions"

type Params = {

  module:FilterModule

  field:FilterField

  clients:Client[]

  priorities:Priority[]

  stages:Stage[]

  statuses:Status[]

  users:User[]

}

export function getFilterOptions({

  module,

  field,

  clients,

  priorities,

  stages,

  statuses,

  users,

}:Params):FilterOption[]{

  switch(field){

    case "status":

      if(module==="projects"){

        return statuses.map(
          item=>({

            value:item.id,

            label:item.name,

            color:item.color,

            icon:item.icon,

          }),
        )

      }

      return Object.values(
        WORKFLOW_STATUS_DEFINITIONS,
      ).map(
        status=>({

          value:status.status,

          label:status.label,

          color:status.color,

          icon:status.icon,

        }),
      )

    case "stage":

      if(module==="projects"){

        return stages.map(
          item=>({

            value:item.id,

            label:item.name,

            color:item.color,

            icon:item.icon,

          }),
        )

      }

      return Object.values(
        PROCESS_DEFINITIONS,
      ).map(
        process=>({

          value:process.code,

          label:process.label,

          color:process.color,

          icon:process.icon,

        }),
      )

    case "priority":

      return priorities.map(
        item=>({

          value:item.id,

          label:item.name,

          color:item.color,

          icon:item.icon,

        }),
      )

    case "client":

      return clients.map(
        item=>({

          value:item.id,

          label:item.name,

          color:item.color,

          icon:item.icon,

        }),
      )

    case "operator":

      return users
        .filter(
          user=>
            user.role.code==="PRODUCCION" && user.level==="OPERARIO",
        )
        .map(
          item=>({

            value:item.id,

            label:item.name,

            color:item.color,

            icon:item.icon,

          }),
        )

    case "pm":

      return users
        .filter(
          isProjectManager,
        )
        .map(
          item=>({

            value:item.id,

            label:item.name,

            color:item.color,

            icon:item.icon,

          }),
        )

    default:

      return []

  }

}