import * as Popover from '@radix-ui/react-popover';
import { useRef, useState } from 'react';
import { ColorCanvas } from '../components/color-canvas';
import { ColorPreview } from '../components/color-preview';
import { HueSlider } from '../components/hue-slider';
import { useColor } from '../hooks/use-color';
import { useHexFormat } from '../hooks/use-hex-format';
import type { HexColorPickerProps } from '../types/types';

/**
 * HexColorPicker público del Design System.
 * Única responsabilidad: orquestar Popover (Radix) + canvas + slider + input.
 *
 * Uso:
 * <HexColorPicker value={color} onChange={setColor} />
 */
export function HexColorPicker({
  value = null,
  onChange,
  disabled,
  className,
  showLabel = true,
}: HexColorPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { hsv, hex, setHue, setSaturationAndValue, setFromHex } = useColor({ value, onChange });

  const { inputValue, handleInputChange, handleInputBlur, handleInputKeyDown } = useHexFormat({
    hex,
    onCommit: setFromHex,
  });

  return (
    <Popover.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <Popover.Trigger asChild>
        <ColorPreview
          ref={triggerRef}
          hex={hex}
          disabled={disabled}
          className={className}
          showLabel={showLabel}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={[
            'z-50 w-58 p-3 rounded-lg shadow-lg flex flex-col gap-3',

            'dark:bg-popover dark:border-neutral-800',
            'animate-in fade-in-0 zoom-in-95',
          ].join(' ')}
        >
          <ColorCanvas
            hue={hsv.h}
            saturation={hsv.s}
            value={hsv.v}
            onChange={setSaturationAndValue}
          />
          <HueSlider hue={hsv.h} onChange={setHue} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}