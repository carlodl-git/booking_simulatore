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

---

## 🔴 Problemi Aggiuntivi Identificati

### 7. **Cache-busting eccessivo nel frontend**
**Problema**: Tutti i fetch nel frontend usano `Date.now()` come query param e `cache: 'no-store'`, bypassando completamente la cache del server che abbiamo aggiunto.

**Impatto**: Alto - la cache del server viene completamente ignorata, ogni richiesta va al server.

**File interessati**:
- `app/book/page.tsx` - riga 304-305
- `app/admin/bookings/page.tsx` - riga 90
- `app/admin/bookings/history/page.tsx` - riga 78
- `app/admin/maestri/page.tsx` - righe 67, 103

**Soluzione**: Rimuovere cache-busting e `cache: 'no-store'` dal frontend, lasciare che la cache del server funzioni.

### 8. **Export CSV con limite troppo alto**
**Problema**: `app/api/admin/export-csv/route.ts` chiama `getAllBookings(10000)` che può essere molto pesante.

**Impatto**: Alto - può causare timeout o memory issues con molti dati.

**Soluzione**: 
- Rimuovere il limite o aumentarlo solo se necessario
- Considerare streaming per CSV grandi
- Aggiungere timeout appropriato

### 9. **Filtering lato client invece che lato server**
**Problema**: In `app/admin/bookings/page.tsx`, i filtri vengono applicati lato client su tutti i bookings caricati (fino a 1000), invece che lato server.

**Impatto**: Medio - trasferisce più dati del necessario e fa filtering pesante lato client.

**Soluzione**: Implementare filtri lato server nell'API, caricare solo i dati filtrati.

### 10. **Logging eccessivo nel frontend**
**Problema**: Molti `console.log` nel frontend (specialmente in `app/book/page.tsx` e `app/admin/bookings/page.tsx`) che possono rallentare l'app.

**Impatto**: Medio - può rallentare l'esecuzione JavaScript nel browser.

**Soluzione**: Rimuovere o condizionare i log solo in sviluppo.

### 11. **Mancanza di debouncing per chiamate API**
**Problema**: Le chiamate API vengono fatte immediatamente quando l'utente cambia input (es. data nel form di prenotazione).

**Impatto**: Basso-Medio - può causare richieste multiple se l'utente cambia rapidamente i valori.

**Soluzione**: Implementare debouncing per chiamate API non critiche (es. ricerca, filtri).

### 12. **applyFilters eseguito troppo spesso**
**Problema**: `applyFilters` in `app/admin/bookings/page.tsx` viene eseguito ad ogni cambio di dipendenza e fa filtering/sorting su array potenzialmente grandi (1000+ elementi).

**Impatto**: Medio - può causare lag nell'UI durante il filtering.

**Soluzione**: 
- Usare `useMemo` per memoizzare i risultati filtrati
- Ottimizzare gli algoritmi di filtering
- Considerare virtualizzazione per liste grandi

### 13. **Query con JOIN pesanti**
**Problema**: `getAllBookings()` fa JOIN con la tabella `customers` per ogni booking, caricando molti dati.

**Impatto**: Medio - aumenta la dimensione della risposta e il tempo di query.

**Soluzione**: 
- Considerare query separate se non servono sempre i dati customer
- Usare select specifici invece di `*`
- Implementare lazy loading per dati customer

## 📊 Priorità Aggiornata

1. ✅ **COMPLETATO**: Fix query N+1 in `syncMaestroPayments()`
2. ✅ **COMPLETATO**: Rimuovere `force-dynamic` dalle route non critiche
3. ✅ **COMPLETATO**: Ridurre limite `getAllBookings()` da 5000 a 1000
4. ✅ **COMPLETATO**: Ridurre logging in produzione
5. 🔴 **URGENTE**: Rimuovere cache-busting dal frontend (bypassa cache server)
6. 🟡 **ALTA**: Ottimizzare export CSV (limite 10000 troppo alto)
7. 🟡 **ALTA**: Implementare filtri lato server invece che lato client
8. 🟢 **MEDIA**: Rimuovere logging eccessivo dal frontend
9. 🟢 **MEDIA**: Aggiungere debouncing per chiamate API
10. 🟢 **MEDIA**: Ottimizzare `applyFilters` con `useMemo`

---

## 🔴 Problemi Aggiuntivi Identificati (Seconda Analisi)

### 14. **Calcolo revenue in memoria invece che nel database**
**Problema**: `getTotalRevenueFromPastBookings()` in `lib/repo.ts` carica tutte le prenotazioni passate e fa il calcolo in JavaScript invece che con SQL aggregation.

**Impatto**: Alto - carica migliaia di record solo per sommare valori, trasferisce dati inutili.

**Soluzione**: Usare SQL aggregation (`SUM`, `CASE`) per calcolare il revenue direttamente nel database.

### 15. **Logging eccessivo in `lib/availability.ts`**
**Problema**: La funzione `calculateAllOccupiedSlots` ha molti `console.log` che vengono eseguiti ad ogni chiamata (righe 198-230).

**Impatto**: Medio - può rallentare il calcolo degli slot disponibili.

**Soluzione**: Rimuovere o condizionare i log solo in sviluppo.

### 16. **DateTime.now() chiamato ripetutamente**
**Problema**: In `applyFilters` (sia in bookings che history) viene chiamato `DateTime.now()` ad ogni render/calcolo.

**Impatto**: Basso-Medio - overhead minimo ma può essere ottimizzato.

**Soluzione**: Memoizzare `today` o calcolarlo una volta sola.

### 17. **Query senza limiti per revenue**
**Problema**: `getTotalRevenueFromPastBookings()` carica tutte le prenotazioni passate senza limite.

**Impatto**: Medio - può caricare migliaia di record inutili.

**Soluzione**: Usare SQL aggregation invece di caricare tutti i dati.

### 18. **Middleware eseguito su tutte le richieste**
**Problema**: Il middleware viene eseguito su tutte le richieste (tranne quelle esplicitamente escluse), anche su file statici.

**Impatto**: Basso-Medio - overhead minimo ma può essere ottimizzato.

**Soluzione**: Escludere più route statiche o ottimizzare la logica del middleware.

### 19. **Immagini non ottimizzate**
**Problema**: Ci sono immagini JPG e PNG in `/public` che potrebbero essere convertite in WebP o ottimizzate.

**Impatto**: Basso-Medio - aumenta il tempo di caricamento delle pagine.

**Soluzione**: Convertire immagini in WebP e usare Next.js Image optimization.

### 20. **Mancanza di indici compositi per query comuni**
**Problema**: Potrebbero mancare indici compositi per query frequenti come:
- `(status, starts_at)` per filtri comuni
- `(resource_id, status, starts_at)` per query di disponibilità

**Impatto**: Medio - query potrebbero essere più lente con molti dati.

**Soluzione**: Analizzare query plan e aggiungere indici compositi se necessario.

## 📊 Priorità Aggiornata (Seconda Analisi)

1. ✅ **COMPLETATO**: Fix query N+1 in `syncMaestroPayments()`
2. ✅ **COMPLETATO**: Rimuovere `force-dynamic` dalle route non critiche
3. ✅ **COMPLETATO**: Ridurre limite `getAllBookings()` da 5000 a 1000
4. ✅ **COMPLETATO**: Ridurre logging in produzione
5. ✅ **COMPLETATO**: Rimuovere cache-busting dal frontend
6. ✅ **COMPLETATO**: Ottimizzare export CSV
7. ✅ **COMPLETATO**: Ottimizzare `applyFilters` con `useMemo`
8. 🔴 **URGENTE**: Calcolare revenue nel database invece che in memoria
9. 🟡 **ALTA**: Rimuovere logging eccessivo da `lib/availability.ts`
10. 🟡 **ALTA**: Memoizzare `DateTime.now()` in `applyFilters`
11. 🟢 **MEDIA**: Ottimizzare middleware per escludere più route
12. 🟢 **MEDIA**: Convertire immagini in WebP
13. 🟢 **MEDIA**: Aggiungere indici compositi se necessario

