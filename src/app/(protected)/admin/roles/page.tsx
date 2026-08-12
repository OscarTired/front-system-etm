"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** @deprecated → /admin/access */
export default function RolesRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/access")
  }, [router])
  return null
}
