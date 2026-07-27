"use client"

import type {
  EntityColumn,
} from "@/shared/ui/entity-table"

import {
  DynamicBadge,
} from "@/shared/ui/badge/dynamic-badge"

import {
  TABLE_WIDTHS,
} from "@/shared/constants/table-widths"

import type {
  User,
} from "@/features/users/types/user.types"

import {
  UserRowActions,
} from "../components/actions/user-row-actions"

export function useUserColumns():
EntityColumn<User>[]{

  return [

    {
      id:"id",
      align:"center",
      title:"N°",
      width:TABLE_WIDTHS.medium,
      skeletonShape:"text",
      render:(_,context)=>(

        <span className="font-semibold text-white">

          {String(context.rowIndex+1).padStart(3,"0")}

        </span>

      ),
    },

    {
      id:"name",
      align:"center",
      title:"USUARIO",
      width:TABLE_WIDTHS.large,
      skeletonShape:"badge",
      render:user=>(

        <DynamicBadge
          label={user.name}
          icon={user.icon}
          color={user.color}
          width="field"
        />

      ),
    },

    {
      id:"username",
      align:"center",
      title:"USERNAME",
      width:TABLE_WIDTHS.large,
      skeletonShape:"text",
      render:user=>(

        <span>

          {user.username ?? "-"}

        </span>

      ),
    },

    {
      id:"email",
      align:"center",
      title:"EMAIL",
      skeletonShape:"text",
      width:TABLE_WIDTHS.email,
      render:user=>(

        <span className="block truncate">

          {user.email}

        </span>

      ),
    },

    {
      id:"role",
      align:"center",
      title:"ROL",
      skeletonShape:"badge",
      width:TABLE_WIDTHS.large,
      render:user=>{

        const [firstRole, ...restRoles] = user.roles

        if (!firstRole) {
          return null
        }

        return (

          <div className="flex flex-wrap items-center justify-center gap-1.5">

            <DynamicBadge
              label={firstRole.name}
              icon={firstRole.icon}
              color={firstRole.color}
            />

            {restRoles.length > 0 && (
              <DynamicBadge
                label={`+${restRoles.length}`}
                color="#64748B"
              />
            )}

          </div>

        )

      },
    },

    {
      id:"online",
      align:"center",
      title:"ESTADO",
      width:TABLE_WIDTHS.large,
      skeletonShape:"text",
      render:user=>(
        <span className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-300">
          <span
            aria-hidden="true"
            className={
              user.online
                ?"h-1.5 w-1.5 rounded-full bg-emerald-400/90"
                :"h-1.5 w-1.5 rounded-full bg-neutral-500/70"
            }
          />
          {user.online
            ?"En línea"
            :"Desconectado"
          }
        </span>
      ),
    },

    {
      id:"actions",
      align:"center",
      title:"",
      width:TABLE_WIDTHS.actions,
      skeletonShape:"actions-pair",
      render:user=>(

        <UserRowActions
          userId={user.id}
        />

      ),
    },

  ]

}