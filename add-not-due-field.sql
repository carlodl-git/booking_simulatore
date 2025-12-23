-- Script per aggiungere il campo 'not_due' alla tabella maestro_payments
-- Esegui questo script nel SQL Editor di Supabase

-- Aggiungi il campo not_due (default false per mantenere compatibilità con dati esistenti)
ALTER TABLE maestro_payments
ADD COLUMN IF NOT EXISTS not_due BOOLEAN NOT NULL DEFAULT FALSE;

-- Aggiungi un indice per performance sulle query che filtrano per not_due
CREATE INDEX IF NOT EXISTS idx_maestro_payments_not_due ON maestro_payments(not_due);

-- Commento per documentazione
COMMENT ON COLUMN maestro_payments.not_due IS 'Se true, il pagamento non è dovuto e non viene incluso nei calcoli di totale dovuto e totale incassato';



