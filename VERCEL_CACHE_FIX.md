# Fix Cache Vercel - Componenti UI Non Trovati

## Problema
Il build su Vercel fallisce con errore:
```
Module not found: Can't resolve '@/components/ui/card'
Module not found: Can't resolve '@/components/ui/input'
Module not found: Can't resolve '@/components/ui/button'
```

## Causa Probabile
La cache di build su Vercel potrebbe essere corrotta o non includere i componenti UI.

## Soluzione: Rebuild Senza Cache

### Opzione 1: Redeploy Senza Cache (CONSIGLIATO)

1. **Vai su Vercel Dashboard**
   - Apri [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Seleziona il progetto `booking_simulatore`

2. **Vai su Deployments**
   - Trova l'ultimo deployment fallito
   - Clicca sui **tre puntini (`...`)** accanto al deployment
   - Seleziona **"Redeploy"**

3. **IMPORTANTE: Deseleziona la Cache**
   - **Deseleziona** la checkbox **"Use existing Build Cache"**
   - Questo forzerà un rebuild completo senza usare la cache

4. **Clicca "Redeploy"**
   - Attendi il completamento del build (2-5 minuti)

### Opzione 2: Cancella Cache Manualmente

1. **Vai su Vercel Dashboard → Settings → General**
2. **Scorri fino a "Build Cache"**
3. **Clicca "Clear Build Cache"**
4. **Fai un nuovo deploy**

### Opzione 3: Verifica File su GitHub

Assicurati che i componenti siano su GitHub:

1. Vai su [GitHub Repository](https://github.com/carlodl-git/booking_simulatore)
2. Naviga a `components/ui/`
3. Verifica che tutti i file siano presenti:
   - `card.tsx`
   - `input.tsx`
   - `button.tsx`
   - `table.tsx`
   - `dialog.tsx`
   - `label.tsx`
   - `date-picker.tsx`
   - E altri...

## Verifica Dopo il Rebuild

1. **Controlla i log di build**
   - Dovrebbero mostrare che i componenti vengono trovati
   - Non dovrebbero più esserci errori "Module not found"

2. **Se il problema persiste:**
   - Verifica che `tsconfig.json` abbia `"paths": { "@/*": ["./*"] }`
   - Verifica che tutti i componenti siano committati: `git ls-files components/ui/`
   - Prova a fare un commit vuoto per triggerare un nuovo deploy

## Nota
Il commit `Force rebuild: clear Vercel cache for component resolution` è stato creato per triggerare un nuovo deploy. Se fai il redeploy senza cache, questo dovrebbe risolvere il problema.



