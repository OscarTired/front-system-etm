"use client"

import { useState } from "react"

import { Input } from "@/components/ui/input"
import { PrimaryAction } from "@/shared/ui/actions/primary-action"

import { AvatarPicker } from "./avatar-picker"

import { useProfile } from "../hooks/use-profile"

type Props = {

  onClose: () => void

}

export function ProfileForm({ onClose }: Props) {

  const { profile, loading, uploading, save, upload } = useProfile()

  const [name, setName] = useState(profile?.name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [position, setPosition] = useState(profile?.position ?? "")

  async function handleSave() {

    await save({ name, phone, position })

    onClose()

  }

  return (

    <div className="space-y-5">

      <AvatarPicker
        name={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl}
        uploading={uploading}
        onSelect={upload}
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

      <div className="flex justify-end gap-2 pt-2">

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-10 rounded-xl px-5 text-sm font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
        >

          Cancelar

        </button>

        <PrimaryAction
          label="Guardar"
          isLoading={loading}
          disabled={loading}
          onClick={handleSave}
        />

      </div>

    </div>

  )

}