import { createClient } from '@supabase/supabase-js'
import { validateEnv } from './env-check'

// Valida variabili d'ambiente all'import (solo in produzione)
if (process.env.NODE_ENV === 'production') {
  validateEnv()
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // bypass RLS nelle API server
  { auth: { persistSession: false } }
)

