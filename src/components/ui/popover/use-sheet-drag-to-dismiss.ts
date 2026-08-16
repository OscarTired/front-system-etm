"use client"

/**
 * @deprecated El sheet mobile usa Vaul (`Drawer`).
 * Este módulo queda vacío a propósito para no romper imports residuales.
 * No reintroducir gesture handlers manuales.
 */

export function useSheetDragToDismiss(_close: () => void, _isOpen: boolean) {
  return {
    dragY: 0,
    isDragging: false,
    dismissing: false,
    dragHandleProps: {},
    contentDragProps: {},
  }
}
