// Con esto, TopBar/BottomNavigation y quien necesite compensar su
// espacio (AppListScroll, y cualquier página que no pase por ahí)
// leen el MISMO número con nombre. Si el TopBar cambia de alto algún
// día, se cambia una vez, acá.

/** Alto real del TopBar flotante (h-14 = 3.5rem). */
export const TOP_BAR_HEIGHT_PX = 56

/** Espacio reservado para el BottomNavigation flotante (pill +
 * padding + safe-area aproximado). */
export const BOTTOM_NAV_HEIGHT_PX = 80
/** Alto de la barra de búsqueda expandida bajo el TopBar (móvil). */
/** Input ~36px + mismo aire que topbar→rows (~8). */
export const PAGE_SEARCH_BAR_HEIGHT_PX = 40
