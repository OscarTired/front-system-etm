// Posición del FAB flotante único de mobile (filtro/orden/
// historial/exportar/crear, todo junto en un solo SpeedDialFab).
//
// El bottom se escribe como clase de Tailwind LITERAL en cada
// componente ("bottom-22") — construir el nombre de una clase de
// Tailwind armando un string en JS es algo que el propio equipo de
// Tailwind recomienda evitar: su scanner busca el texto completo de
// la clase tal cual aparece en el archivo, no lo arma leyendo
// variables. Acá solo vive el número que sí es genuinamente dinámico
// (el right, vía `style` inline).

/** Separación desde el borde derecho del FAB. */
export const FAB_RIGHT_OFFSET_PX = 16