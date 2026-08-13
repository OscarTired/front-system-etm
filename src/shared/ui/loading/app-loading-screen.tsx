"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import { LoadingBackground } from "./loading-background"

type Props = {
  isReady?: boolean
  onComplete?: () => void
}

export function AppLoadingScreen({
  isReady = false,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isReady) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev
        const remaining = 92 - prev
        const step = Math.max(0.5, remaining * 0.08)
        return Math.min(92, prev + step)
      })
    }, 120)

    return () => clearInterval(interval)
  }, [isReady])

  useEffect(() => {
    if (!isReady) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(100, prev + 4)
      })
    }, 16)

    return () => clearInterval(interval)
  }, [isReady])

  useEffect(() => {
    if (progress < 100 || !onComplete) return
    const timeout = setTimeout(onComplete, 250)
    return () => clearTimeout(timeout)
  }, [progress, onComplete])

  return (
    <div className="fixed inset-0 z-9999 flex min-h-dvh flex-col items-center justify-center overflow-hidden select-none bg-background">
      <LoadingBackground />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center">
          <Image
            src="/icon.svg"
            alt="Logo"
            width={96}
            height={96}
            priority
            className="block h-full w-full object-contain"
          />
        </div>

        <div className="mt-3 flex h-5 items-center justify-center gap-2">
          {/* Cyan/primary del tema — legible en light y dark */}
          <span className="text-[12px] font-medium uppercase tracking-[0.2em] text-primary">
            Cargando
          </span>

          <div className="flex h-full items-center gap-1">
            {[0, 1, 2].map(dot => (
              <span
                key={dot}
                className={`h-1 w-1 rounded-full bg-primary ${mounted ? "animate-bounce" : ""}`}
                style={{
                  animationDelay: `${dot * -0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
