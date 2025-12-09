/**
 * Utility functions per validazione input
 */

/**
 * Valida formato UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Valida lunghezza stringa
 */
export function validateStringLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max
}

/**
 * Valida formato email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Valida formato telefono (italiano)
 */
export function isValidPhone(phone: string): boolean {
  // Accetta: +39, 0039, o senza prefisso (10 cifre)
  const phoneRegex = /^(\+39|0039)?[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Sanitizza stringa per prevenire XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Rimuovi < e >
    .trim()
}

/**
 * Valida resource ID
 */
export function isValidResourceId(resourceId: string): boolean {
  const validResourceIds = ['trackman-io'] // Aggiungi altri resource ID validi se necessario
  return validResourceIds.includes(resourceId)
}

