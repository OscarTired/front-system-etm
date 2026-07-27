"use client"

import { useResponsive } from "@/shared/responsive/hooks/use-responsive"
import { WizardProgress } from "@/shared/ui/dialogs/form-dialog/wizard-progress"

import type { EntityIcon } from "@/shared/constants/entity-icons"
import type { Role } from "@/features/roles/types/role.types"
import type { Area } from "@/features/areas/types/area.types"

import type { UserErrors } from "../../hooks/validate-user"

import { UserColorSection } from "./user-color-section"
import { UserDialogHeader } from "../dialog/user-dialog-header"
import { UserFormSection } from "./user-form-section"

export const USER_FORM_STEPS = [
  { label: "Rol" },
  { label: "Información" },
  { label: "Personalización" },
] as const

export const USER_FORM_STEP_COUNT =
  USER_FORM_STEPS.length

export function UserFormWizardProgress({
  step,
}: {
  step: number
}) {
  return (
    <WizardProgress
      steps={USER_FORM_STEPS}
      step={step}
    />
  )
}

type Props = {
  name: string
  username: string
  email: string
  password: string
  confirmPassword: string
  isEditing: boolean
  isChangingPassword: boolean
  icon: EntityIcon
  color: string
  roles: Role[]
  selectedRoles: Role[]
  level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null
  areas: Area[]
  errors?: UserErrors
  step?: number
  onRolesChange: (roles: Role[]) => void
  onLevelChange: (
    level: "GENERAL" | "OPERARIO" | "SUPERVISOR" | null,
  ) => void
  onAreasChange: (areas: Area[]) => void
  onChangingPasswordChange: (value: boolean) => void
  onNameChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onColorChange: (value: string) => void
}

export function UserForm({
  name,
  username,
  email,
  password,
  confirmPassword,
  isEditing,
  isChangingPassword,
  icon,
  color,
  roles,
  selectedRoles,
  level,
  areas,
  errors,
  step = 0,
  onRolesChange,
  onLevelChange,
  onAreasChange,
  onChangingPasswordChange,
  onNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onColorChange,
}: Props) {
  const { isMobile } = useResponsive()

  const roleSection = (
    <UserDialogHeader
      name={name}
      username={username}
      email={email}
      icon={icon}
      color={color}
      roles={roles}
      selectedRoles={selectedRoles}
      level={level}
      areas={areas}
      error={errors?.roleIds}
      onRolesChange={onRolesChange}
      onLevelChange={onLevelChange}
      onAreasChange={onAreasChange}
    />
  )

  const informationSection = (
    <UserFormSection
      name={name}
      username={username}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      isEditing={isEditing}
      isChangingPassword={isChangingPassword}
      errors={errors}
      onChangingPasswordChange={onChangingPasswordChange}
      onNameChange={onNameChange}
      onUsernameChange={onUsernameChange}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
      onConfirmPasswordChange={onConfirmPasswordChange}
    />
  )

  const personalizationSection = (
    <UserColorSection
      name={name}
      icon={icon}
      color={color}
      onColorChange={onColorChange}
    />
  )

  if (!isMobile) {
    return (
      <div className="space-y-6">
        {roleSection}
        {informationSection}
        {personalizationSection}
      </div>
    )
  }

  if (step === 0) {
    return roleSection
  }

  if (step === 1) {
    return informationSection
  }

  return personalizationSection
}