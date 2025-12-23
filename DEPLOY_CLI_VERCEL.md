# Deploy con Vercel CLI

## Problema
Il deploy manuale dall'interfaccia web di Vercel non funziona (errore "A commit author is required").

## Soluzione: Usa Vercel CLI

### Passo 1: Installa Vercel CLI

```bash
npm i -g vercel
```

### Passo 2: Login a Vercel

```bash
vercel login
```

Questo aprirà il browser per autenticarti.

### Passo 3: Link il progetto (se non già linkato)

```bash
cd /Users/charles/Desktop/Code/montecchia-booking
vercel link
```

Ti chiederà:
- **Set up and deploy?** → Scegli il progetto esistente `booking_simulatore`
- **Which scope?** → Scegli il tuo account
- **Link to existing project?** → Sì
- **What's the name of your existing project?** → `booking_simulatore`

### Passo 4: Deploy in Produzione

```bash
vercel --prod
```

Questo farà il deploy dell'ultimo commit su `main` in produzione.

### Verifica

Dopo il deploy:
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `booking_simulatore`
3. Verifica che il nuovo deployment sia associato al commit `6e6983c`
4. Testa l'applicazione su `https://booking.montecchiaperformancecenter.it/admin/bookings`

## Alternativa: Verifica Deploy Automatico

Prima di usare il CLI, verifica se il deploy automatico è partito:

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona `booking_simulatore`
3. Vai su **Deployments**
4. Controlla se c'è un nuovo deployment in corso o completato con commit `6e6983c`

Se il deploy automatico è partito, non serve usare il CLI.

## Troubleshooting

### Se `vercel link` non trova il progetto:
- Assicurati di essere loggato con l'account corretto
- Verifica che il progetto esista su Vercel

### Se il deploy fallisce:
- Controlla i log di build
- Verifica che tutte le variabili d'ambiente siano configurate
- Assicurati che `npm run build` funzioni in locale



