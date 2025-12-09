import { createClient } from '@supabase/supabase-js'
import { validateEnv } from './env-check'

// Nota: La validazione delle variabili d'ambiente viene fatta a runtime, non durante il build
// per evitare errori durante il build di Next.js quando le variabili non sono disponibili

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // bypass RLS nelle API server
  { auth: { persistSession: false } }
)

// Valida variabili d'ambiente al primo utilizzo (lazy validation)
let envValidated = false
export function ensureEnvValidated() {
  if (!envValidated && process.env.NODE_ENV === 'production') {
    validateEnv()
    envValidated = true
  }
}

