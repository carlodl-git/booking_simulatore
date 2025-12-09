# Checklist Pre-Produzione - Montecchia Booking

**Data**: 2025-01-15

## 🔴 CRITICI - Da Verificare Prima del Deploy

### 1. **Variabili d'Ambiente Obbligatorie**
Verifica che tutte queste variabili siano configurate nel pannello di hosting:

```bash
# OBBLIGATORIE
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# CONSIGLIATE
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Montecchia Performance Center <noreply@montecchiaperformancecenter.it>
ADMIN_EMAIL=admin@montecchia-performance.com
NEXT_PUBLIC_BASE_URL=https://booking.montecchiaperformancecenter.it
NODE_ENV=production
```

**⚠️ PROBLEMA**: Se `NODE_ENV` non è impostato a `production`, il cookie `secure` non sarà abilitato!

### 2. **NEXT_PUBLIC_BASE_URL**
**File**: `.env.local` / variabili d'ambiente hosting

**Problema**: Nel README è ancora `http://localhost:3000`

**Soluzione**: Impostare in produzione:
```bash
NEXT_PUBLIC_BASE_URL=https://booking.montecchiaperformancecenter.it
```

### 3. **Cookie Secure in Produzione**
**File**: `app/api/admin/login/route.ts` (riga 39-43)

**Problema**: Il cookie `secure` si attiva solo se `NODE_ENV === 'production'`

**Verifica**: Assicurati che `NODE_ENV=production` sia impostato nel hosting

**Alternativa più sicura**: Usare sempre `secure: true` se l'URL è HTTPS:
```typescript
const isHTTPS = request.url.startsWith('https://')
cookieStore.set("admin-auth", "authenticated", {
  httpOnly: true,
  secure: isHTTPS || isProduction,
  // ...
})
```

### 4. **Middleware Host Check**
**File**: `middleware.ts` (riga 8)

**Problema**: `host.startsWith('admin.booking...')` potrebbe essere vulnerabile a subdomain takeover

**Raccomandazione**: Usare match esatto:
```typescript
const allowedAdminHosts = [
  'admin.booking.montecchiaperformancecenter.it',
  // Aggiungi altri domini se necessario
]
if (allowedAdminHosts.includes(host)) {
  // ...
}
```

## 🟡 IMPORTANTI - Da Verificare

### 5. **Error Handling Database**
**Problema**: Nessun retry o timeout per connessioni Supabase

**Raccomandazione**: Aggiungere timeout e retry logic per query critiche

### 6. **Logging in Produzione**
**Problema**: Alcuni `console.error` potrebbero esporre informazioni sensibili

**File con logging**:
- `app/api/admin/login/route.ts` (riga 17, 57)
- `app/api/bookings/route.ts` (riga 158)
- `app/api/availability/route.ts` (riga 103)
- Altri file API

**Raccomandazione**: Usare un servizio di logging (es. Sentry) o rimuovere log sensibili

### 7. **Validazione Variabili d'Ambiente all'Avvio**
**Problema**: Nessun controllo che le variabili obbligatorie siano presenti

**Raccomandazione**: Aggiungere file `lib/env-check.ts`:
```typescript
export function validateEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
  ]
  
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}
```

### 8. **Rate Limiting**
**Problema**: Nessun rate limiting implementato

**Raccomandazione**: Implementare rate limiting per:
- `/api/bookings` (POST) - prenotazioni
- `/api/admin/login` (POST) - login admin
- `/api/availability` (GET) - disponibilità

### 9. **CORS e Security Headers**
**Problema**: Nessuna configurazione CORS o security headers esplicita

**Raccomandazione**: Aggiungere headers di sicurezza in `next.config.mjs`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### 10. **Database Connection Pooling**
**Problema**: Nessuna configurazione esplicita per connection pooling Supabase

**Raccomandazione**: Verificare limiti Supabase e configurare pooling se necessario

## 🟢 RACCOMANDATI - Miglioramenti

### 11. **Error Tracking**
**Raccomandazione**: Integrare Sentry o simile per tracking errori in produzione

### 12. **Monitoring**
**Raccomandazione**: Aggiungere monitoring per:
- Tempo di risposta API
- Errori database
- Utilizzo memoria
- Throughput richieste

### 13. **Backup Database**
**Verifica**: Assicurarsi che Supabase abbia backup automatici configurati

### 14. **SSL/TLS Certificate**
**Verifica**: Assicurarsi che il certificato SSL sia valido e non in scadenza

### 15. **Build Optimization**
**Verifica**: Eseguire `npm run build` e verificare:
- Nessun errore TypeScript
- Nessun warning critico
- Bundle size ragionevole

## 📋 Checklist Pre-Deploy

### Prima del Deploy
- [ ] Tutte le variabili d'ambiente configurate
- [ ] `NODE_ENV=production` impostato
- [ ] `NEXT_PUBLIC_BASE_URL` impostato correttamente
- [ ] `ADMIN_USERNAME` e `ADMIN_PASSWORD` configurati
- [ ] Build eseguito con successo (`npm run build`)
- [ ] Test di login admin funzionante
- [ ] Test prenotazione funzionante
- [ ] Test export CSV funzionante

### Dopo il Deploy
- [ ] Verificare che HTTPS funzioni correttamente
- [ ] Verificare che cookie secure sia abilitato (controllare DevTools)
- [ ] Testare login admin
- [ ] Testare prenotazione end-to-end
- [ ] Verificare che email vengano inviate correttamente
- [ ] Monitorare errori nei log
- [ ] Verificare performance iniziale

## 🔧 Fix Rapidi da Applicare

### Fix 1: Cookie Secure più Robusto
```typescript
// In app/api/admin/login/route.ts
const isHTTPS = request.url.startsWith('https://')
const isProduction = process.env.NODE_ENV === 'production'
cookieStore.set("admin-auth", "authenticated", {
  httpOnly: true,
  secure: isHTTPS || isProduction, // Usa HTTPS se disponibile
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
  path: "/",
})
```

### Fix 2: Middleware Host Check più Sicuro
```typescript
// In middleware.ts
const allowedAdminHosts = [
  'admin.booking.montecchiaperformancecenter.it',
]
if (allowedAdminHosts.includes(host)) {
  // ...
}
```

### Fix 3: Validazione Env all'Avvio
Creare `lib/env-check.ts` e chiamarlo in `app/layout.tsx` o `middleware.ts`

## 📝 Note Finali

- **Test in staging**: Se possibile, testare prima in un ambiente di staging
- **Rollback plan**: Avere un piano di rollback in caso di problemi
- **Documentazione**: Documentare le variabili d'ambiente necessarie per il team
- **Monitoring**: Configurare alerting per errori critici

