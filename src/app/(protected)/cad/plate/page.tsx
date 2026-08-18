"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CadPlateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/cad")
  }, [router])
  return null
}
