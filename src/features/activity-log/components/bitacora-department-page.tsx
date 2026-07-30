"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { usePageTitle } from "@/shared/responsive/navigation/hooks/use-page-title"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { ActivityLogPageContent } from "./activity-log-page-content"
import type { BitacoraDepartmentConfig } from "../constants/bitacora-departments"

type Props = {
  config: BitacoraDepartmentConfig
  headerAction?: React.ReactNode
}

export function BitacoraDepartmentPage({ config }: Props) {

  usePageTitle(config.pageTitle)

  const router = useRouter()
  const userRoles = useAuthStore(state => state.user?.roles)

  const roleCodes = userRoles?.map(role => role.code) ?? []
  const isAdmin = roleCodes.includes("ADMIN")
  const allowed = isAdmin || config.roles.some(role => roleCodes.includes(role))

  useEffect(() => {
    if (userRoles && !allowed) {
      router.replace("/bitacora")
    }
  }, [userRoles, allowed, router])

  if (!userRoles || !allowed) {
    return null
  }

  return (
    <div className="flex flex-col w-full">
      <ActivityLogPageContent department={config.department} />
    </div>
  )

}