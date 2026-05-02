# Moods — Master Specification

## What We're Building

A React Native mood-tracking mobile app with a dummy Node.js backend, intended to be implemented end-to-end by the Gas City agent harness. Functionally similar to a 4-quadrant mood-grid app: three-tap logging, today list, weekly insights. Rebranded for experimental learning — not for publication.

The spec describes a complete, runnable v0 product: working sign-in (mocked), working CRUD on mood entries against a real (in-memory + JSON-persisted) Node API, working chart, polished and consistent UI. No clever architecture; every choice is the most boring viable option.

## How to Read This Spec

This document is the entry point. Every other file lives under `docs/spec/` and is numbered to indicate the order in which Gas City should consume and act on it.

### Foundation (read before doing anything; never out of date)
- `spec/00-stack.md` — every dependency, exact version pin policy
- `spec/01-data-contracts.md` — TypeScript types shared by mobile + backend
- `spec/02-emotion-taxonomy.md` — canonical emotion list (source of truth)
- `spec/03-design-system.md` — colors, spacing, typography, component patterns
- `spec/04-api-contract.md` — REST contract with literal request/response payloads
- `spec/05-acceptance-criteria.md` — every AC, grouped (mobile / backend / integration)
- `spec/06-build-sequence.md` — the exact file-by-file execution order

### Backend implementation (`spec/backend/`)
`00-overview` → `01-project-setup` → `02-data-store` → `03-validation` → `04-error-handling` → `05-auth-middleware` → `06-route-auth` → `07-route-emotions` → `08-route-entries` → `09-seed-data` → `10-tests`

### Mobile implementation (`spec/mobile/`)
`00-overview` → `01-project-setup` → `02-routing` → `03-state-store` → `04-api-client` → `05-design-tokens` → `06-shared-components` → `07-screen-login` → `08-screen-log` → `09-screen-today` → `10-screen-insights` → `11-screen-entry-detail`

Backend should be built end-to-end before mobile begins, because mobile depends on a running API to verify any non-trivial AC.

## Conventions

- Every code snippet in this spec is canonical. Copy literally unless the file explicitly marks it as illustrative.
- Every AC is testable. An implementation that does not satisfy its ACs is rejected.
- "Should" is advisory. "Must" is load-bearing.
- File paths in the spec are relative to the repo root (`moods/`) unless otherwise noted.
- All sample IDs, timestamps, and tokens are documentation examples, not seed data. Seed data lives in `spec/backend/09-seed-data.md`.
- When a foundation file and an implementation file disagree, the foundation file wins. Open an issue, do not silently diverge.

## Out of Scope (do not build, do not propose)

- Real authentication providers (Apple, Google, OAuth, JWT). The app uses a hardcoded `demo-token`.
- Multi-user data. Every entry belongs to user `u1`.
- Offline mode, background sync, conflict resolution.
- Push notifications, scheduled reminders.
- SQLite, Postgres, Redis, Bull, Docker, Kubernetes.
- Encryption at rest, TLS termination, secret managers.
- App Store / Play Store metadata, privacy policy, analytics SDKs.
- Web build, admin dashboard, internationalization beyond English.

## Repo Layout (target end state)

```
moods/
├── app/                    # Expo Router routes (mobile)
├── components/             # shared RN components
├── lib/                    # api client, Zustand store, types, design tokens
├── backend/                # Fastify server (independent npm project)
├── docs/spec/              # this specification
├── app.json                # Expo config
├── package.json            # mobile deps
├── tsconfig.json
└── README.md               # 5-line getting-started
```

## Definition of Done (whole product)

The product is done when:
1. Every file in `spec/build-sequence.md` exists at its target path.
2. Every AC in `spec/05-acceptance-criteria.md` passes manually or via the test suite (`spec/backend/10-tests.md`).
3. Both processes (`backend dev`, `expo start`) come up cleanly with no warnings related to spec items.
4. A new user can complete the path: launch app → tap Continue → log a mood → see it on Today → see it on Insights → tap into detail → delete → empty state restored.
