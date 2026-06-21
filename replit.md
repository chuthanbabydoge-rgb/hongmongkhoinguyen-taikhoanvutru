# Universe Account System

A production-ready central identity platform with authentication, authorization, session management, device tracking, roles, and permissions — built with a deep-space glassmorphism UI.

## Run & Operate

- `pnpm --filter @workspace/universe-account run dev` — run the frontend (port 20301)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React + Vite + Wouter (routing)
- Tailwind v4 + Framer Motion (glassmorphism UI)
- Zod + react-hook-form (validation)
- Mock backend + localStorage (Supabase-ready)
- Express 5 (API server, unused in current build)

## Where things live

```
artifacts/universe-account/src/
  lib/
    mock/           # mockApi.ts (all API logic), mockData.ts (seed data)
    store/          # authStore, sessionStore, deviceStore (localStorage)
    types/          # user.ts, session.ts, device.ts
    utils/          # auth.ts (token, dates), crypto.ts, permissions.ts
  contexts/         # AuthContext.tsx (global auth state)
  hooks/            # useAuth, usePermissions, useSessions, useDevices
  components/
    auth/           # ProtectedRoute, RoleBadge
    glass/          # GlassCard, GlassPanel
    layout/         # AppShell, Sidebar, Header
  pages/
    auth/           # LoginPage, RegisterPage
    AccountCenterPage, SecurityCenterPage, DevicesPage, SessionsPage
```

## Architecture decisions

- **Mock API with Supabase comments**: All API calls are in `mockApi.ts` with `// SUPABASE:` comments showing exact replacement calls — swap in one file to go live.
- **localStorage-backed stores**: `authStore`, `sessionStore`, `deviceStore` centralize all persistence — easy to swap for a real DB session layer.
- **Role-based permissions**: `ROLE_PERMISSIONS` map in `permissions.ts` is the single source of truth — extend roles without touching components.
- **Dark mode via HTML class**: `html.dark` set in `index.html`, avoids Tailwind v4 `@apply dark` limitation.
- **No API server needed for MVP**: Frontend is fully self-contained; the API server artifact exists for future Supabase/real-backend integration.

## Product

- **Login / Register**: Full-page glassmorphism auth with demo account shortcuts
- **Account Center**: User profile, level bar, security score, permissions, recent activity
- **Security Center**: Security score breakdown, 2FA toggle, password change, security events
- **Devices**: Grid of registered devices, trust/untrust/remove, register current device
- **Sessions**: Active session list, revoke individual sessions or all at once

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@universe.io | password123 | Admin |
| creator@universe.io | password123 | Creator |
| user@universe.io | password123 | User |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Tailwind v4**: Cannot use `@apply dark` in CSS — add `class="dark"` to `<html>` in `index.html` instead.
- **Supabase migration**: Replace `mockApi.ts` functions with Supabase SDK calls — each has a `// SUPABASE:` comment.
- All mock data initializes from `mockData.ts` on first localStorage access.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
