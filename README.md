This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Montecchia Booking - TrackMan iO Simulator Booking System

Sistema di prenotazione per il simulatore TrackMan iO presso il Montecchia Performance Center.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables by creating a `.env.local` file:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (for email notifications)
RESEND_API_KEY=your_resend_api_key

# Admin email (for booking notifications)
ADMIN_EMAIL=admin@montecchia-performance.com

# Admin authentication (OBBLIGATORIO in produzione)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# Base URL (used for internal API calls)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**: Le credenziali `ADMIN_USERNAME` e `ADMIN_PASSWORD` sono **obbligatorie** in produzione. 
Senza queste variabili, il login admin non funzionerà. Assicurati di usare password sicure.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
