import type {
  FilterChip,
} from "../types/filter.types"

import type {
  ProcessTask,
} from "@/features/processes/types/process.types"

import {
  matchesGroupedFilters,
} from "./matches-grouped-filters"

type Params = {

  processTasks: ProcessTask[]

  filters: FilterChip[]

}

export function filterProcess({

  processTasks,

  filters,

}: Params) {

  if (
    filters.length === 0
  ) {

    return processTasks

  }

  return processTasks.filter(
    processTask =>

      matchesGroupedFilters(filters, filter => {

        switch (
          filter.field
        ) {

          case "status":

            return (
              processTask.workflowStep?.status ===
              filter.value
            )

          case "stage":

            return (
              processTask.workflowStep?.processCode ===
              filter.value
            )

          case "priority":

            return (
              processTask.task.priority.id ===
              filter.value
            )

          case "client":

            return (
              processTask.task.project.client.id ===
              filter.value
            )

          case "operator":

            return (
              processTask.workflowStep?.operator?.id ===
              filter.value
            )

          default:

            return true

        }

      }),

  )

}