import { fromScreen, type ViewTransform } from "./geometry"

export const RULER_SIZE = 22

const BG = "#ffffff"
const BORDER = "#d4d4d4"
const TICK = "#a3a3a3"
const TEXT = "#737373"
const CURSOR = "#2563eb"

function niceStep(scale: number): number {
  const target = 80 / scale
  const pow = Math.pow(10, Math.floor(Math.log10(target)))
  for (const m of [1, 2, 5, 10]) {
    if (m * pow >= target) return m * pow
  }
  return 10 * pow
}

function fmt(n: number): string {
  const v = Math.abs(n) < 1e-9 ? 0 : n
  return `${parseFloat(v.toFixed(2))}`
}

export function drawRulers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: ViewTransform,
  cursor: [number, number] | null,
) {
  const step = niceStep(t.scale)
  const minor = step / 5

  ctx.save()

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, RULER_SIZE)
  ctx.fillRect(0, 0, RULER_SIZE, h)
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, RULER_SIZE + 0.5); ctx.lineTo(w, RULER_SIZE + 0.5)
  ctx.moveTo(RULER_SIZE + 0.5, 0); ctx.lineTo(RULER_SIZE + 0.5, h)
  ctx.stroke()

  ctx.font = "9px sans-serif"

  const wxStart = Math.floor(((RULER_SIZE - t.offsetX) / t.scale) / minor) * minor
  for (let wx = wxStart; ; wx += minor) {
    const sx = wx * t.scale + t.offsetX
    if (sx > w) break
    if (sx < RULER_SIZE) continue
    const isMajor = Math.abs(wx / step - Math.round(wx / step)) < 1e-4
    ctx.strokeStyle = TICK
    ctx.beginPath()
    ctx.moveTo(sx, RULER_SIZE)
    ctx.lineTo(sx, RULER_SIZE - (isMajor ? 8 : 4))
    ctx.stroke()
    if (isMajor) {
      ctx.fillStyle = TEXT
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText(fmt(wx), sx + 2, 3)
    }
  }

  const wyStart = Math.ceil(((t.offsetY - h) / t.scale) / minor) * minor
  for (let wy = wyStart; ; wy += minor) {
    const sy = t.offsetY - wy * t.scale
    if (sy < RULER_SIZE) break
    if (sy > h) continue
    const isMajor = Math.abs(wy / step - Math.round(wy / step)) < 1e-4
    ctx.strokeStyle = TICK
    ctx.beginPath()
    ctx.moveTo(RULER_SIZE, sy)
    ctx.lineTo(RULER_SIZE - (isMajor ? 8 : 4), sy)
    ctx.stroke()
    if (isMajor) {
      ctx.save()
      ctx.translate(9, sy + 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = TEXT
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(fmt(wy), 0, 0)
      ctx.restore()
    }
  }

  if (cursor) {
    const [cx, cy] = cursor
    ctx.fillStyle = CURSOR
    if (cx >= RULER_SIZE && cx <= w) {
      ctx.beginPath()
      ctx.moveTo(cx - 4, RULER_SIZE)
      ctx.lineTo(cx + 4, RULER_SIZE)
      ctx.lineTo(cx, RULER_SIZE - 6)
      ctx.closePath()
      ctx.fill()
    }
    if (cy >= RULER_SIZE && cy <= h) {
      ctx.beginPath()
      ctx.moveTo(RULER_SIZE, cy - 4)
      ctx.lineTo(RULER_SIZE, cy + 4)
      ctx.lineTo(RULER_SIZE - 6, cy)
      ctx.closePath()
      ctx.fill()
    }
  }

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE)
  ctx.strokeStyle = BORDER
  ctx.strokeRect(0.5, 0.5, RULER_SIZE - 1, RULER_SIZE - 1)

  ctx.restore()
}

export function drawCursorCoords(
  ctx: CanvasRenderingContext2D,
  cursor: [number, number],
  t: ViewTransform,
  units: string,
  w: number,
  h: number,
) {
  if (cursor[0] < RULER_SIZE || cursor[1] < RULER_SIZE) return
  const [wx, wy] = fromScreen(cursor[0], cursor[1], t)
  const label = `X: ${wx.toFixed(2)}   Y: ${wy.toFixed(2)} ${units}`

  ctx.save()
  ctx.font = "11px sans-serif"
  const tw = ctx.measureText(label).width
  const x = RULER_SIZE + 8
  const y = h - 26
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y, tw + 14, 20, 4)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = "#404040"
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(label, x + 7, y + 10.5)
  ctx.restore()
}
