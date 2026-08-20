import { X } from "lucide-react"
import type { Entity } from "../types"

interface PropertiesPanelProps {
  entity: Entity | null
  onChange: (entity: Entity) => void
  onClose: () => void
}

const LAYER_OPTIONS = ["CUT", "ETCH", "FOLD", "DIM", "TEXT"]

function NumberField({
  label, value, onChange, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void; step?: number
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  )
}

function TextField({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  )
}

function SelectField({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  )
}

export function PropertiesPanel({ entity, onChange, onClose }: PropertiesPanelProps) {
  if (!entity) return null

  const update = (patch: Partial<Entity>) => {
    onChange({ ...entity, ...patch } as Entity)
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-card border-l border-border flex flex-col z-20 shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Propiedades
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs font-medium text-foreground capitalize">{entity.type}</div>

        <SelectField
          label="Layer"
          value={entity.layer || "CUT"}
          options={LAYER_OPTIONS}
          onChange={(v) => update({ layer: v })}
        />

        {entity.type === "line" && (
          <>
            <NumberField label="Start X" value={entity.start[0]} onChange={(v) => update({ start: [v, entity.start[1]] })} />
            <NumberField label="Start Y" value={entity.start[1]} onChange={(v) => update({ start: [entity.start[0], v] })} />
            <NumberField label="End X" value={entity.end[0]} onChange={(v) => update({ end: [v, entity.end[1]] })} />
            <NumberField label="End Y" value={entity.end[1]} onChange={(v) => update({ end: [entity.end[0], v] })} />
          </>
        )}

        {entity.type === "circle" && (
          <>
            <NumberField label="Center X" value={entity.center[0]} onChange={(v) => update({ center: [v, entity.center[1]] })} />
            <NumberField label="Center Y" value={entity.center[1]} onChange={(v) => update({ center: [entity.center[0], v] })} />
            <NumberField label="Radius" value={entity.radius} onChange={(v) => update({ radius: v })} />
          </>
        )}

        {entity.type === "arc" && (
          <>
            <NumberField label="Center X" value={entity.center[0]} onChange={(v) => update({ center: [v, entity.center[1]] })} />
            <NumberField label="Center Y" value={entity.center[1]} onChange={(v) => update({ center: [entity.center[0], v] })} />
            <NumberField label="Radius" value={entity.radius} onChange={(v) => update({ radius: v })} />
            <NumberField label="Start°" value={entity.startAngle} onChange={(v) => update({ startAngle: v })} />
            <NumberField label="End°" value={entity.endAngle} onChange={(v) => update({ endAngle: v })} />
          </>
        )}

        {entity.type === "rectangle" && (
          <>
            <NumberField label="X" value={entity.x} onChange={(v) => update({ x: v })} />
            <NumberField label="Y" value={entity.y} onChange={(v) => update({ y: v })} />
            <NumberField label="Width" value={entity.width} onChange={(v) => update({ width: v })} />
            <NumberField label="Height" value={entity.height} onChange={(v) => update({ height: v })} />
          </>
        )}

        {entity.type === "polyline" && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{entity.points.length} puntos</div>
            {entity.points.map((pt, i) => (
              <div key={i} className="flex gap-1">
                <NumberField label={`P${i} X`} value={pt[0]} onChange={(v) => {
                  const pts = [...entity.points]
                  pts[i] = [v, pt[1]]
                  update({ points: pts })
                }} />
                <NumberField label={`P${i} Y`} value={pt[1]} onChange={(v) => {
                  const pts = [...entity.points]
                  pts[i] = [pt[0], v]
                  update({ points: pts })
                }} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-xs pt-1">
              <input type="checkbox" checked={entity.closed} onChange={(e) => update({ closed: e.target.checked })} />
              <span>Cerrada</span>
            </label>
          </div>
        )}

        {entity.type === "slot" && (
          <>
            <NumberField label="Center X" value={entity.center[0]} onChange={(v) => update({ center: [v, entity.center[1]] })} />
            <NumberField label="Center Y" value={entity.center[1]} onChange={(v) => update({ center: [entity.center[0], v] })} />
            <NumberField label="Length" value={entity.length} onChange={(v) => update({ length: v })} />
            <NumberField label="Width" value={entity.width} onChange={(v) => update({ width: v })} />
            <NumberField label="Angle°" value={entity.angle} onChange={(v) => update({ angle: v })} />
          </>
        )}

        {entity.type === "ellipse" && (
          <>
            <NumberField label="Center X" value={entity.center[0]} onChange={(v) => update({ center: [v, entity.center[1]] })} />
            <NumberField label="Center Y" value={entity.center[1]} onChange={(v) => update({ center: [entity.center[0], v] })} />
            <NumberField label="Radius X" value={entity.radiusX} onChange={(v) => update({ radiusX: v })} />
            <NumberField label="Radius Y" value={entity.radiusY} onChange={(v) => update({ radiusY: v })} />
            <NumberField label="Angle°" value={entity.angle} onChange={(v) => update({ angle: v })} />
          </>
        )}

        {entity.type === "fold" && (
          <>
            <NumberField label="Start X" value={entity.start[0]} onChange={(v) => update({ start: [v, entity.start[1]] })} />
            <NumberField label="Start Y" value={entity.start[1]} onChange={(v) => update({ start: [entity.start[0], v] })} />
            <NumberField label="End X" value={entity.end[0]} onChange={(v) => update({ end: [v, entity.end[1]] })} />
            <NumberField label="End Y" value={entity.end[1]} onChange={(v) => update({ end: [entity.end[0], v] })} />
            <NumberField label="Angle°" value={entity.angle} onChange={(v) => update({ angle: v })} />
            <SelectField label="Direction" value={entity.direction} options={["up", "down"]} onChange={(v) => update({ direction: v as "up" | "down" })} />
          </>
        )}

        {entity.type === "text" && (
          <>
            <NumberField label="Pos X" value={entity.position[0]} onChange={(v) => update({ position: [v, entity.position[1]] })} />
            <NumberField label="Pos Y" value={entity.position[1]} onChange={(v) => update({ position: [entity.position[0], v] })} />
            <TextField label="Text" value={entity.text} onChange={(v) => update({ text: v })} />
            <NumberField label="Height" value={entity.height} onChange={(v) => update({ height: v })} />
            <NumberField label="Angle°" value={entity.angle} onChange={(v) => update({ angle: v })} />
          </>
        )}

        {entity.type === "dimension" && (
          <>
            <NumberField label="Start X" value={entity.start[0]} onChange={(v) => update({ start: [v, entity.start[1]] })} />
            <NumberField label="Start Y" value={entity.start[1]} onChange={(v) => update({ start: [entity.start[0], v] })} />
            <NumberField label="End X" value={entity.end[0]} onChange={(v) => update({ end: [v, entity.end[1]] })} />
            <NumberField label="End Y" value={entity.end[1]} onChange={(v) => update({ end: [entity.end[0], v] })} />
            <TextField label="Text" value={entity.text} onChange={(v) => update({ text: v })} />
            <NumberField label="Offset" value={entity.offset} onChange={(v) => update({ offset: v })} />
          </>
        )}
      </div>
    </div>
  )
}
