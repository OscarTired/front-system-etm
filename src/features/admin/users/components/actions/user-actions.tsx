"use client"

import {
  useState,
} from "react"

import {
  Plus,
} from "lucide-react"

import {
  PermissionCode,
} from "@/shared/core/enums/permission-code.enum"

import {
  usePermissions,
} from "@/features/permissions/hooks/use-permissions"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  cn,
} from "@/shared/utils/utils"

import {
  UserDialog,
} from "../dialog/user-dialog"

export function UserActions(){

  const[
    open,
    setOpen,
  ]=useState(false)

  const{
    isMobile,
  }=
    useResponsive()

  const{
    has,
  }=
    usePermissions()

  const canCreate=
    has(
      PermissionCode.USER_CREATE,
    )

  function handleOpen(){

    if(!canCreate){
      return
    }

    setOpen(true)

  }

  return(

    <>

      {isMobile ? (

        <button
          type="button"
          disabled={!canCreate}
          onClick={handleOpen}
          aria-label="Nuevo usuario"
          className={cn(
            "fixed bottom-20 right-4 z-30 flex size-12 items-center justify-center rounded-full transition duration-200",
            canCreate
              ? [
                  "bg-white text-black",
                  "hover:scale-105 hover:bg-neutral-100 active:scale-95",
                  "shadow-[0_12px_32px_rgba(0,0,0,0.55),0_4px_10px_rgba(255,255,255,0.08)]",
                ].join(" ")
              : "cursor-not-allowed bg-white/10 text-white/35 shadow-none",
          )}
        >

          <Plus
            size={20}
            strokeWidth={2.5}
          />

        </button>

      ) : (

        <div className="h-10 w-38" aria-hidden />

      )}

      {open&&(

        <UserDialog

          open={open}

          onClose={()=>
            setOpen(false)
          }

        />

      )}

    </>

  )

}