import type {
  WorkflowStatus,
} from "../types/workflow.types"

import type {
  EntityIcon,
} from "@/shared/constants/entity-icons"

export type WorkflowStatusDefinition={
  status:WorkflowStatus
  label:string
  icon:EntityIcon
  color:string
}

export const WORKFLOW_STATUS_DEFINITIONS:
  Record<
    WorkflowStatus,
    WorkflowStatusDefinition
  >={

    QUEUE:{
      status:"QUEUE",
      label:"En cola",
      icon:"clock",
      color:"#64748B",
    },

    PENDING:{
      status:"PENDING",
      label:"Pendiente",
      icon:"clock",
      color:"#1D4ED8",
    },

    PROGRESS:{
      status:"PROGRESS",
      label:"Proceso",
      icon:"clock",
      color:"#F59E0B",
    },

    PAUSED:{
      status:"PAUSED",
      label:"Pausado",
      icon:"pause",
      color:"#DC2626",
    },

    COMPLETED:{
      status:"COMPLETED",
      label:"Completado",
      icon:"check",
      color:"#16A34A",
    },

    REVIEWED:{
      status:"REVIEWED",
      label:"Revisado",
      icon:"inspect",
      color:"#14B8A6",
    },

  }