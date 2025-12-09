# Configurazione Domini Personalizzati su Vercel

## 🎯 Obiettivo

Configurare i domini personalizzati:
- `booking.montecchiaperformancecenter.it` (sito pubblico)
- `admin.booking.montecchiaperformancecenter.it` (pannello admin)

## 📋 Istruzioni Step-by-Step

### 1. Configurazione Domini su Vercel Dashboard

1. **Vai su Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Seleziona il progetto `montecchia-booking`

2. **Vai su Settings → Domains**

3. **Aggiungi Domini**

   **Dominio principale (booking):**
   - Clicca "Add Domain"
   - Inserisci: `booking.montecchiaperformancecenter.it`
   - Seleziona "Production" come ambiente
   - Clicca "Add"

   **Dominio admin:**
   - Clicca "Add Domain" di nuovo
   - Inserisci: `admin.booking.montecchiaperformancecenter.it`
   - Seleziona "Production" come ambiente
   - Clicca "Add"

### 2. Configurazione DNS

Vercel ti fornirà i record DNS da configurare. Dovrai aggiungere questi record nel pannello DNS del tuo provider (dove è registrato `montecchiaperformancecenter.it`):

#### Per `booking.montecchiaperformancecenter.it`:
```
Tipo: CNAME
Nome: booking
Valore: cname.vercel-dns.com
```

#### Per `admin.booking.montecchiaperformancecenter.it`:
```
Tipo: CNAME
Nome: admin.booking
Valore: cname.vercel-dns.com
```

**Oppure** se Vercel fornisce un record A specifico, usa quello.

### 3. Verifica Configurazione

Dopo aver aggiunto i record DNS:

1. **Attendi la propagazione DNS** (può richiedere fino a 24-48 ore, ma di solito è più veloce)
2. **Vercel verificherà automaticamente** i domini
3. **Status diventerà "Valid"** quando la configurazione è corretta

### 4. SSL/TLS

Vercel fornisce automaticamente certificati SSL gratuiti per i domini configurati. Non serve configurazione aggiuntiva.

### 5. Aggiorna Variabili d'Ambiente

Assicurati che `NEXT_PUBLIC_BASE_URL` sia configurato correttamente:

```bash
NEXT_PUBLIC_BASE_URL=https://booking.montecchiaperformancecenter.it
```

## 🔍 Verifica Middleware

Il middleware è già configurato per gestire i domini:
- `admin.booking.montecchiaperformancecenter.it` → route admin con autenticazione
- `booking.montecchiaperformancecenter.it` → sito pubblico

## ⚠️ Note Importanti

1. **Propagazione DNS**: Può richiedere fino a 48 ore, ma di solito è molto più veloce (minuti/ore)

2. **HTTPS**: Vercel fornisce automaticamente certificati SSL. Assicurati che i domini siano verificati prima di andare in produzione

3. **Wildcard**: Se vuoi supportare anche altri sottodomini, puoi aggiungere `*.montecchiaperformancecenter.it` come dominio wildcard

4. **Redirect**: Se hai già un sito su questi domini, assicurati di rimuovere i redirect esistenti prima di configurare Vercel

## 🐛 Troubleshooting

### Dominio Non Verificato
- Verifica che i record DNS siano configurati correttamente
- Usa `dig booking.montecchiaperformancecenter.it` o `nslookup` per verificare
- Attendi la propagazione DNS

### SSL Non Funziona
- Vercel genera automaticamente i certificati dopo la verifica del dominio
- Se non funziona, attendi qualche minuto e riprova

### Middleware Non Funziona
- Verifica che il dominio sia esattamente `admin.booking.montecchiaperformancecenter.it`
- Controlla i logs su Vercel per errori del middleware

## 📝 Checklist

- [ ] Domini aggiunti su Vercel Dashboard
- [ ] Record DNS configurati nel provider DNS
- [ ] Domini verificati su Vercel (status "Valid")
- [ ] SSL certificati generati automaticamente
- [ ] `NEXT_PUBLIC_BASE_URL` aggiornato
- [ ] Test accesso su `booking.montecchiaperformancecenter.it`
- [ ] Test accesso su `admin.booking.montecchiaperformancecenter.it`
- [ ] Test login admin funzionante
- [ ] Test prenotazione funzionante

