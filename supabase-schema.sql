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
  activity_type TEXT NOT NULL CHECK (activity_type IN ('9', '18', 'pratica', 'mini-giochi')),
  players INTEGER NOT NULL CHECK (players >= 1 AND players <= 4),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  notes TEXT,
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

