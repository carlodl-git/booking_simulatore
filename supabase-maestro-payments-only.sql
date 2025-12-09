-- Script SQL per aggiungere la tabella maestro_payments
-- Esegui questo script nel SQL Editor di Supabase

-- Tabella per tracciare i pagamenti dei maestri
CREATE TABLE IF NOT EXISTS maestro_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  maestro_name TEXT NOT NULL, -- Nome completo del maestro (preso dal customer della prenotazione)
  amount DECIMAL(10, 2) NOT NULL DEFAULT 10.00, -- Importo dovuto (10€ per lezione)
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ, -- Data/ora del pagamento
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un maestro può avere un solo pagamento per prenotazione
  CONSTRAINT unique_booking_payment UNIQUE (booking_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_maestro_payments_maestro ON maestro_payments(maestro_name);
CREATE INDEX IF NOT EXISTS idx_maestro_payments_booking ON maestro_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_maestro_payments_paid ON maestro_payments(paid);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_maestro_payments_updated_at
  BEFORE UPDATE ON maestro_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

