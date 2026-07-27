"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  UserPlus,
} from "lucide-react"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  FormDialog,
} from "@/shared/ui/dialogs/form-dialog/form-dialog"

import type {
  EntityIcon,
} from "@/shared/constants/entity-icons"

import type {
  User,
} from "@/features/users/types/user.types"

import {
  useUserMutations,
} from "@/features/users/hooks/use-user-mutations"

import {
  useRoles,
} from "@/features/roles/hooks/use-roles"

import {
  useAreas,
} from "@/features/areas/hooks/use-areas"

import {
  validateUser,
  type UserErrors,
} from "../../hooks/validate-user"

import {
  generateUserDefaultsFromEmail,
} from "@/features/users/utils/generate-user-defaults-from-email"

import {
  UserForm,
  UserFormWizardProgress,
  USER_FORM_STEP_COUNT,
} from "../form/user-form"

type Props = {
  open: boolean
  onClose: () => void
  user?: User
}

type UserFormValue = {
  username: string
  name: string
  email: string
  password: string
  confirmPassword: string
  isChangingPassword: boolean
  roleIds: string[]
  level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null
  areaIds: string[]
  icon: EntityIcon
  color: string
  active: boolean
}

const STEP_ERROR_KEYS: Record<
  number,
  (keyof UserErrors)[]
> = {
  0: ["roleIds"],
  1: [
    "name",
    "username",
    "email",
    "password",
    "confirmPassword",
  ],
  2: [],
}

function createInitialForm(
  user?: User,
): UserFormValue {
  return {
    username: user?.username ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    confirmPassword: "",
    isChangingPassword: false,
    roleIds: user?.roles?.map(role => role.id) ?? [],
    level: user?.level ?? null,
    areaIds: user?.areas?.map(area => area.id) ?? [],
    icon: user?.icon ?? "user",
    color: user?.color ?? "#7C3AED",
    active: user?.active ?? true,
  }
}

export function UserDialog({
  open,
  onClose,
  user,
}: Props) {
  const { isMobile } = useResponsive()

  const {
    roles,
    loading,
  } = useRoles(open)

  const {
    areas,
  } = useAreas(open)

  const {
    createUser,
    updateUser,
  } = useUserMutations()

  const [
    form,
    setForm,
  ] = useState<UserFormValue>(
    createInitialForm(user),
  )

  const [
    attempted,
    setAttempted,
  ] = useState(false)

  const [
    step,
    setStep,
  ] = useState(0)

  const [
    stepAttempted,
    setStepAttempted,
  ] = useState<Set<number>>(
    new Set(),
  )

  useEffect(() => {
    setForm(createInitialForm(user))
    setAttempted(false)

    if (open) {
      setStep(0)
      setStepAttempted(new Set())
    }
  }, [
    user,
    open,
  ])

  function update(
    value: Partial<UserFormValue>,
  ) {
    setForm(current => ({
      ...current,
      ...value,
    }))
  }

  const selectedRoles =
    roles.filter(
      role => form.roleIds.includes(role.id),
    )

  const selectedAreas =
    areas.filter(
      area => form.areaIds.includes(area.id),
    )

  const isEditing =
    Boolean(user)

  const errors =
    validateUser({
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      roleIds: form.roleIds,
      isEditing,
      isChangingPassword:
        form.isChangingPassword,
    })

  const isValid =
    Object.keys(errors).length === 0

  const saving =
    createUser.isPending ||
    updateUser.isPending

  function buildPayload() {
    const {
      confirmPassword: _confirmPassword,
      isChangingPassword: _isChangingPassword,
      password,
      ...rest
    } = form

    return {
      ...rest,
      ...(password.trim() && {
        password,
      }),
    }
  }

  function close() {
    setForm(createInitialForm(user))
    setAttempted(false)
    onClose()
  }

  async function save() {
    if (!isValid) {
      setAttempted(true)
      return
    }

    try {
      const payload = buildPayload()

      if (user) {
        await updateUser.mutateAsync({
          id: user.id,
          dto: payload,
        })
      } else {
        if (!payload.password) {
          return
        }

        await createUser.mutateAsync(payload)
      }

      close()
    } catch (error) {
      console.error(
        "USER SAVE ERROR",
        error,
      )
    }
  }

  function stepHasErrors(
    stepIndex: number,
  ) {
    return STEP_ERROR_KEYS[stepIndex].some(
      key => errors[key],
    )
  }

  function handleWizardNext() {
    if (stepHasErrors(step)) {
      setStepAttempted(
        current =>
          new Set(current).add(step),
      )

      return
    }

    setStep(current => current + 1)
  }

  function handleWizardBack() {
    setStep(current =>
      Math.max(0, current - 1),
    )
  }

  const isLastStep =
    step === USER_FORM_STEP_COUNT - 1

  const showWizardFooter =
    isMobile && !isLastStep

  const cancelLabel =
    isMobile && step > 0
      ? "Atrás"
      : "Cancelar"

  const onCancelClick =
    isMobile && step > 0
      ? handleWizardBack
      : close

  const saveLabel =
    showWizardFooter
      ? "Siguiente"
      : user
        ? "Guardar"
        : "Crear usuario"

  const savingLabel =
    user
      ? "Guardando..."
      : "Creando usuario..."

  const canSave =
    !loading &&
    (
      showWizardFooter
        ? !stepHasErrors(step)
        : isValid
    )

  const onSave =
    showWizardFooter
      ? handleWizardNext
      : save

  const visibleErrors =
    isMobile
      ? (
          stepAttempted.has(step)
            ? errors
            : undefined
        )
      : (
          attempted
            ? errors
            : undefined
        )

  return (
    <FormDialog
      open={open}
      title={
        user
          ? "Editar usuario"
          : "Nuevo usuario"
      }
      icon={UserPlus}
      canSave={canSave}
      saving={saving}
      saveLabel={saveLabel}
      savingLabel={savingLabel}
      cancelLabel={cancelLabel}
      onCancelClick={onCancelClick}
      subHeader={
        isMobile
          ? (
              <UserFormWizardProgress
                step={step}
              />
            )
          : undefined
      }
      onClose={close}
      onSave={onSave}
    >
      <UserForm
        name={form.name}
        username={form.username}
        email={form.email}
        password={form.password}
        confirmPassword={form.confirmPassword}
        isEditing={isEditing}
        isChangingPassword={
          form.isChangingPassword
        }
        icon={form.icon}
        color={form.color}
        roles={roles}
        selectedRoles={selectedRoles}
        level={form.level}
        areas={selectedAreas}
        errors={visibleErrors}
        step={step}
        onRolesChange={nextRoles => {

          // Mismo criterio que el backend (assertLevelMatchesRole):
          // PRODUCCION admite OPERARIO/SUPERVISOR, Ingeniería y
          // Proyectos admiten solo SUPERVISOR, el resto no admite
          // sub-nivel. Con varios roles a la vez, el nivel es
          // válido si CUALQUIERA de los roles elegidos lo permite
          // (unión, no intersección) — así alguien Producción +
          // Ingeniería puede seguir siendo Operario, que Ingeniería
          // sola no permitiría. Si el level actual no queda válido
          // para ningún rol nuevo, se limpia (junto con areaIds,
          // que solo tiene sentido para OPERARIO en Producción).
          const allowedLevels: Record<string, ("OPERARIO" | "SUPERVISOR")[]> = {
            PRODUCCION: ["OPERARIO", "SUPERVISOR"],
            INGENIERIA: ["SUPERVISOR"],
            PROYECTOS: ["SUPERVISOR"],
          }

          const nextAllowed = new Set(
            nextRoles.flatMap(role => allowedLevels[role.code] ?? []),
          )

          const levelStillValid =
            form.level != null
            && nextAllowed.has(form.level as "OPERARIO" | "SUPERVISOR")

          const stillProduccion =
            nextRoles.some(role => role.code === "PRODUCCION")

          update({
            roleIds: nextRoles.map(role => role.id),
            ...(!levelStillValid && {
              level: null,
              areaIds: [],
            }),
            ...(levelStillValid
              && (form.level !== "OPERARIO" || !stillProduccion)
              && {
                areaIds: [],
              }),
          })
        }}
        onLevelChange={level =>
          update({
            level,
            // Mismo criterio que el backend
            // (assertAreasMatchLevel): el área solo tiene sentido
            // para OPERARIO, así que se limpia sola al cambiar a
            // cualquier otro sub-nivel — evita que quede una
            // selección vieja "fantasma" que después el backend
            // igual iba a descartar.
            ...(level !== "OPERARIO" && {
              areaIds: [],
            }),
          })
        }
        onAreasChange={nextAreas =>
          update({ areaIds: nextAreas.map(area => area.id) })
        }
        onChangingPasswordChange={
          isChangingPassword =>
            update({
              isChangingPassword,
            })
        }
        onNameChange={name =>
          update({ name })
        }
        onUsernameChange={username =>
          update({ username })
        }
        onEmailChange={email => {
          if (!isEditing) {
            const defaults = generateUserDefaultsFromEmail(email)

            update({
              email,
              name: defaults.name,
              username: defaults.username,
              password: defaults.password,
              confirmPassword: defaults.confirmPassword,
            })
          } else {
            update({ email })
          }
        }}
        onPasswordChange={password =>
          update({ password })
        }
        onConfirmPasswordChange={
          confirmPassword =>
            update({
              confirmPassword,
            })
        }
        onColorChange={color =>
          update({ color })
        }
      />
    </FormDialog>
  )
}