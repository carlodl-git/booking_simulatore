-- Aggiunge il campo admin_notes alla tabella bookings
-- Esegui questo script nel SQL Editor di Supabase

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

