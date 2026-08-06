"use client"

/** Mismo patrón que ActivityLogSkeleton: animate-pulse + bg-white/N */

function Skel({ className }: { className?: string }) {
  return <span className={`block rounded bg-white/10 ${className ?? ""}`} />
}

export function NestingPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full animate-pulse overflow-hidden">
      {/* Rail */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/8 py-3">
        {[1, 0.85, 0.7, 0.55].map((op, i) => (
          <span key={i} className="size-10 rounded-xl bg-white/8" style={{ opacity: op }} />
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="flex gap-2">
          <Skel className="h-8 w-24 rounded-lg bg-white/8" />
          <Skel className="h-8 w-20 rounded-lg bg-white/6" />
        </div>
        <div className="flex flex-1 items-center justify-center rounded-2xl bg-black/30">
          <Skel className="h-32 w-48 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}
