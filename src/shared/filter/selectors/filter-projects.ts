import type {
  FilterChip,
} from "../types/filter.types"

import type {
  Project,
} from "@/features/projects/types/project.types"

import {
  matchesGroupedFilters,
} from "./matches-grouped-filters"

type Params={
  projects:Project[]
  filters:FilterChip[]
}

export function filterProjects({
  projects,
  filters,
}:Params){

  if(filters.length===0){
    return projects
  }

  return projects.filter(project=>

    matchesGroupedFilters(filters, filter=>{

      switch(filter.field){

        case"status":

          return(
            project.status?.id===filter.value
          )

        case"stage":

          return(
            project.stage?.id===filter.value
          )

        case"client":

          return(
            project.client?.id===filter.value
          )

        case"pm":

          return(
            project.pm?.id===filter.value
          )

        default:

          return true

      }

    }),

  )

}