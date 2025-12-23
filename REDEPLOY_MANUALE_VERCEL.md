# Redeploy Manuale su Vercel

## Situazione
- **Progetto Vercel**: `booking_simulatore`
- **Repository GitHub**: `carlodl-git/booking_simulatore`
- **Branch principale**: `main`

## Passaggi per Redeploy Manuale

### Opzione 1: Redeploy dall'ultimo commit (CONSIGLIATO)

1. **Vai su Vercel Dashboard**
   - Apri [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Cerca e seleziona il progetto **`booking_simulatore`**

2. **Vai alla sezione Deployments**
   - Clicca su **"Deployments"** nella barra laterale sinistra
   - Trova l'ultimo deployment (dovrebbe essere quello con commit `393d121` o più recente)

3. **Redeploy senza cache**
   - Clicca sui **tre puntini (`...`)** accanto all'ultimo deployment
   - Seleziona **"Redeploy"**
   - **IMPORTANTE**: **Deseleziona** la checkbox **"Use existing Build Cache"**
   - Clicca **"Redeploy"**

4. **Attendi il completamento**
   - Il deploy richiederà alcuni minuti
   - Puoi seguire i log in tempo reale cliccando sul deployment

### Opzione 2: Trigger da GitHub (se il webhook non funziona)

1. **Vai su GitHub**
   - Apri [https://github.com/carlodl-git/booking_simulatore](https://github.com/carlodl-git/booking_simulatore)
   - Vai su **Settings** → **Webhooks**

2. **Verifica il webhook di Vercel**
   - Dovrebbe esserci un webhook per `https://api.vercel.com/v1/integrations/deploy`
   - Se non c'è, potrebbe essere il motivo per cui il deploy automatico non funziona

3. **Alternativa: Push forzato**
   - Fai un piccolo cambiamento (es. aggiungi uno spazio in un file)
   - Commit e push per triggerare il deploy

### Opzione 3: Verifica collegamento Vercel-GitHub

1. **Vai su Vercel Dashboard**
   - Seleziona il progetto **`booking_simulatore`**
   - Vai su **Settings** → **Git**

2. **Verifica il repository collegato**
   - Dovrebbe essere: `carlodl-git/booking_simulatore`
   - Branch di produzione: `main`

3. **Se non è collegato correttamente**
   - Clicca **"Disconnect"** e poi **"Connect Git Repository"**
   - Seleziona il repository corretto

## Verifica dopo il Deploy

1. **Controlla i log del build**
   - Vai su **Deployments** → clicca sul deployment
   - Verifica che non ci siano errori nel build

2. **Testa l'applicazione**
   - Apri `https://booking.montecchiaperformancecenter.it` (o il dominio Vercel)
   - Vai su `/admin/bookings`
   - Verifica che i nomi dei clienti siano corretti (usando `customerFirstName` e `customerLastName`)

3. **Pulisci la cache del browser**
   - Premi `Ctrl+Shift+Delete` (Windows/Linux) o `Cmd+Shift+Delete` (Mac)
   - Seleziona "Cached images and files"
   - Oppure apri in modalità incognito

## Troubleshooting

### Se il deploy fallisce:
- Controlla i log di build per errori
- Verifica che tutte le variabili d'ambiente siano configurate
- Assicurati che `NODE_ENV=production` sia impostato

### Se le modifiche non appaiono:
- Forza un hard refresh: `Ctrl+F5` (Windows) o `Cmd+Shift+R` (Mac)
- Pulisci la cache del browser
- Verifica che il deployment sia completato con successo (stato "Ready")

### Se il webhook non funziona:
- Vai su Vercel → Settings → Git
- Verifica che il repository sia collegato
- Prova a disconnettere e riconnettere il repository

## Comandi Utili

```bash
# Verifica ultimo commit su GitHub
git log --oneline -1

# Verifica che tutto sia pushato
git status

# Se necessario, forza push
git push origin main --force-with-lease
```



