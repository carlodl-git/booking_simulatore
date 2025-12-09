# Problemi di Performance Identificati

## 🔴 Problemi Critici

### 1. **Query N+1 in `syncMaestroPayments()`**
**Problema**: La funzione fa una query al database per ogni prenotazione per recuperare l'email del customer (righe 631-635 in `lib/repo.ts`). Se ci sono 100 prenotazioni, vengono eseguite 100+ query separate.

**Impatto**: Alto - può causare centinaia di query al database per una singola richiesta.

**Soluzione**: Recuperare tutti i customers in una singola query usando `IN` con tutti i `customer_id`.

### 2. **Tutte le route API hanno `force-dynamic`**
**Problema**: Tutte le route API hanno `export const dynamic = "force-dynamic"` che disabilita completamente la cache e forza il rendering dinamico ad ogni richiesta.

**Impatto**: Molto Alto - ogni richiesta viene processata dal server invece di essere servita dalla cache.

**Soluzione**: 
- Rimuovere `force-dynamic` dalle route che possono essere cachate (es. availability con breve TTL)
- Aggiungere cache appropriata con `revalidate` per route che cambiano raramente

### 3. **Query senza limiti o con limiti troppo alti**
**Problema**: `getAllBookings(5000)` recupera fino a 5000 record senza paginazione.

**Impatto**: Alto - trasferisce grandi quantità di dati ad ogni richiesta.

**Soluzione**: Implementare paginazione o ridurre il limite di default.

### 4. **Logging eccessivo in produzione**
**Problema**: Molti `console.log` in tutto il codice, specialmente in `lib/repo.ts` e `app/book/page.tsx`.

**Impatto**: Medio - può consumare risorse e rallentare l'applicazione.

**Soluzione**: Rimuovere o condizionare i log in base all'ambiente (solo in sviluppo).

## 🟡 Problemi Minori

### 5. **Cache completamente disabilitata**
**Problema**: Tutte le route hanno `Cache-Control: no-store` che impedisce qualsiasi caching.

**Impatto**: Medio - aumenta il carico sul server.

**Soluzione**: Abilitare cache appropriata per route che non cambiano frequentemente.

### 6. **Mancanza di debouncing nel frontend**
**Problema**: Il frontend potrebbe fare richieste multiple quando l'utente cambia rapidamente i filtri.

**Impatto**: Basso - può causare richieste ridondanti.

**Soluzione**: Implementare debouncing per le ricerche e filtri.

## 📊 Priorità di Intervento

1. **URGENTE**: Fix query N+1 in `syncMaestroPayments()`
2. **URGENTE**: Rimuovere `force-dynamic` dalle route non critiche
3. **ALTA**: Implementare paginazione per `getAllBookings()`
4. **MEDIA**: Ridurre logging in produzione
5. **MEDIA**: Abilitare cache appropriata

