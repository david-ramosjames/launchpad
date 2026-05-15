# Launch Pad — Ramos James Law

Internal employee portal: a visual command center for tools, workflows, training, and internal links.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI components
- Firebase Auth (Google) + Firestore
- Vercel-ready

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Firebase project**

   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Google** sign-in under Authentication
   - Create a **Firestore** database
   - Deploy rules and indexes:

     ```bash
     firebase deploy --only firestore:rules,firestore:indexes
     ```

3. **Environment**

   Copy `.env.example` to `.env.local` and fill in values:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_FIREBASE_*` | Firebase web app config |
   | `NEXT_PUBLIC_APPROVED_DOMAINS` | Comma-separated email domains |
   | `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | Emails that get `super_admin` on first login |
   | `SEED_SECRET` | Secret for the seed API route |

4. **Seed starter data**

   After the app is running and env is set:

   ```bash
   curl -X POST http://localhost:3000/api/seed -H "x-seed-secret: YOUR_SEED_SECRET"
   ```

5. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and sign in with an approved Google account.

## Roles

| Role | Access |
|------|--------|
| `viewer` | See cards allowed by visibility |
| `editor` | Same + more card visibility |
| `admin` | Admin panel: cards, categories, announcements |
| `super_admin` | Admin + change any user's role |

## Project structure

```
src/
  app/              # Pages (dashboard, login, admin, seed API)
  components/       # UI, dashboard, admin, auth
  contexts/         # AuthProvider
  hooks/            # useLaunchData
  lib/              # Firebase, Firestore helpers, seed data, filters
  types/            # Shared TypeScript types
```

## Deploy (Vercel)

1. Push to GitHub and import in Vercel
2. Add all `NEXT_PUBLIC_*` and `SEED_SECRET` env vars
3. Deploy Firestore rules/indexes to production Firebase
4. Call the seed endpoint once after first deploy

## Security notes

- Only approved domains/emails can sign in
- Admin routes are protected client-side and should be backed by Firestore rules
- This app is a link/workflow hub — no case data is stored here
