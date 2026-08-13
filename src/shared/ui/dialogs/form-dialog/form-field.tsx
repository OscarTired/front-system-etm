type Props = {
  label: string
  error?: string
  children: React.ReactNode
}

export function FormField({
  label,
  error,
  children,
}: Props) {

  return (

    <div className="min-w-0 space-y-1.5">

      <p className="text-sm font-medium text-muted-foreground">

        {label}

      </p>

      {children}

      {error && (

        <p className="text-xs font-medium text-red-400">

          * {error}

        </p>

      )}

    </div>

  )

}