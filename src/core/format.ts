/**
 * Utilidad pura para formatear cifras grandes (1K, 1.5M, 2.3B, 10T...)
 * Cumple con agentrules.md: Cero dependencias de DOM/Canvas.
 */

const SUFFIXES: string[] = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * Formatea un número numérico a una representación legible retro compacta.
 * Ejemplos:
 *  - 42 => "42"
 *  - 1200 => "1.2K"
 *  - 1500000 => "1.5M"
 *  - 2340000000 => "2.3B"
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (value < 0) return '-' + formatNumber(-value, decimals);
  if (value < 1000) {
    // Si no tiene decimales significativos, mostrar entero
    return Number.isInteger(value) ? value.toString() : value.toFixed(decimals);
  }

  const tier = Math.min(
    Math.floor(Math.log10(value) / 3),
    SUFFIXES.length - 1
  );

  if (tier === 0) {
    return value.toFixed(decimals);
  }

  const suffix = SUFFIXES[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = value / scale;

  // Si tiene decimales limpios, ej. 1.0K -> 1K
  const formatted = scaled.toFixed(decimals);
  const cleanFormatted = formatted.endsWith('.0')
    ? formatted.slice(0, -2)
    : formatted;

  return `${cleanFormatted}${suffix}`;
}
