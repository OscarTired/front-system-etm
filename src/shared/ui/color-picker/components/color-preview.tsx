import { forwardRef } from 'react';

/**
 * Botón trigger: swatch de color + código hex, sin iconos.
 * Única responsabilidad: presentación del valor actual como trigger clicable.
 */
export interface ColorPreviewProps {
  hex: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  /**
   * false: el trigger es un bloque sólido pintado del color, sin
   * círculo ni texto hex adentro — para cuando el hex ya se muestra
   * en un campo aparte al lado, y repetirlo acá se ve redundante.
   * true (default): swatch + código hex, como estaba originalmente.
   */
  showLabel?: boolean;
}

export const ColorPreview = forwardRef<HTMLButtonElement, ColorPreviewProps>(
  ({ hex, disabled, className, onClick, showLabel = true, ...rest }, ref) => {

    if (!showLabel) {
      return (
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={[
            'block',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            className ?? '',
          ].join(' ')}
          style={{ backgroundColor: hex }}
          {...rest}
        />
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={[
          'flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium',
          'bg-foreground/5 border border-transparent hover:bg-foreground/10',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
          className ?? '',
        ].join(' ')}
        {...rest}
      >
        <span
          className="w-4 h-4 rounded-full border border-border shrink-0"
          style={{ backgroundColor: hex }}
        />
        <span className="text-muted-foreground font-mono text-xs">{hex}</span>
      </button>
    );
  },
);

ColorPreview.displayName = 'ColorPreview';