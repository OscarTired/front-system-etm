"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CadTiraRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/cad")
  }, [router])
  return null
}
