# VirusCare – Patient Management System

A patient management console for a virus quarantine & treatment facility: daily temperature
tracking, coordinated doctor visits, a two-step discharge workflow, and outcome reporting against
the 15% mortality benchmark.

Built with **React + Vite + TypeScript + Tailwind + React Router + Recharts**. It runs fully in the
browser (demo mode) with data persisted to `localStorage` behind a swappable repository layer — no
backend required.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run test       # unit tests (Vitest)
npm run lint       # ESLint
npm run format     # Prettier
```

## Roles & screens

Sign in as any role (authentication is simulated in demo mode):

| Role | Screens |
| --- | --- |
| Nurse | Dashboard, Temperature rounds |
| Doctor | Dashboard, Doctor visits, Discharge (approve), Settings |
| Admin | Dashboard, Patients (admit + register), Discharge (finalize), Settings |
| Manager | Dashboard, Reports, Settings |

Routes are role-guarded; navigating to a page outside your role redirects to the dashboard.

## Architecture

```
src/
  logic.ts                 Domain model + rules (fever, cure, capacity, mortality) + migration
  data/repository.ts       FacilityRepository interface + LocalStorage adapter (swap for an API)
  state/
    AuthContext.tsx        Current role / simulated session
    FacilityContext.tsx    Single mutation pipe: role gate -> validation -> activity log -> toast
    ToastContext.tsx       Transient notifications
  components/              UI primitives, Layout (sidebar + topbar), Modal/Confirm, ErrorBoundary,
                          PatientDetail, FeverChart, Toaster, RouteGuard
  pages/                  Login, Dashboard, Temperature, Visits, Discharge, Patients, Reports,
                          Settings, NotFound
  lib/                    CSV export, printable discharge summary
```

Data flow: **Pages → hooks (`useFacility`/`useAuth`/`useToast`) → FacilityContext → repository →
localStorage**, with all domain rules isolated in `logic.ts`. Because persistence sits behind the
`FacilityRepository` interface, pointing the app at a real REST/Supabase backend later requires no
changes to the UI or domain code.

## Implemented rules

- Fever threshold 38 °C; one temperature per patient per day (duplicates blocked); valid range 34–42 °C.
- One doctor visit per day; a visit before the temperature is taken requires an emergency reason and is flagged.
- Discharge requires 3 consecutive fever-free days → doctor approval → admin discharge (room released only at the final step).
- 74-bed cap; no assigning an occupied room; next-free-room suggestion.
- Discharge-delay metric surfaces dischargeable patients still holding rooms.
- Mortality = deaths ÷ total admitted, with a warning above the 15% benchmark.
- Role-based actions throughout, with a full activity log.
- Local-date calculations (never UTC).

## Deploy (Vercel)

1. Push this folder to a Git repo (`node_modules`, `dist`, `.env` are git-ignored).
2. Import on Vercel. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. `vercel.json` already provides the SPA fallback for client-side routing.

Supabase is not wired in; `.env.example` is a placeholder.
