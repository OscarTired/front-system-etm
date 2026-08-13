import type {
  LucideIcon,
} from "lucide-react"

type Props = {
  title: string

  icon: LucideIcon

  children: React.ReactNode
}

export function FormSection({
  title,
  icon: Icon,
  children,
}: Props) {

  return (

    <section className="space-y-4 border-b border-border pb-5 last:border-none">

      <div className="flex items-center gap-2">

        <Icon
          size={16}
          className="text-muted-foreground"
        />

        <h3 className="text-xs font-bold uppercase tracking-[0.20em] text-muted-foreground">

          {title}

        </h3>

      </div>

      {children}

    </section>

  )

}