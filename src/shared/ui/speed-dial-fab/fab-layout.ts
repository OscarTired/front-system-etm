// Fuente única para el posicionamiento de los FABs flotantes de
// mobile (Nueva tarea/proyecto/usuario/etc. + SpeedDialFab) — antes
// cada uno calculaba su propio bottom/right por separado, con
// valores que no coincidían entre sí, así que se veían
// desalineados/separados en vez de un grupo prolijo.
//
// Importante: acá SOLO viven números para usar en `style` inline
// (el right, que es genuinamente dinámico/calculado). El `bottom`
// y el `z-index` se escriben como clase de Tailwind LITERAL en cada
// componente ("bottom-22", "z-[60]") — construir el nombre de una
// clase de Tailwind armando un string en JS (por más que el string
// final sea "válido") es algo que el propio equipo de Tailwind
// recomienda evitar: su scanner busca el texto completo de la clase
// tal cual aparece en el archivo, no lo arma leyendo variables de
// JS. Si el bottom viviera acá como string y se interpolara en el
// className, esa clase nunca se generaría — el elemento quedaría
// sin posición y caería a donde sea que lo ubique el flujo normal
// del DOM (exactamente el bug que causó esto).

/** Alto/ancho de cualquier FAB circular de esta fila. */
export const FAB_SIZE_PX = 48

/** Separación desde el borde derecho para el FAB más externo
 * (el SpeedDialFab, el más a la derecha del grupo). */
export const FAB_RIGHT_OFFSET_PX = 16

/** Espacio entre FABs del mismo grupo. */
export const FAB_GAP_PX = 12

/** Separación desde el borde derecho para el FAB que va INMEDIATAMENTE
 * a la izquierda del más externo — calculado, no adivinado a mano,
 * para que siempre quede pegado con el mismo espacio sin importar si
 * el tamaño de alguno cambia en el futuro. */
export const FAB_SECOND_RIGHT_OFFSET_PX =
  FAB_RIGHT_OFFSET_PX + FAB_SIZE_PX + FAB_GAP_PX