# Audit Completo del Codice - Problemi Identificati

## 🔴 Problemi Critici

### 21. **Query con SELECT * invece di colonne specifiche**
**Problema**: 4 query in `lib/repo.ts` usano `select('*')` invece di selezionare solo le colonne necessarie:
- `getBlackoutsForDateRange()` - riga 425
- `getAllBlackouts()` - riga 446
- `getMaestroSummaries()` - riga 707
- `getMaestroPayments()` - riga 772 (probabilmente)

**Impatto**: Alto - trasferisce dati non necessari, aumenta memoria e latenza.

**Soluzione**: Specificare solo le colonne necessarie in ogni query.

### 22. **Logging eccessivo in produzione (app/api/bookings/route.ts)**
**Problema**: Molti `console.log` e `JSON.stringify` in produzione (righe 11, 102-133, 152, 156, 160-161, 182, 186, 191-194, 197).

**Impatto**: Medio - può rallentare le richieste e consumare risorse.

**Soluzione**: Usare `debugLog()` helper o rimuovere i log non critici.

### 23. **Console.log residui in BookPage**
**Problema**: 
- Riga 186: `console.log("BookPage component loaded...")`
- Riga 278: `console.log('[BookPage] useEffect triggered...')`

**Impatto**: Basso - ma dovrebbe essere rimosso per coerenza.

**Soluzione**: Rimuovere o usare `debugLog()`.

## 🟡 Problemi di Performance

### 24. **OccupiedSlots.includes() in loop (O(n²))**
**Problema**: In `checkAvailability()` (app/book/page.tsx:142), `occupiedSlots.includes(slot)` viene chiamato in un loop, creando complessità O(n²).

**Impatto**: Medio - può rallentare con molti slot occupati.

**Soluzione**: Convertire `occupiedSlots` in `Set` per lookup O(1).

### 25. **Query getAllBookings con SELECT * e JOIN**
**Problema**: `getAllBookings()` usa `select('*, customer:customers(*)')` che carica tutti i campi anche se non servono sempre.

**Impatto**: Medio - aumenta la dimensione della risposta.

**Soluzione**: Specificare solo le colonne necessarie.

### 26. **Dipendenza date-fns non utilizzata**
**Problema**: `date-fns` è nel `package.json` ma viene usata solo in `components/ui/date-picker.tsx`. Il resto del codice usa `luxon`.

**Impatto**: Basso - aumenta il bundle size inutilmente.

**Soluzione**: Valutare se rimuovere `date-fns` o standardizzare su una libreria.

### 27. **JSON.stringify in console.log**
**Problema**: `JSON.stringify(result, null, 2)` viene usato in `console.log` in produzione (app/api/bookings/route.ts).

**Impatto**: Basso-Medio - può essere costoso per oggetti grandi.

**Soluzione**: Rimuovere o condizionare solo in sviluppo.

### 28. **Mancanza di cleanup in useEffect**
**Problema**: Alcuni `useEffect` potrebbero beneficiare di cleanup per evitare memory leaks (es. fetch in corso quando il componente si smonta).

**Impatto**: Basso-Medio - potenziali memory leaks.

**Soluzione**: Aggiungere cleanup functions dove necessario.

## 🟢 Problemi Minori / Code Quality

### 29. **Array.includes() invece di Set per lookup frequenti**
**Problema**: `normalizedOccupied.includes(time)` in `time-slot-picker.tsx` viene chiamato molte volte.

**Impatto**: Basso - ma potrebbe essere ottimizzato.

**Soluzione**: Usare `Set` per lookup O(1).

### 30. **Mancanza di error boundaries**
**Problema**: Non ci sono error boundaries React per gestire errori inattesi.

**Impatto**: Basso - ma migliorerebbe la robustezza.

**Soluzione**: Aggiungere error boundaries.

### 31. **Validazione input lato server incompleta**
**Problema**: Alcune validazioni potrebbero essere più rigorose (es. lunghezza email, formato telefono).

**Impatto**: Basso - ma migliorerebbe la sicurezza.

**Soluzione**: Aggiungere validazioni più rigorose.

### 32. **Mancanza di rate limiting**
**Problema**: Non c'è rate limiting sulle API pubbliche.

**Impatto**: Basso-Medio - rischio di abuso.

**Soluzione**: Implementare rate limiting per API critiche.

## 📊 Priorità di Intervento (Audit Completo)

1. ✅ **COMPLETATO**: Fix query N+1 in `syncMaestroPayments()`
2. ✅ **COMPLETATO**: Rimuovere `force-dynamic` dalle route non critiche
3. ✅ **COMPLETATO**: Ridurre limite `getAllBookings()` da 5000 a 1000
4. ✅ **COMPLETATO**: Ridurre logging in produzione
5. ✅ **COMPLETATO**: Rimuovere cache-busting dal frontend
6. ✅ **COMPLETATO**: Ottimizzare export CSV
7. ✅ **COMPLETATO**: Ottimizzare `applyFilters` con `useMemo`
8. ✅ **COMPLETATO**: Calcolare revenue nel database
9. ✅ **COMPLETATO**: Rimuovere logging da `lib/availability.ts`
10. ✅ **COMPLETATO**: Memoizzare `DateTime.now()`
11. 🔴 **URGENTE**: Sostituire `SELECT *` con colonne specifiche (4 query)
12. 🟡 **ALTA**: Rimuovere logging eccessivo da `app/api/bookings/route.ts`
13. 🟡 **ALTA**: Ottimizzare `checkAvailability()` con Set invece di Array.includes()
14. 🟡 **ALTA**: Ottimizzare `getAllBookings()` con colonne specifiche
15. 🟢 **MEDIA**: Rimuovere console.log residui da BookPage
16. 🟢 **MEDIA**: Valutare rimozione di `date-fns` se non necessaria
17. 🟢 **MEDIA**: Aggiungere cleanup in useEffect dove necessario
18. 🟢 **MEDIA**: Ottimizzare `time-slot-picker.tsx` con Set
19. 🟢 **MEDIA**: Aggiungere error boundaries
20. 🟢 **MEDIA**: Implementare rate limiting

## 📈 Impatto Totale Stimato

- **Query Database**: Riduzione 85-95% (fix N+1, SQL aggregation, SELECT specifico)
- **Cache Server**: Funzionante (riduzione 50-70% richieste)
- **Memoria**: Riduzione 90%+ (calcolo revenue nel DB, SELECT specifico)
- **JavaScript**: Riduzione 60-80% overhead (logging, memoization, Set optimization)
- **Filtering**: Più efficiente (useMemo, Set lookup)
- **Bundle Size**: Potenziale riduzione 5-10% (rimozione date-fns se non necessaria)




