# Stato Deploy - Montecchia Booking

**Data**: 2025-01-15  
**Ultimo Commit**: `393d121` - Force redeploy: fix customer name display on admin bookings

## ✅ Push Completato

Tutte le modifiche sono state pushatte su GitHub:
- Repository: `https://github.com/carlodl-git/booking_simulatore.git`
- Branch: `main`
- Progetto Vercel: `booking_simulatore`

## 🚀 Deploy Vercel

### ⚠️ Deploy Automatico NON Attivo

Il deploy automatico da GitHub non è partito. **Devi fare un redeploy manuale**.

Vedi `REDEPLOY_MANUALE_VERCEL.md` per le istruzioni dettagliate.

### Verifica Deploy

1. **Vai su Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Seleziona il progetto **`booking_simulatore`**

2. **Controlla Deployments**
   - Dovresti vedere un nuovo deployment in corso o completato
   - Status dovrebbe essere "Ready" (verde) se completato
   - Se "Building" o "Error", controlla i logs

3. **Promuovi a Produzione** (se necessario)
   - Se il deployment è in "Preview", clicca sui "..." → "Promote to Production"
   - Oppure clicca direttamente su "Promote" se disponibile

### ⚠️ IMPORTANTE: Variabili d'Ambiente

**PRIMA** che il deploy vada in produzione, configura le variabili d'ambiente su Vercel:

1. Vai su **Settings** → **Environment Variables**
2. Aggiungi tutte le variabili obbligatorie (vedi `DEPLOY_VERCEL.md`)
3. Assicurati di selezionare **Production** come ambiente

### 🔧 Deploy Manuale (NECESSARIO)

**Il deploy automatico non funziona. Devi fare un redeploy manuale.**

Vedi `REDEPLOY_MANUALE_VERCEL.md` per le istruzioni complete.

**Passaggi rapidi:**
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **`booking_simulatore`**
3. Vai su **Deployments**
4. Clicca sui **"..."** dell'ultimo deployment
5. Seleziona **"Redeploy"**
6. **Deseleziona** "Use existing Build Cache"
7. Clicca **"Redeploy"**

## 📊 Checklist Post-Deploy

Dopo che il deploy è completato:

- [ ] Verifica che il build sia completato con successo
- [ ] Controlla che il sito sia accessibile
- [ ] Verifica HTTPS funzionante
- [ ] Testa login admin
- [ ] Testa prenotazione
- [ ] Verifica cookie secure (DevTools)
- [ ] Controlla logs per errori

## 🐛 Troubleshooting

### Deploy Non Parte
- Verifica che Vercel sia collegato al repository GitHub
- Controlla che il branch `main` sia configurato per auto-deploy
- Vai su Settings → Git per verificare la configurazione

### Build Fallisce
- Controlla i logs del build su Vercel
- Verifica che tutte le variabili d'ambiente siano configurate
- Assicurati che `npm run build` funzioni in locale

### Variabili d'Ambiente Mancanti
- Vai su Settings → Environment Variables
- Aggiungi tutte le variabili obbligatorie
- Riavvia il deployment dopo aver aggiunto le variabili

## 📝 Note

- Il deploy automatico da GitHub è la modalità consigliata
- Le variabili d'ambiente devono essere configurate PRIMA del deploy in produzione
- Se modifichi le variabili d'ambiente, devi riavviare il deployment


