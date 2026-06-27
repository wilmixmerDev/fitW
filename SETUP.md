# fitW — Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

## 1. Environment Variables

Copy `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# From Supabase > Settings > Database > Connection string
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

Also copy these to `.env` so Prisma CLI can use them:

```bash
cp .env.local .env
```

## 2. Database Migration

```bash
npx prisma migrate dev --name init
```

## 3. Seed Food Database

```bash
npm run db:seed
```

> The seed script adds ~55 common foods to get started.

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account.

## 5. Deploy to Vercel

```bash
npx vercel
```

Add the same environment variables in your Vercel project settings.

---

## Supabase Auth Settings

In your Supabase dashboard:
1. Go to **Authentication > URL Configuration**
2. Set Site URL to your production URL (or `http://localhost:3000` for dev)
3. Add `http://localhost:3000/auth/callback` to allowed redirect URLs

## Project Structure

```
src/
  app/
    (auth)/          # Login & Register pages
    (app)/           # Protected app pages
      dashboard/     # Main calorie/macro dashboard
      log/           # Food logging by date
      progress/      # Charts and weight tracking
      settings/      # Profile and goal settings
    onboarding/      # First-time setup questionnaire
    api/             # REST API routes
  components/
    dashboard/       # Calorie ring, macro bars
    food/            # Food search dialog, log client
    onboarding/      # Multi-step form
    progress/        # Recharts visualizations
    settings/        # Profile editor
    layout/          # Sidebar, bottom navigation
  lib/
    prisma.ts        # Prisma client singleton
    supabase/        # Supabase client helpers
    calculations.ts  # TDEE, macro calculations
  types/             # Shared TypeScript types
```
