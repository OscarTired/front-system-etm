"use client"

import {
  useState,
} from "react"

import {
  Eye,
  EyeOff,
  KeyRound,
  Users,
} from "lucide-react"

import {
  Input,
} from "@/components/ui/input"

import {
  FormField,
} from "@/shared/ui/dialogs/form-dialog/form-field"

import {
  FormSection,
} from "@/shared/ui/dialogs/form-dialog/form-section"

import type {
  UserErrors,
} from "../../hooks/validate-user"

const CORPORATE_DOMAIN = "@etmperu.com"

type Props = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  isEditing: boolean
  isChangingPassword: boolean
  errors?: UserErrors
  onChangingPasswordChange: (
    value: boolean
  ) => void
  onNameChange: (
    value: string
  ) => void
  onUsernameChange: (
    value: string
  ) => void
  onEmailChange: (
    value: string
  ) => void
  onPasswordChange: (
    value: string
  ) => void
  onConfirmPasswordChange: (
    value: string
  ) => void
}

export function UserFormSection({
  name,
  username,
  email,
  password,
  confirmPassword,
  isEditing,
  isChangingPassword,
  errors,
  onChangingPasswordChange,
  onNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: Props) {

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const changingPassword =
    !isEditing ||
    isChangingPassword

  const emailPrefix = email ? email.split("@")[0] : ""

  return (

    <FormSection
      title="Información principal"
      icon={Users}
    >

      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">

        <FormField label="Nombre" error={errors?.name}>

          <Input
            value={name}
            placeholder="Ej. Martin"
            onChange={event =>
              onNameChange(
                event.target.value
              )
            }
          />

        </FormField>

        <FormField label="Usuario" error={errors?.username}>

          <Input
            value={username}
            placeholder="Ej. MartinMontes"
            onChange={event =>
              onUsernameChange(
                event.target.value
              )
            }
          />

        </FormField>

      </div>

      <FormField label="Correo" error={errors?.email}>

        <div className="relative flex items-center">
          <Input
            type="text"
            value={emailPrefix}
            placeholder="martin.montes"
            onChange={event => {
              const cleanValue = event.target.value.split("@")[0]
              onEmailChange(`${cleanValue}${CORPORATE_DOMAIN}`)
            }}
            className="pr-32"
          />
          <span className="pointer-events-none absolute right-4 text-sm font-medium text-muted-foreground select-none">
            {CORPORATE_DOMAIN}
          </span>
        </div>

      </FormField>

      {isEditing && (

        <button
          type="button"
          onClick={() =>
            onChangingPasswordChange(
              !isChangingPassword
            )
          }
          className="flex w-full items-center justify-between rounded-xl bg-foreground/5 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-foreground/5"
        >

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5">

              <KeyRound
                size={14}
              />

            </div>

            <div>

              <div className="text-sm font-medium text-foreground">

                Cambiar contraseña

              </div>

              <div className="text-xs text-muted-foreground">

                Actualizar credenciales del usuario

              </div>

            </div>

          </div>

          <div className="rounded-full bg-foreground/5 px-2.5 py-1 text-sm font-medium text-muted-foreground">

            {isChangingPassword
              ? "Activo"
              : "Opcional"}

          </div>

        </button>

      )}

      {changingPassword && (

        <div className="space-y-4 rounded-xl bg-foreground/5 p-4">

          <div className="grid grid-cols-2 gap-4">

            <FormField
              label="Nueva contraseña"
              error={errors?.password}
            >

              <div className="relative">

                <Input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={password}
                  placeholder="Mínimo 8 caracteres"
                  onChange={event =>
                    onPasswordChange(
                      event.target.value
                    )
                  }
                  className="pr-10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      current =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-muted-foreground"
                >

                  {showPassword
                    ? (
                      <EyeOff
                        size={16}
                      />
                    )
                    : (
                      <Eye
                        size={16}
                      />
                    )}

                </button>

              </div>

            </FormField>

            <FormField
              label="Confirmar contraseña"
              error={errors?.confirmPassword}
            >

              <Input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                value={confirmPassword}
                placeholder="Repite la contraseña"
                onChange={event =>
                  onConfirmPasswordChange(
                    event.target.value
                  )
                }
              />

            </FormField>

          </div>

        </div>

      )}

    </FormSection>

  )

}