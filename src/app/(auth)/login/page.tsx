"use client"

import Image from "next/image"

import { LoginForm } from "@/features/auth/components/login-form"

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

    <div className={`flex min-h-dvh w-full items-center justify-center bg-background px-4 py-4 text-foreground select-none tablet:px-6 hide-scrollbar overflow-y-auto`}>

      <div className="w-full max-w-4xl">

        {/*
          Se activa el grid de 2 columnas también cuando el alto es
          chico (no solo por ancho vía laptop:) — así el espacio
          horizontal extra de un teléfono acostado se usa para el
          panel de marca en vez de quedar vacío, y el alto total baja
          porque deja de apilarse todo en una sola columna.
        */}
        <div className={`overflow-hidden rounded-2xl bg-foreground/5 shadow-2xl backdrop-blur-xl ${SHORT}:grid ${SHORT}:grid-cols-2 laptop:grid laptop:grid-cols-2`}>

          {/* LEFT SIDE */}

          <div className={`hidden border-r border-border bg-linear-to-br from-[#0A0A0A] to-[#050505] p-4 ${SHORT}:flex ${SHORT}:flex-col ${SHORT}:justify-center laptop:flex laptop:flex-col laptop:justify-between laptop:p-8`}>

            <div>

              <div className={`flex h-12 w-full items-center ${SHORT}:h-12 laptop:h-20`}>

                <div className={`relative h-12 w-12 shrink-0 ${SHORT}:h-12 ${SHORT}:w-12 laptop:h-20 laptop:w-20`}>

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

              <p className={`text-base text-muted-foreground ${SHORT}:text-base laptop:text-xl`}>
                COMPANY S.A.C.
              </p>

              <p className={`mt-1 text-xs text-muted-foreground ${SHORT}:mt-1 laptop:mt-4 laptop:text-sm`}>
                Sistema de Producción
              </p>

            </div>

            {/*
              Este bloque de pie (tagline + versión) ocupa alto que en
              un teléfono acostado (alto real ~360-430px) directamente
              no sobra — se oculta cuando el alto es chico, y vuelve a
              mostrarse recién en laptop, donde es una ventana de
              escritorio real con alto de sobra.
            */}
            <div className="hidden space-y-3 laptop:block">

              <p className="text-xs text-muted-foreground/80">
                Control de proyectos · tareas · procesos · producción
              </p>

              <div className="h-px w-full bg-foreground/5" />

              <p className="text-xs text-muted-foreground/80">
                Sistema interno versión 1.0
              </p>

            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className={`flex items-center justify-center p-4 tablet:p-5 ${SHORT}:p-4 laptop:p-8`}>

            <div className="w-full max-w-[18rem]">

              <div className={`mb-3 flex justify-center ${SHORT}:hidden laptop:hidden`}>

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

              <div className={`mb-3 text-center ${SHORT}:mb-2 ${SHORT}:text-left laptop:mb-6 laptop:text-left`}>

                <h2 className={`text-lg font-semibold ${SHORT}:text-base`}>
                  Iniciar sesión
                </h2>

                <p className={`mt-1 text-sm text-muted-foreground ${SHORT}:hidden`}>
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