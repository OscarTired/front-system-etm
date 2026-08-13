"use client"

import Link from "next/link"

import {
  cn,
} from "@/shared/utils/utils"

type Props={

  href:string

  children:React.ReactNode

  className?:string

}

export function EntityLink({
  href,
  children,
  className,
}:Props){

  return(

    <Link
      href={href}
      className={cn(
        "transition-colors hover:text-foreground",
        className
      )}
    >

      {children}

    </Link>

  )

}