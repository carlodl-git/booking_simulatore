-- Script SQL per aggiungere il campo maestro_email alla tabella maestro_payments
-- Esegui questo script nel SQL Editor di Supabase

-- Aggiungi la colonna maestro_email
ALTER TABLE maestro_payments 
ADD COLUMN IF NOT EXISTS maestro_email TEXT;

-- Aggiorna i record esistenti con l'email dal booking
UPDATE maestro_payments mp
SET maestro_email = (
  SELECT c.email
  FROM bookings b
  JOIN customers c ON b.customer_id = c.id
  WHERE b.id = mp.booking_id
)
WHERE maestro_email IS NULL;

-- Rendi la colonna NOT NULL dopo aver popolato i dati
ALTER TABLE maestro_payments 
ALTER COLUMN maestro_email SET NOT NULL;

-- Aggiungi indice per performance
CREATE INDEX IF NOT EXISTS idx_maestro_payments_email ON maestro_payments(maestro_email);

