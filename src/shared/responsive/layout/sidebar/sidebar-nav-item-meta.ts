import type{ReadonlyURLSearchParams}from "next/navigation"

import type{NAVIGATION}from "./navigation"
import type{ProcessCounts}from "../hooks/use-sidebar-counts"

type NavigationItem=(typeof NAVIGATION)[number]["items"][number]

type GetNavItemMetaArgs={
  item:NavigationItem
  pathname:string
  searchParams:ReadonlyURLSearchParams
  projectsCount:number
  activeTasksCount:number
  processCounts:ProcessCounts
}

export function getNavItemMeta({
  item,
  pathname,
  searchParams,
  projectsCount,
  activeTasksCount,
  processCounts,
}:GetNavItemMetaArgs){

  const[itemPath,itemQuery]=
    item.href.split("?")

  const itemCode=
    itemQuery
      ?.split("code=")[1]
      ?.split("&")[0]

  const isActive=
    itemCode
      ?pathname===itemPath&&
       searchParams.get("code")===itemCode
      :pathname===item.href

  const count=
    item.href==="/projects"
      ?projectsCount
      :item.href==="/tasks"
        ?activeTasksCount
        :itemCode==="ct"
          ?processCounts.CT
          :itemCode==="pl"
            ?processCounts.PL
            :itemCode==="sd"
              ?processCounts.SD
              :itemCode==="pt"
                ?processCounts.PT
                :itemCode==="en"
                  ?processCounts.EN
                  :itemCode==="ds"
                    ?processCounts.DS
                    :undefined

  return{
    isActive,
    count,
  }

}