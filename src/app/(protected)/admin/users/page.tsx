"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** @deprecated → /admin/access (modo usuarios) */
export default function UsersRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/access?tab=usuarios")
  }, [router])
  return null
}
