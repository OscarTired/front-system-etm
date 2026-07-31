/**
 * Formateo/parseo de fechas para el formato de visualización dd/MM/yyyy.
 * Única responsabilidad: conversión Date <-> string, sin lógica de UI.
 */

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

/**
 * Parsea un string dd/MM/yyyy de forma estricta.
 * Devuelve `null` si el formato o la fecha calendárica no son válidos
 * (por ejemplo, 31/02/2026 se considera inválido).
 */
export function parseDateString(raw: string): Date | null {
  const match = DATE_PATTERN.exec(raw.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) return null;

  const candidate = new Date(year, month - 1, day);
  const isRealDate =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  return isRealDate ? candidate : null;
}

/**
 * Enmascara la entrada del usuario en formato dd/MM/aaaa, insertando
 * las "/" automáticamente a medida que escribe. Es necesario porque en
 * mobile el input usa inputMode="numeric": ese teclado nativo NO tiene
 * tecla "/", así que si no la insertamos nosotros el usuario nunca
 * puede escribir una fecha con separadores (solo dígitos pegados).
 *
 * Se recalcula desde los dígitos crudos en cada pulsación (se descarta
 * cualquier "/" que ya estuviera en `raw` y se reconstruye desde cero).
 * Esto hace que backspace funcione de forma natural: al borrar el
 * último dígito de un grupo, la "/" que lo seguía desaparece sola,
 * sin necesidad de rastrear posición de cursor a mano.
 */
export function sanitizeDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8); // dd(2) + MM(2) + aaaa(4)

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
}