-- Schema Supabase/PostgreSQL per il sistema di prenotazioni
-- Esegui questo script nel SQL Editor di Supabase

-- Abilita estensione per UUID e EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Tabella customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('socio', 'esterno')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per email (già UNIQUE, ma esplicitiamo per performance)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Tabella bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  resource_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('9', '18', 'pratica', 'mini-giochi', 'lezione-maestro')),
  players INTEGER NOT NULL CHECK (players >= 1 AND players <= 4),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  notes TEXT,
  customer_first_name TEXT,
  customer_last_name TEXT,
  customer_phone TEXT,
  customer_user_type TEXT CHECK (customer_user_type IN ('socio', 'esterno')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint EXCLUDE per prevenire sovrapposizioni
  -- Solo per prenotazioni confirmed sulla stessa resource_id
  CONSTRAINT no_overlap_confirmed_bookings EXCLUDE USING gist (
    resource_id WITH =,
    tsrange(starts_at, ends_at) WITH &&
  ) WHERE (status = 'confirmed')
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_bookings_resource_date ON bookings(resource_id, starts_at) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_starts_at ON bookings(starts_at) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabella blackouts per eventi/chiusure
CREATE TABLE IF NOT EXISTS blackouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id TEXT NOT NULL DEFAULT 'trackman-io',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- NULL = tutto il giorno
  end_time TIME,   -- NULL = tutto il giorno
  reason TEXT,     -- Motivo del blackout (es. "Evento speciale", "Manutenzione")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validazione: end_date >= start_date
  CONSTRAINT blackout_valid_date_range CHECK (end_date >= start_date),
  
  -- Validazione: se start_time è specificato, anche end_time deve esserlo
  CONSTRAINT blackout_valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL)
  )
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_blackouts_resource_date ON blackouts(resource_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_blackouts_date_range ON blackouts USING gist (daterange(start_date, end_date, '[]'));

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_blackouts_updated_at
  BEFORE UPDATE ON blackouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabella per tracciare i pagamenti dei maestri
CREATE TABLE IF NOT EXISTS maestro_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  maestro_name TEXT NOT NULL, -- Nome completo del maestro (preso dal customer della prenotazione)
  maestro_email TEXT NOT NULL, -- Email del maestro (per raggruppare maestri con stessa email)
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
CREATE INDEX IF NOT EXISTS idx_maestro_payments_email ON maestro_payments(maestro_email);
CREATE INDEX IF NOT EXISTS idx_maestro_payments_booking ON maestro_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_maestro_payments_paid ON maestro_payments(paid);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_maestro_payments_updated_at
  BEFORE UPDATE ON maestro_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

