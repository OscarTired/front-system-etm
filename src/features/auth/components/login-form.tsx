"use client"

import { useState } from "react"
import { Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Spinner } from "@/shared/ui/spinner/spinner"
import { useRouter } from "next/navigation"
import { authService } from "../services/auth.service"
import { useAuthStore } from "../store/auth-store"
import { usePermissionStore } from "@/features/permissions/store/permission-store"

const SHORT = "[@media(max-height:520px)]"
const CORPORATE_DOMAIN = "@etmperu.com"

export function LoginForm() {
  const router = useRouter()
  const setUser = useAuthStore(s => s.setUser)
  const setPermissions = usePermissionStore(s => s.setPermissions)

  const [loading, setLoading] = useState(false)
  const [usernamePrefix, setUsernamePrefix] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    setError(null)
    setLoading(true)

    const fullEmail = `${usernamePrefix.trim()}${CORPORATE_DOMAIN}`

    try {
      const result = await authService.login(fullEmail, password)
      setUser(result.user)
      setPermissions(result.permissions)
      setSuccess(true)
      router.replace("/projects")
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Credenciales incorrectas.")
      setPassword("")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    `h-11 ${SHORT}:h-10 w-full rounded-xl bg-[#111113] px-4 text-base text-white outline-none ` +
    "placeholder:text-neutral-600 transition-colors duration-200 " +
    "focus:bg-[#1c1c20] " +
    "disabled:cursor-not-allowed disabled:opacity-60"

  return (
    <form onSubmit={onSubmit} autoComplete="off" className={`space-y-3 ${SHORT}:space-y-2`}>
      <div>
        <label
          htmlFor="login_email_prefix"
          className={`mb-1.5 block text-sm font-medium text-neutral-300 ${SHORT}:mb-1 ${SHORT}:text-xs`}
        >
          Correo corporativo
        </label>

        <div className="relative flex items-center">
          <input
            id="login_email_prefix"
            name="corporate_username_prefix"
            value={usernamePrefix}
            disabled={loading}
            onChange={e => {
              const cleanValue = e.target.value.split("@")[0]
              setUsernamePrefix(cleanValue)
            }}
            placeholder="usuario"
            type="text"
            autoComplete="off"
            className={`${inputClass} pr-32`}
          />

          <span className="pointer-events-none absolute right-4 text-sm font-medium text-neutral-500 select-none">
            {CORPORATE_DOMAIN}
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="login_password"
          className={`mb-1.5 block text-sm font-medium text-neutral-300 ${SHORT}:mb-1 ${SHORT}:text-xs`}
        >
          Contraseña
        </label>
        <div className="relative flex items-center">
          <input
            id="login_password"
            name="corporate_user_password"
            value={password}
            disabled={loading}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            disabled={loading}
            onClick={toggleShowPassword}
            onMouseDown={e => e.preventDefault()}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 outline-none transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div className={`min-h-5 ${SHORT}:min-h-0`}>
        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`flex h-11 ${SHORT}:h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
          success
            ? "bg-emerald-500 text-white"
            : "bg-white text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-300"
        }`}
      >
        {success ? (
          <>
            <CheckCircle2 size={17} />
            Acceso concedido
          </>
        ) : loading ? (
          <Spinner size={17} />
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  )
}