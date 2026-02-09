# Guida al Testing - Note Admin per Prenotazioni

Questa guida spiega come testare la nuova funzionalità di aggiunta/modifica delle note admin per le prenotazioni.

## 📋 Prerequisiti

1. ✅ Database Supabase configurato
2. ✅ Campo `admin_notes` aggiunto alla tabella `bookings` (migration SQL eseguita)
3. ✅ Variabili d'ambiente configurate in `.env.local`
4. ✅ Server di sviluppo avviato

## 🔧 Setup Iniziale

### 1. Verifica la Migration SQL

Assicurati di aver eseguito il file `add-admin-notes-field.sql` nel SQL Editor di Supabase. 
Il campo `admin_notes` deve esistere nella tabella `bookings`.

### 2. Avvia il Server di Sviluppo

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

## 🧪 Testing della Funzionalità

### Test 1: Accesso alla Pagina Admin Prenotazioni

1. Vai su `http://localhost:3000/admin/login`
2. Effettua il login con le credenziali admin (definite in `.env.local`)
3. Dalla pagina principale admin, clicca su **"Gestione Prenotazioni"** o vai direttamente su `/admin/bookings`
4. **Verifica**: Dovresti vedere la lista delle prenotazioni future

### Test 2: Visualizzazione Colonna Note Admin nella Tabella

1. Dalla pagina delle prenotazioni, verifica che ci sia una colonna **"Note Admin"** nella tabella
2. **Verifica**: Le prenotazioni senza note admin mostrano "-"
3. **Verifica**: Le prenotazioni con note admin mostrano il testo (troncato se troppo lungo)

### Test 3: Aggiungere Note Admin a una Prenotazione

1. Dalla tabella delle prenotazioni, clicca sul pulsante **"Dettagli"** di una prenotazione
2. Nel modal che si apre, scorri fino alla sezione **"Note Admin"**
3. **Verifica**: Dovresti vedere un campo textarea con placeholder "Aggiungi note per questa prenotazione..."
4. Digita una nota di test (es. "Cliente ha richiesto attrezzature speciali")
5. Clicca su **"Salva Note"**
6. **Verifica**: Il pulsante mostra "Salvataggio..." durante il salvataggio
7. **Verifica**: Dopo il salvataggio, la nota appare nel modal
8. Chiudi il modal e riaprilo
9. **Verifica**: La nota è ancora presente (persistenza nel database)

### Test 4: Modificare Note Admin Esistenti

1. Apri una prenotazione che ha già delle note admin
2. Modifica il testo nel campo textarea
3. Clicca su **"Salva Note"**
4. **Verifica**: Le note vengono aggiornate correttamente
5. Chiudi e riapri il modal
6. **Verifica**: Le modifiche sono state salvate

### Test 5: Rimuovere Note Admin

1. Apri una prenotazione con note admin
2. Cancella tutto il testo nel campo textarea
3. Clicca su **"Salva Note"**
4. **Verifica**: Le note vengono rimosse (il campo risulta vuoto)
5. **Verifica**: Nella tabella, la colonna "Note Admin" mostra "-"

### Test 6: Verifica nella Tabella

1. Dopo aver aggiunto/modificato note admin, verifica nella tabella principale
2. **Verifica**: La colonna "Note Admin" mostra il testo (troncato se troppo lungo)
3. Passa il mouse sul testo troncato
4. **Verifica**: Il tooltip mostra il testo completo (se supportato dal browser)

### Test 7: Verifica nello Storico Prenotazioni

1. Vai su `/admin/bookings/history` (Storico Prenotazioni)
2. Clicca su "Dettagli" di una prenotazione passata che ha note admin
3. **Verifica**: Nel modal, le note admin vengono visualizzate nella sezione "Note Admin"
4. **Nota**: Nello storico, le note sono solo in lettura (non modificabili)

### Test 8: Test con Prenotazioni Multiple

1. Aggiungi note admin a diverse prenotazioni
2. **Verifica**: Ogni prenotazione mantiene le proprie note indipendentemente
3. **Verifica**: Le note non interferiscono tra loro

## 🐛 Troubleshooting

### Problema: La colonna "Note Admin" non appare
- **Soluzione**: Verifica che il server sia stato riavviato dopo le modifiche
- **Soluzione**: Controlla la console del browser per errori JavaScript

### Problema: Il salvataggio delle note non funziona
- **Soluzione**: Verifica che la migration SQL sia stata eseguita correttamente
- **Soluzione**: Controlla la console del browser e i log del server per errori
- **Soluzione**: Verifica che l'endpoint `/api/admin/bookings/[id]` risponda correttamente

### Problema: Le note non persistono dopo il refresh
- **Soluzione**: Verifica che il campo `admin_notes` esista nel database
- **Soluzione**: Controlla i log di Supabase per errori di query

### Problema: Errore 404 o 500 quando salvo le note
- **Soluzione**: Verifica che l'endpoint API sia configurato correttamente
- **Soluzione**: Controlla i log del server per dettagli sull'errore
- **Soluzione**: Verifica che l'ID della prenotazione sia valido

## ✅ Checklist di Verifica Completa

- [ ] La colonna "Note Admin" appare nella tabella delle prenotazioni
- [ ] Il campo textarea appare nel modal dei dettagli
- [ ] Posso aggiungere nuove note admin
- [ ] Posso modificare note admin esistenti
- [ ] Posso rimuovere note admin (cancellando il testo)
- [ ] Le note persistono dopo il refresh della pagina
- [ ] Le note appaiono correttamente nella tabella
- [ ] Le note appaiono nello storico delle prenotazioni
- [ ] Non ci sono errori nella console del browser
- [ ] Non ci sono errori nei log del server

## 📝 Note Aggiuntive

- Le note admin sono visibili solo agli amministratori
- Le note admin sono separate dalle note standard (`notes`) che possono essere aggiunte durante la creazione della prenotazione
- Le note admin possono essere modificate in qualsiasi momento dagli admin
- Le note admin sono opzionali (possono essere vuote/null)

