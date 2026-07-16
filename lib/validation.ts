export const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$";

/**
 * Normaliza un correo para evitar duplicados por mayúsculas o espacios.
 */
export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Validación práctica de correo electrónico para formularios de registro.
 * No intenta comprobar que el buzón exista; valida únicamente su estructura.
 */
export function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);

  if (!email || email.length > 254) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart || localPart.length > 64 || !domain) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false;

  const domainLabels = domain.split('.');
  if (domainLabels.length < 2) return false;

  const labelPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!domainLabels.every((label) => labelPattern.test(label))) return false;

  const topLevelDomain = domainLabels.at(-1) ?? '';
  return /^[a-z]{2,63}$/i.test(topLevelDomain);
}
