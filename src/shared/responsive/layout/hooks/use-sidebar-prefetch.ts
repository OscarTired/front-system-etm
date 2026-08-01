import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { NAVIGATION } from "../sidebar/navigation"

const prefetchedHrefs=
  new Set<string>()

function prefetchHref(
  router:ReturnType<typeof useRouter>,
  href:string,
){

  if(prefetchedHrefs.has(href)){
    return
  }

  prefetchedHrefs.add(href)

  router.prefetch(
    href,
  )

}

export function useSidebarPrefetch(){

  const router=useRouter()

  useEffect(()=>{

    const hrefs=
      new Set<string>()

    for(const section of NAVIGATION){

      for(const item of section.items){

        hrefs.add(
          item.href,
        )

      }

    }

    for(const href of hrefs){

      prefetchHref(
        router,
        href,
      )

    }

  },[router])

  function prefetchOnHover(
    href:string,
  ){

    prefetchHref(
      router,
      href,
    )

  }

  return{
    prefetchOnHover,
  }

}