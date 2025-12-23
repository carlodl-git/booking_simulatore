-- Funzione SQL per calcolare il revenue totale in modo efficiente
-- Esegui questo script nel SQL Editor di Supabase per ottimizzare il calcolo del revenue

CREATE OR REPLACE FUNCTION calculate_total_revenue(before_date TIMESTAMPTZ)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      CASE 
        WHEN activity_type = 'lezione-maestro' THEN (duration_minutes / 60.0) * 10.0
        ELSE (duration_minutes / 60.0) * 20.0
      END
    ), 0)
    FROM bookings
    WHERE status = 'confirmed'
      AND starts_at < before_date
  );
END;
$$ LANGUAGE plpgsql;

-- Commento: questa funzione calcola il revenue direttamente nel database
-- invece di caricare tutti i dati in memoria, riducendo drasticamente
-- il consumo di risorse e migliorando le performance




