# Guida al Testing - Orari Settimanali

Questa guida spiega come testare la nuova funzionalità di gestione degli orari settimanali di apertura e chiusura.

## 📋 Prerequisiti

1. Assicurati di avere il database Supabase configurato
2. Assicurati di avere le variabili d'ambiente configurate in `.env.local`

## 🔧 Setup Iniziale

### 1. Esegui lo Script SQL

Devi creare la tabella `weekly_hours` nel tuo database Supabase:

1. Apri il **SQL Editor** nel tuo progetto Supabase (dalla dashboard)
2. Copia e incolla il contenuto del file `supabase-schema-weekly-hours.sql`
3. Esegui lo script SQL

**Nota**: Lo script creerà automaticamente i record di default per tutti i giorni della settimana con orari 09:30 - 23:00.

### 2. Avvia il Server di Sviluppo

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

## 🧪 Testing della Funzionalità

### Test 1: Accesso alla Pagina Admin Orari Settimanali

1. Vai su `http://localhost:3000/admin/login`
2. Effettua il login con le credenziali admin
3. Dalla pagina principale admin, clicca su **"Orari Settimanali"** nel menu laterale
4. **Verifica**: Dovresti vedere una tabella con tutti i 7 giorni della settimana (Domenica - Sabato)
5. **Verifica**: Ogni giorno dovrebbe mostrare "Aperto" con orari 09:30 - 23:00 (valori di default)

### Test 2: Modifica Orari di un Giorno

1. Dalla pagina Orari Settimanali, clicca sull'icona di **modifica** (matita) accanto a un giorno (es. Lunedì)
2. Modifica gli orari:
   - Cambia l'orario di apertura (es. da 09:30 a 10:00)
   - Cambia l'orario di chiusura (es. da 23:00 a 22:00)
3. Clicca su **"Salva"**
4. **Verifica**: Gli orari vengono aggiornati nella tabella
5. **Verifica**: Gli orari modificati persistono dopo un refresh della pagina

### Test 3: Chiudere un Giorno

1. Clicca su modifica per un giorno (es. Domenica)
2. Seleziona il checkbox **"Chiuso"**
3. Clicca su **"Salva"**
4. **Verifica**: Lo stato cambia da "Aperto" a "Chiuso" (rosso)
5. **Verifica**: Gli orari vengono mostrati come "-" (non disponibili)

### Test 4: Validazione Orari

1. Clicca su modifica per un giorno
2. Prova a salvare con:
   - Orario di apertura > orario di chiusura (es. apertura 20:00, chiusura 10:00)
   - **Verifica**: Dovresti vedere un errore che dice "L'orario di chiusura deve essere maggiore dell'orario di apertura"
3. Prova a salvare con formato orario non valido
   - **Verifica**: Dovresti vedere un errore di formato

### Test 5: Prenotazioni Rispettano gli Orari di Apertura

#### Test 5a: Prenotazione Normale (dovrebbe rispettare gli orari)

1. Modifica gli orari del giorno corrente (es. oggi è Lunedì) con orari limitati (es. 10:00 - 18:00)
2. Vai su `http://localhost:3000/book`
3. Seleziona la data di oggi
4. Seleziona un'attività normale (es. "9 buche", "18 buche", "Pratica")
5. Prova a selezionare un orario **prima** dell'orario di apertura (es. 09:30)
   - **Verifica**: L'orario non dovrebbe essere disponibile negli slot
6. Prova a selezionare un orario **dopo** l'orario di chiusura (es. 19:00)
   - **Verifica**: L'orario non dovrebbe essere disponibile negli slot
7. Prova a selezionare un orario **dentro** gli orari di apertura (es. 14:00)
   - **Verifica**: L'orario dovrebbe essere disponibile

#### Test 5b: Tentativo di Prenotazione Fuori Orario via API (dovrebbe fallire)

Puoi testare direttamente l'API con curl o Postman:

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "userType": "socio"
    },
    "date": "2024-01-15",
    "startTime": "08:00",
    "durationMinutes": 60,
    "activityType": "pratica",
    "players": 1
  }'
```

**Verifica**: Dovresti ricevere un errore 400 con messaggio: "La prenotazione deve essere effettuata tra le [orario apertura] e le [orario chiusura]"

### Test 6: Prenotazione "Lezione Maestro" Fuori Orario (dovrebbe essere permessa)

1. Assicurati che il giorno corrente abbia orari limitati (es. 10:00 - 18:00)
2. Vai su `http://localhost:3000/book`
3. Seleziona la data di oggi
4. Seleziona l'attività **"Lezione maestro"**
5. Prova a selezionare un orario **fuori** dagli orari di apertura (es. 08:00 o 20:00)
   - **Verifica**: L'orario **dovrebbe essere disponibile** (lezione maestro può essere prenotata fuori orario)

### Test 7: Giorno Chiuso

1. Nella pagina Orari Settimanali, imposta un giorno come "Chiuso"
2. Vai su `http://localhost:3000/book`
3. Seleziona il giorno chiuso
4. Prova a selezionare un'attività normale
   - **Verifica**: Non dovrebbero essere disponibili slot per quel giorno
5. Prova a prenotare via API per quel giorno:
   ```bash
   curl -X POST http://localhost:3000/api/bookings \
     -H "Content-Type: application/json" \
     -d '{
       "customer": {
         "firstName": "Test",
         "lastName": "User",
         "email": "test2@example.com",
         "userType": "socio"
       },
       "date": "[DATA_GIORNO_CHIUSO]",
       "startTime": "14:00",
       "durationMinutes": 60,
       "activityType": "pratica",
       "players": 1
     }'
   ```
   - **Verifica**: Dovresti ricevere un errore 400: "Il simulatore è chiuso in questa data"

### Test 8: API Orari Settimanali

#### Test 8a: GET tutti gli orari

```bash
curl http://localhost:3000/api/admin/weekly-hours
```

**Verifica**: Dovresti ricevere un JSON con tutti i 7 giorni

#### Test 8b: Aggiorna orari via API

```bash
curl -X POST http://localhost:3000/api/admin/weekly-hours \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": 1,
    "openTime": "10:00",
    "closeTime": "20:00",
    "isClosed": false
  }'
```

**Verifica**: Dovresti ricevere un JSON con gli orari aggiornati

## 🔍 Debugging

Se qualcosa non funziona:

1. **Controlla la console del browser** (F12) per errori JavaScript
2. **Controlla i log del server** (terminal dove hai avviato `npm run dev`)
3. **Verifica il database**: Controlla nella tabella `weekly_hours` che i dati siano corretti
4. **Verifica le variabili d'ambiente**: Assicurati che `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` siano configurate correttamente

## ✅ Checklist Completamento

- [ ] Tabella `weekly_hours` creata nel database
- [ ] Pagina admin orari settimanali accessibile
- [ ] Modifica orari funziona correttamente
- [ ] Chiusura giorni funziona correttamente
- [ ] Validazione orari funziona (orario chiusura > apertura)
- [ ] Prenotazioni normali rispettano gli orari
- [ ] Prenotazioni "lezione maestro" possono essere fuori orario
- [ ] Giorni chiusi non permettono prenotazioni
- [ ] API orari settimanali funzionano (GET e POST)

## 📝 Note

- Gli orari di default sono 09:30 - 23:00 per tutti i giorni
- Se non ci sono orari configurati, il sistema usa i valori di default
- Le prenotazioni "lezione-maestro" possono sempre essere effettuate, anche fuori dagli orari o in giorni chiusi
- La conversione del giorno della settimana gestisce correttamente la differenza tra Luxon (1-7, lun-dom) e il formato database (0-6, dom-sab)

