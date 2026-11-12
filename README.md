# VirusCare – Patient Management System
React + Vite + TypeScript + Tailwind + Lucide. Runs in demo mode (localStorage) with no backend.

## Run
npm install && npm run dev      # build: npm run build

## Deploy on Vercel
1. Push this folder to a GitHub repo (node_modules, dist and .env are git-ignored).
2. vercel.com → Add New Project → import the repo. Framework preset: Vite (build `npm run build`, output `dist`).
3. Deploy. vercel.json already provides the SPA fallback.
(Or: `npx vercel --prod` from this folder.)

## Rules implemented
Fever ≥ 38°C · one temperature/day (duplicates blocked) · one visit/day · visit without temperature needs an emergency reason and is flagged ·
discharge needs 3 consecutive fever-free days, doctor approval, then admin discharge (room released only then) · 74-patient cap · no occupied-room assignment ·
role-based actions · activity log · local-date calculations (no UTC). Mortality = deaths ÷ total admitted.
Supabase is not wired in; .env.example is a placeholder.
