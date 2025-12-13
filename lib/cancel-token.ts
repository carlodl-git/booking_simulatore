import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Genera un token sicuro per la cancellazione di una prenotazione
 * Il token è formato da: bookingId + HMAC(bookingId, secret) codificato in base64url
 */
export function generateCancelToken(bookingId: string): string {
  const secret = process.env.BOOKING_CANCEL_SECRET || 'default-secret-change-in-production'
  
  // Crea HMAC del bookingId
  const hmac = createHmac('sha256', secret)
  hmac.update(bookingId)
  const signature = hmac.digest('base64url')
  
  // Combina bookingId e signature, poi codifica in base64url per essere URL-safe
  const token = Buffer.from(`${bookingId}:${signature}`).toString('base64url')
  
  return token
}

/**
 * Valida un token di cancellazione e restituisce il bookingId se valido
 * @throws Error se il token non è valido
 */
export function validateCancelToken(token: string): string {
  try {
    // Decodifica il token
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [bookingId, signature] = decoded.split(':')
    
    if (!bookingId || !signature) {
      throw new Error('Token formato non valido')
    }
    
    // Rigenera la signature e confronta
    const secret = process.env.BOOKING_CANCEL_SECRET || 'default-secret-change-in-production'
    const hmac = createHmac('sha256', secret)
    hmac.update(bookingId)
    const expectedSignature = hmac.digest('base64url')
    
    // Usa timing-safe comparison per prevenire timing attacks
    const signatureBuffer = Buffer.from(signature, 'base64url')
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url')
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      throw new Error('Token non valido')
    }
    
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      throw new Error('Token non valido')
    }
    
    return bookingId
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Errore nella validazione del token')
  }
}

