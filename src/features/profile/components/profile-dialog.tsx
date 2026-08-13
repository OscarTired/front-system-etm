"use client"

import { useEffect, useState } from "react"

import { UserRound } from "lucide-react"

import { FormDialog } from "@/shared/ui/dialogs/form-dialog/form-dialog"

import { Input } from "@/components/ui/input"

import { AvatarPicker } from "./avatar-picker"

import { ThemeToggle } from "@/shared/theme"

import { useProfile } from "../hooks/use-profile"

type Props = {

  open: boolean

  onClose: () => void

}

export function ProfileDialog({ open, onClose }: Props) {

  const {
    profile,
    loading,
    uploading,
    save,
    upload,
    removePhoto,
  } = useProfile()

  const [name, setName] = useState(profile?.name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [position, setPosition] = useState(profile?.position ?? "")

  useEffect(() => {

    if (!open) return

    setName(profile?.name ?? "")
    setPhone(profile?.phone ?? "")
    setPosition(profile?.position ?? "")

  }, [open, profile])

  async function handleSave() {

    try {

      await save({ name, phone, position })

      onClose()

    } catch (error) {

      // El toast de error lo muestra el interceptor global en
      // api-client.ts — acá solo evitamos que la excepción quede
      // sin capturar y evitamos cerrar el dialog para no perder lo
      // que el usuario escribió.
      console.error("PROFILE SAVE ERROR", error)

    }

  }

  return (

    // FormDialog trae gratis: pantalla completa en mobile (size
    // "large", igual que TaskDialog), footer con Cancelar/Guardar
    // SIEMPRE anclado abajo (flex-1 min-h-0 en el contenido), y el
    // mismo header con ícono+título — en vez de reimplementar ese
    // armazón acá por segunda vez.
    <FormDialog
      open={open}
      title="Editar perfil"
      icon={UserRound}
      canSave
      saving={loading}
      saveLabel="Guardar"
      savingLabel="Guardando..."
      onClose={onClose}
      onSave={handleSave}
    >

      <div className="space-y-5">
        <AvatarPicker
          name={profile?.name ?? ""}
          avatarUrl={profile?.avatarUrl}
          uploading={uploading}
          onSelect={upload}
          onRemove={removePhoto}
        />

        <div className="space-y-3">

          <div className="space-y-1.5">

            <label className="text-xs font-medium text-muted-foreground">
              Nombre
            </label>

            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
            />

          </div>

          <div className="space-y-1.5">

            <label className="text-xs font-medium text-muted-foreground">
              Correo
            </label>

            <Input
              value={profile?.email ?? ""}
              disabled
              readOnly
            />

          </div>

          <div className="space-y-1.5">

            <label className="text-xs font-medium text-muted-foreground">
              Cargo
            </label>

            <Input
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="Ej. Jefe de producción"
            />

          </div>

          <div className="space-y-1.5">

            <label className="text-xs font-medium text-muted-foreground">
              Teléfono
            </label>

            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ej. 987654321"
            />

          </div>

        </div>

        <ThemeToggle />

      </div>

    </FormDialog>

  )

}