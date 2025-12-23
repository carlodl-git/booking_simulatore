# Setup Rapido Variabili d'Ambiente su Vercel

## 🚀 Configurazione Veloce (5 minuti)

### Step 1: Accedi a Vercel Dashboard

1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto `montecchia-booking` (o il nome del tuo progetto)

### Step 2: Aggiungi Variabili d'Ambiente

1. Vai su **Settings** (Impostazioni) → **Environment Variables** (Variabili d'Ambiente)
2. Clicca su **Add New** (Aggiungi Nuova)

### Step 3: Aggiungi Ogni Variabile

Aggiungi queste variabili **una per una**:

#### 1. ADMIN_USERNAME
```
Key: ADMIN_USERNAME
Value: [il tuo username admin dal .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 2. ADMIN_PASSWORD
```
Key: ADMIN_PASSWORD
Value: [la tua password admin dal .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 3. SUPABASE_URL
```
Key: SUPABASE_URL
Value: [il tuo URL Supabase dal .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 4. SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [la tua service role key dal .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 5. RESEND_API_KEY (se usi email)
```
Key: RESEND_API_KEY
Value: [la tua API key Resend dal .env.local]
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 6. ADMIN_EMAIL
```
Key: ADMIN_EMAIL
Value: admin@montecchia-performance.com (o il tuo)
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 7. NEXT_PUBLIC_BASE_URL
```
Key: NEXT_PUBLIC_BASE_URL
Value: https://booking.montecchiaperformancecenter.it
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### 8. NODE_ENV
```
Key: NODE_ENV
Value: production
Environments: ✅ Production (solo Production!)
```

### Step 4: Riavvia il Deployment

Dopo aver aggiunto tutte le variabili:

1. Vai su **Deployments**
2. Trova l'ultimo deployment
3. Clicca sui "..." (tre puntini)
4. Seleziona **Redeploy**
5. Seleziona **Use existing Build Cache** (opzionale, più veloce)
6. Clicca **Redeploy**

## ⚠️ IMPORTANTE

- **ADMIN_USERNAME e ADMIN_PASSWORD** sono **OBBLIGATORIE** - senza queste, il login admin non funzionerà
- Assicurati di selezionare **Production** per tutte le variabili (oltre a Preview/Development se vuoi)
- Dopo aver aggiunto le variabili, **devi riavviare il deployment** per applicarle

## 🔍 Verifica

Dopo il redeploy:

1. Vai su `admin.booking.montecchiaperformancecenter.it` (o il tuo dominio admin)
2. Prova a fare login con le credenziali dal `.env.local`
3. Dovrebbe funzionare!

## 🐛 Se Non Funziona

1. **Verifica le variabili**: Controlla che siano esattamente come nel `.env.local` (senza spazi extra)
2. **Redeploy**: Assicurati di aver fatto redeploy dopo aver aggiunto le variabili
3. **Logs**: Controlla i logs su Vercel per vedere eventuali errori
4. **Console Browser**: Apri DevTools → Console per vedere errori lato client




