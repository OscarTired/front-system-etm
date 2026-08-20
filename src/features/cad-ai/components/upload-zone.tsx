import { useCallback, useState, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload, ImageIcon, Loader2, ScanSearch, MessageSquareText,
  Layers, FileImage, PencilRuler, FileDown, Send, User, Bot,
} from "lucide-react"
import { OceanDither } from "./ocean-dither"
import type { ChatMessage } from "../types"

interface UploadZoneProps {
  onAnalyze: (file: File) => void
  onGenerate: (prompt: string) => void
  loading: boolean
  messages: ChatMessage[]
}

export function UploadZone({ onAnalyze, onGenerate, loading, messages }: UploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<"upload" | "chat">("upload")
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setPreview(URL.createObjectURL(file))
      onAnalyze(file)
    }
  }, [onAnalyze])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp"] },
    maxFiles: 1,
    disabled: loading,
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onGenerate(input.trim())
    setInput("")
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-gradient-to-b from-background via-background to-secondary/30 relative">
      <OceanDither />
      <div className={`flex-1 min-h-0 flex flex-col items-center justify-center px-6 relative transition-[padding] duration-300 ${mode === "chat" ? "py-4" : "py-10"}`}>
        <div className="max-w-2xl w-full h-full relative z-10 flex flex-col">
          <div className={`text-center flex-shrink-0 transition-[margin] duration-300 ${mode === "chat" ? "mb-2" : "mb-6"}`}>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-3 transition-all duration-300 ${
                mode === "upload" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 h-0 mb-0 overflow-hidden border-transparent py-0"
              }`}
            >
              <ScanSearch className="w-3.5 h-3.5" />
              Corte láser · DXF · IA
            </span>
            <h1 className={`font-bold tracking-tight text-foreground transition-all duration-300 ${mode === "chat" ? "text-xl mb-0" : "text-3xl mb-2"}`}>
              De la idea al <span className="text-primary">corte</span>
            </h1>
            <p
              className={`text-sm text-muted-foreground max-w-lg mx-auto transition-all duration-300 ${
                mode === "upload" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"
              }`}
            >
              Sube un plano o describe tu pieza — la IA genera el DXF listo para corte láser
            </p>
          </div>

          <div className={`relative flex items-center gap-1 rounded-lg border border-border bg-card/80 p-1 w-fit mx-auto flex-shrink-0 transition-[margin] duration-300 ${mode === "chat" ? "mb-3" : "mb-4"}`}>
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-primary shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: mode === "chat" ? "translateX(100%)" : "translateX(0)" }}
            />
            <button
              onClick={() => setMode("upload")}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "upload" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Subir plano
            </button>
            <button
              onClick={() => setMode("chat")}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "chat" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              Crear con chat
            </button>
          </div>

          <div className="relative flex-1 min-h-0">
            <div
              aria-hidden={mode !== "upload"}
              className={`absolute inset-0 overflow-y-auto flex flex-col transition-all duration-300 ease-out ${
                mode === "upload"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-2 scale-[0.99] invisible pointer-events-none"
              }`}
            >
              <div className="m-auto w-full flex flex-col py-2">
                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all bg-card/60 backdrop-blur-sm ${
                    isDragActive
                      ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
                      : "border-border hover:border-primary/50 hover:bg-card hover:shadow-md"
                  } ${loading ? "opacity-60 cursor-wait" : ""}`}
                >
                  <input {...getInputProps()} />
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-base font-medium text-foreground">Analizando plano...</p>
                      <p className="text-xs text-muted-foreground">La IA está detectando geometrías</p>
                    </div>
                  ) : preview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={preview} alt="Preview" className="max-h-48 rounded-lg shadow-md object-contain" />
                      <p className="text-xs text-muted-foreground">Click o arrastra otra imagen para reemplazar</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-3.5 rounded-full transition-colors ${isDragActive ? "bg-primary/10" : "bg-secondary"}`}>
                        {isDragActive ? (
                          <Upload className="w-8 h-8 text-primary" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-base font-medium text-foreground">
                          {isDragActive ? "Suelta la imagen aquí" : "Arrastra tu plano o haz click"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, WEBP, BMP · máx 20MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Step icon={FileImage} step="1" label="Sube tu plano" />
                  <Step icon={PencilRuler} step="2" label="Mide y edita" />
                  <Step icon={FileDown} step="3" label="Exporta DXF" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <FeatureCard icon={ScanSearch} title="Detección IA" description="Detecta líneas, círculos, arcos y agujeros" />
                  <FeatureCard icon={MessageSquareText} title="Iteración" description="Refina con lenguaje natural" />
                  <FeatureCard icon={Layers} title="Skills" description="Guarda y reutiliza piezas paramétricas" />
                </div>
              </div>
            </div>

            <div
              aria-hidden={mode !== "chat"}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
                mode === "chat"
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-[0.99] invisible pointer-events-none"
              }`}
            >
              <div className="relative flex flex-col w-full max-h-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
                <CornerMarks />

                <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-border/70 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Asistente de diseño</span>
                  </div>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase">DXF · IA</span>
                </div>

                <div ref={scrollRef} className="min-h-[112px] max-h-[300px] overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center min-h-[88px] text-center gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bot className="w-4 h-4 text-primary/60" />
                        <p className="text-sm">Describe la pieza que necesitas</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
                        {[
                          { icon: PencilRuler, text: "Rectángulo 100x50 con 4 agujeros Ø5" },
                          { icon: Layers, text: "L-bracket con pliegue a 90°" },
                          { icon: ScanSearch, text: "Círculo Ø80 con agujero central Ø20" },
                        ].map(({ icon: Icon, text }) => (
                          <button
                            key={text}
                            onClick={() => setInput(text)}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
                          >
                            <Icon className="w-3 h-3 flex-shrink-0 text-primary/70" />
                            {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ring-1 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground ring-primary/30" : "bg-secondary text-foreground ring-border"
                      }`}>
                        {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`flex-1 min-w-0 rounded-lg p-2.5 text-sm ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        {msg.geometry && (
                          <div className={`mt-2 flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] ${
                            msg.role === "user" ? "border-primary-foreground/25 text-primary-foreground/80" : "border-border text-muted-foreground"
                          }`}>
                            <Layers className="w-3 h-3 flex-shrink-0" />
                            {msg.geometry.entities.length} entidades · {msg.geometry.dimensions.width}×{msg.geometry.dimensions.height} {msg.geometry.units}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2.5">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center ring-1 ring-border">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm text-muted-foreground">
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                        </span>
                        Generando geometría
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-shrink-0 gap-2 border-t border-dashed border-border/70 bg-card/40 p-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe tu pieza: forma, dimensiones, agujeros, pliegues..."
                    rows={1}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none overflow-y-auto transition-shadow focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ maxHeight: 120 }}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="self-end rounded-md bg-primary p-2.5 text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CornerMarks() {
  const base = "pointer-events-none absolute w-3 h-3 border-primary/25"
  return (
    <>
      <span className={`${base} top-2 left-2 border-l-2 border-t-2 rounded-tl-[2px]`} />
      <span className={`${base} top-2 right-2 border-r-2 border-t-2 rounded-tr-[2px]`} />
      <span className={`${base} bottom-2 left-2 border-l-2 border-b-2 rounded-bl-[2px]`} />
      <span className={`${base} bottom-2 right-2 border-r-2 border-b-2 rounded-br-[2px]`} />
    </>
  )
}

function Step({ icon: Icon, step, label }: { icon: typeof FileImage; step: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card/70 px-3 py-2.5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
        {step}
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-medium text-foreground truncate">{label}</span>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof ScanSearch; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
