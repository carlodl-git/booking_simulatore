-- Tabella per gestire gli orari settimanali di apertura e chiusura
-- Un record per ogni giorno della settimana (0 = domenica, 1 = lunedì, ..., 6 = sabato)
CREATE TABLE IF NOT EXISTS weekly_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id TEXT NOT NULL DEFAULT 'trackman-io',
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = domenica, 6 = sabato
  open_time TIME NOT NULL, -- Orario di apertura (HH:mm:ss)
  close_time TIME NOT NULL, -- Orario di chiusura (HH:mm:ss)
  is_closed BOOLEAN NOT NULL DEFAULT FALSE, -- Se true, il giorno è chiuso
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un solo record per giorno della settimana per ogni resource_id
  CONSTRAINT unique_weekly_hours_resource_day UNIQUE (resource_id, day_of_week),
  
  -- Validazione: close_time deve essere > open_time (a meno che non sia chiuso)
  CONSTRAINT weekly_hours_valid_time_range CHECK (
    is_closed = TRUE OR close_time > open_time
  )
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_weekly_hours_resource ON weekly_hours(resource_id);
CREATE INDEX IF NOT EXISTS idx_weekly_hours_day ON weekly_hours(day_of_week);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_weekly_hours_updated_at
  BEFORE UPDATE ON weekly_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserisci valori di default (09:30 - 23:00 per tutti i giorni)
-- Se non esistono già record per questo resource_id
INSERT INTO weekly_hours (resource_id, day_of_week, open_time, close_time, is_closed)
SELECT 
  'trackman-io',
  day_num,
  '09:30:00',
  '23:00:00',
  false
FROM generate_series(0, 6) AS day_num
WHERE NOT EXISTS (
  SELECT 1 FROM weekly_hours 
  WHERE resource_id = 'trackman-io' AND day_of_week = day_num
)
ON CONFLICT (resource_id, day_of_week) DO NOTHING;

