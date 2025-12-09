# Deploy su Vercel - Istruzioni

## ✅ Push Completato

Le modifiche sono state pushate su GitHub. Vercel dovrebbe avviare automaticamente il deploy.

## 🔧 Configurazione Variabili d'Ambiente su Vercel

**IMPORTANTE**: Configura queste variabili d'ambiente nel pannello Vercel prima che il deploy vada in produzione:

### Variabili Obbligatorie

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `montecchia-booking`
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi queste variabili:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Authentication (OBBLIGATORIO)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# Resend (per email)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Montecchia Performance Center <noreply@montecchiaperformancecenter.it>

# Admin Email
ADMIN_EMAIL=admin@montecchia-performance.com

# Base URL (usa il dominio di produzione)
NEXT_PUBLIC_BASE_URL=https://booking.montecchiaperformancecenter.it

# Node Environment
NODE_ENV=production
```

### ⚠️ Note Importanti

1. **ADMIN_USERNAME e ADMIN_PASSWORD**: Se non configurate, il login admin non funzionerà
2. **NODE_ENV=production**: Necessario per abilitare cookie secure
3. **NEXT_PUBLIC_BASE_URL**: Deve essere l'URL di produzione (HTTPS)
4. Applica le variabili a: **Production, Preview, Development** (o almeno Production)

## 🔍 Verifica Deploy

Dopo il deploy, verifica:

1. **Build Status**: Controlla che il build sia completato con successo
2. **HTTPS**: Verifica che il sito usi HTTPS
3. **Login Admin**: Testa il login admin con le credenziali configurate
4. **Prenotazione**: Testa una prenotazione end-to-end
5. **Cookie Secure**: Verifica nei DevTools che il cookie `admin-auth` abbia `Secure: true`

## 📊 Monitoraggio

- **Logs**: Vai su Vercel Dashboard → Deployments → [ultimo deploy] → Functions Logs
- **Errori**: Controlla i logs per eventuali errori runtime
- **Performance**: Monitora i tempi di risposta delle API

## 🚨 Troubleshooting

### Deploy Fallisce
- Verifica che tutte le variabili d'ambiente siano configurate
- Controlla i logs del build su Vercel
- Verifica che `npm run build` funzioni in locale

### Login Admin Non Funziona
- Verifica che `ADMIN_USERNAME` e `ADMIN_PASSWORD` siano configurate
- Controlla che `NODE_ENV=production` sia impostato
- Verifica i logs per errori di autenticazione

### Cookie Non Secure
- Verifica che il sito usi HTTPS
- Controlla che `NODE_ENV=production` sia impostato
- Il cookie secure si attiva automaticamente se HTTPS è disponibile

## 📝 Checklist Post-Deploy

- [ ] Variabili d'ambiente configurate su Vercel
- [ ] Deploy completato con successo
- [ ] HTTPS funzionante
- [ ] Login admin testato
- [ ] Prenotazione testata
- [ ] Cookie secure verificato
- [ ] Email di conferma funzionanti
- [ ] Export CSV funzionante
- [ ] Logs verificati (nessun errore critico)

