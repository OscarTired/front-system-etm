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
 * Enmascara la entrada en dd/MM/aaaa.
 *
 * Dos modos:
 * 1) Con "/": respeta segmentos (día / mes / año). Así, si el usuario
 *    selecciona solo el día en "08/08/2026" y escribe "2", queda
 *    "2/08/2026" y luego "20/08/2026" — no "20/82/026".
 * 2) Solo dígitos (escritura secuencial desde vacío): inserta "/" sola.
 */
export function sanitizeDateInput(raw: string): string {
  if (raw.includes('/')) {
    const parts = raw.split('/');

    const day = (parts[0] ?? '').replace(/\D/g, '').slice(0, 2);
    const month = (parts[1] ?? '').replace(/\D/g, '').slice(0, 2);
    const year = parts.slice(2).join('').replace(/\D/g, '').slice(0, 4);

    const slashCount = parts.length - 1;

    if (slashCount >= 2 || year.length > 0) {
      return `${day}/${month}/${year}`;
    }
    if (slashCount >= 1 || month.length > 0) {
      return `${day}/${month}`;
    }
    return day;
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}