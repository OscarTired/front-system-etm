function CompactShell({ children }: Props) {
  const pathname = usePathname()
  const mode = useMobileNavStore(s => s.mode)
  const closeDrawer = useMobileNavStore(s => s.closeDrawer)

  const x = useMotionValue(0)
  const isOpen = mode === "open"
  const selfAnimatedCloseRef = useRef(false)

  // Animación programática impecable (Botones)
  useEffect(() => {
    if (selfAnimatedCloseRef.current) {
      selfAnimatedCloseRef.current = false
      return
    }

    const controls = animate(x, isOpen ? DRAWER_REVEAL_OFFSET : 0, SMOOTH_TRANSITION)
    return () => controls.stop()
  }, [isOpen, x])

  return (
    <div className="relative h-dvh overflow-hidden select-none bg-[#1d1c1c] text-white">
      <SidebarDrawer />

      <motion.div
        drag={isOpen ? "x" : false}
        dragDirectionLock // Bloquea el eje para que no compita con el scroll vertical
        dragConstraints={{ left: 0, right: DRAWER_REVEAL_OFFSET }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={async (_event, info) => {
          const currentX = x.get()
          const closeThreshold = DRAWER_REVEAL_OFFSET * CLOSE_THRESHOLD_RATIO
          const isFastFlickLeft = info.velocity.x < -FLICK_VELOCITY_THRESHOLD
          const shouldClose = currentX < closeThreshold || isFastFlickLeft

          x.stop()

          if (shouldClose) {
            selfAnimatedCloseRef.current = true
            await animate(x, 0, SMOOTH_TRANSITION)
            closeDrawer()
          } else {
            animate(x, DRAWER_REVEAL_OFFSET, SMOOTH_TRANSITION)
          }
        }}
        // touch-none evita que el navegador dude entre scroll y drag
        style={{ x, touchAction: "pan-y" }} 
        // rounded-l-[28px] directo en CSS para no recalcular strings frame a frame
        className="absolute inset-0 z-10 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-l-[28px] bg-[#050505] will-change-transform"
      >
        <TopBar />
        <div
          inert={isOpen}
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            isOpen && "pointer-events-none select-none" // Desactiva interacciones internas en el drag
          )}
        >
          <PullToRefresh>
            <VerticalScroll
              key={pathname}
              containerClassName="h-full"
              className="overflow-x-hidden pt-14 pb-20"
              arrowTopOffset={64}
              arrowBottomOffset={88}
            >
              {children}
            </VerticalScroll>
          </PullToRefresh>
          <BottomNavigation />
        </div>
      </motion.div>
    </div>
  )
}
