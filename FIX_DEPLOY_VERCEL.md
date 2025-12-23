# Fix Deploy Automatico Vercel

## Problema Risolto ✅
- **Causa**: Il repository GitHub era privato e Vercel non aveva i permessi per accedere agli ultimi commit
- **Soluzione**: Concedere i permessi a Vercel per accedere al repository privato (o rendere il repository pubblico)

## Problemi Precedenti
- Il deploy automatico da GitHub non funzionava
- Il check su GitHub mostrava "0/1" (fallito)
- Non ci erano webhook configurati su GitHub
- Errore "A commit author is required" quando si provava a fare deploy manuale

## Soluzione: Configurare Integrazione Vercel-GitHub

### Passo 1: Verifica su Vercel

1. **Vai su Vercel Dashboard**
   - Apri [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Seleziona il progetto **`booking_simulatore`**

2. **Vai su Settings → Git**
   - Verifica che il repository sia: `carlodl-git/booking_simulatore`
   - Verifica che il branch di produzione sia: `main`
   - Verifica che "Auto-deploy" sia abilitato

3. **Se il repository NON è collegato:**
   - Clicca **"Disconnect"** (se presente)
   - Clicca **"Connect Git Repository"**
   - Seleziona **GitHub** come provider
   - Autorizza Vercel ad accedere al tuo account GitHub (se richiesto)
   - Seleziona il repository **`carlodl-git/booking_simulatore`**
   - Seleziona il branch **`main`** come branch di produzione
   - Clicca **"Connect"**

### Passo 2: Deploy Manuale Immediato

Mentre configuri l'integrazione, puoi fare un deploy manuale:

1. **Vai su Deployments**
   - Clicca su **"Deploy"** o **"Redeploy"**
   - Se vedi un menu per selezionare il commit, scegli **`8da508c`** o **`393d121`**
   - Se non vedi il menu, clicca su **"Redeploy"** e poi seleziona **"Use latest commit"** o deseleziona la cache

2. **Oppure usa il CLI di Vercel:**
   ```bash
   # Installa Vercel CLI (se non già installato)
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy in produzione
   vercel --prod
   ```

### Passo 3: Verifica Branch Protection (se applicabile)

Se hai branch protection rules su GitHub:

1. **Vai su GitHub → Settings → Branches**
2. **Trova la regola per `main`**
3. **Verifica i "Required status checks"**
   - Se c'è un check di Vercel, assicurati che sia configurato correttamente
   - Se non serve, puoi rimuoverlo temporaneamente

## Soluzione Alternativa: Deploy da Commit Specifico

Se l'integrazione non funziona, puoi fare deploy manuale selezionando il commit:

1. **Su Vercel Dashboard → Deployments**
2. **Clicca su "Deploy"** (se disponibile)
3. **Seleziona "Deploy from GitHub"**
4. **Scegli il commit `8da508c`** dalla lista
5. **Clicca "Deploy"**

## Verifica Dopo il Deploy

1. **Controlla il nuovo deployment su Vercel**
   - Dovrebbe essere associato al commit `8da508c`
   - Dovrebbe includere tutte le modifiche fino a `393d121`

2. **Verifica su GitHub**
   - Il check dovrebbe diventare verde (1/1) dopo che Vercel completa il deploy
   - Se non diventa verde, potrebbe essere necessario riconfigurare il check

3. **Testa l'applicazione**
   - Apri `https://booking.montecchiaperformancecenter.it/admin/bookings`
   - Verifica che i nomi dei clienti siano corretti

## Troubleshooting

### Se il deploy manuale non funziona:
- Verifica che tutte le variabili d'ambiente siano configurate su Vercel
- Controlla i log di build per errori
- Assicurati che `npm run build` funzioni in locale

### Se l'integrazione GitHub non si connette:
- Verifica i permessi dell'account GitHub
- Assicurati che Vercel abbia accesso al repository
- Prova a disconnettere e riconnettere l'integrazione

### Se il check su GitHub continua a fallire:
- Il check potrebbe essere obsoleto o mal configurato
- Puoi rimuoverlo temporaneamente dalle branch protection rules
- Oppure riconfigurare il check su Vercel → Settings → Git → GitHub Checks

