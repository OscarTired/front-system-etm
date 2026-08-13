"use client"

import { Input } from "@/components/ui/input"
import type { MachineSettings } from "../types/project-settings"

export interface MachinePanelProps {
  settings: MachineSettings
  onChange: (patch: Partial<MachineSettings>) => void
}

export function MachinePanel({ settings, onChange }: MachinePanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Máquina</label>
        <Input value={settings.maquina} onChange={(e) => onChange({ maquina: e.target.value })} placeholder="ej. Bystronic Fiber 4020" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Gas</label>
          <Input value={settings.gas} onChange={(e) => onChange({ gas: e.target.value })} placeholder="O2, N2..." />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Boquilla</label>
          <Input value={settings.boquilla} onChange={(e) => onChange({ boquilla: e.target.value })} />
        </div>
      </div>
    </div>
  )
}
