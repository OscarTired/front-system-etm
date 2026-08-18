"use client"

import Image from "next/image"

import { LoginForm } from "@/features/auth/components/login-form"
import { ThemeToggle } from "@/shared/theme/theme-toggle"

// Media query compartido para "viewport bajo de alto" (teléfono
// acostado, ~360-430px de alto real). Usamos ALTO en vez de
// "landscape:" a propósito: landscape: también matchea cualquier
// ventana de escritorio normal (casi siempre son más anchas que
// altas), lo que pisaría los estilos de "laptop:" sin querer. Con
// max-height nos aseguramos de compactar solo cuando el alto
// disponible realmente es chico, sin importar el ancho.
const SHORT = "[@media(max-height:520px)]"

export default function LoginPage() {
  return (
    <div
      className={`relative flex min-h-dvh w-full items-center justify-center overflow-y-auto bg-background px-4 py-4 text-foreground select-none hide-scrollbar tablet:px-6`}
    >
      {/* Theme: esquina superior derecha, fuera del card (no compite con Entrar) */}
      <div className="absolute right-4 top-4 z-10 tablet:right-6 tablet:top-6">
        <ThemeToggle variant="icon" className="size-10 rounded-full bg-chrome text-muted-foreground shadow-sm shadow-black/15 dark:shadow-black/40 backdrop-blur-xl hover:bg-chrome hover:text-foreground" />
      </div>

      <div className="w-full max-w-4xl">
        {/*
          Grid 2 cols en alto chico y en laptop.
          Card: tokens de tema (no negro hardcodeado en light).
        */}
        <div
          className={`overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl backdrop-blur-xl ${SHORT}:grid ${SHORT}:grid-cols-2 laptop:grid laptop:grid-cols-2`}
        >
          {/* LEFT — marca: light = panel suave; dark = panel oscuro de marca */}
          <div
            className={`hidden bg-muted p-4 dark:bg-linear-to-br dark:from-[#0A0A0A] dark:to-[#050505] ${SHORT}:flex ${SHORT}:flex-col ${SHORT}:justify-center laptop:flex laptop:flex-col laptop:justify-between laptop:p-8`}
          >
            <div>
              <div
                className={`flex h-12 w-full items-center ${SHORT}:h-12 laptop:h-20`}
              >
                <div
                  className={`relative h-12 w-12 shrink-0 ${SHORT}:h-12 ${SHORT}:w-12 laptop:h-20 laptop:w-20`}
                >
                  <Image
                    src="/icon.svg"
                    alt="ETM SAC"
                    fill
                    priority
                    draggable={false}
                    className="select-none object-contain"
                  />
                </div>
              </div>

              <p
                className={`text-base text-foreground/80 dark:text-white/75 ${SHORT}:text-base laptop:text-xl`}
              >
                COMPANY S.A.C.
              </p>

              <p
                className={`mt-1 text-xs text-muted-foreground dark:text-white/50 ${SHORT}:mt-1 laptop:mt-4 laptop:text-sm`}
              >
                Sistema de Producción
              </p>
            </div>

            <div className="hidden space-y-3 laptop:block">
              <p className="text-xs text-muted-foreground dark:text-white/45">
                Control de proyectos · tareas · procesos · producción
              </p>

              <div className="h-px w-full bg-border dark:bg-white/10" />

              <p className="text-xs text-muted-foreground/80 dark:text-white/40">
                Sistema interno versión 1.0
              </p>
            </div>
          </div>

          {/* RIGHT — form */}
          <div
            className={`flex items-center justify-center bg-card p-4 tablet:p-5 ${SHORT}:p-4 laptop:p-8`}
          >
            <div className="w-full max-w-[18rem]">
              <div
                className={`mb-3 flex justify-center ${SHORT}:hidden laptop:hidden`}
              >
                <div className="relative h-12 w-12 shrink-0 tablet:h-14 tablet:w-14">
                  <Image
                    src="/icon.svg"
                    alt="ETM SAC"
                    fill
                    priority
                    draggable={false}
                    className="select-none object-contain"
                  />
                </div>
              </div>

              <div
                className={`mb-3 text-center ${SHORT}:mb-2 ${SHORT}:text-left laptop:mb-6 laptop:text-left`}
              >
                <h2 className={`text-lg font-semibold ${SHORT}:text-base`}>
                  Iniciar sesión
                </h2>

                <p
                  className={`mt-1 text-sm text-muted-foreground ${SHORT}:hidden`}
                >
                  Accede al sistema de producción
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
