/**
 * Valida che tutte le variabili d'ambiente obbligatorie siano presenti
 * Chiamare all'avvio dell'applicazione
 */
export function validateEnv(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const error = `❌ ERRORE: Variabili d'ambiente mancanti: ${missing.join(', ')}\n` +
      `Assicurati di aver configurato tutte le variabili obbligatorie nel file .env.local o nel pannello di hosting.`
    
    console.error(error)
    
    // In produzione, lancia errore per bloccare l'avvio
    if (process.env.NODE_ENV === 'production') {
      throw new Error(error)
    }
  }
  
  // Warning per variabili consigliate ma non obbligatorie
  const recommended = [
    'RESEND_API_KEY',
    'ADMIN_EMAIL',
  ]
  
  const missingRecommended = recommended.filter(key => !process.env[key])
  if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(`⚠️ WARNING: Variabili consigliate mancanti: ${missingRecommended.join(', ')}`)
  }
}

