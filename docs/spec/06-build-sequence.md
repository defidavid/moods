# 06 — Build Sequence

The exact order in which Gas City should consume and act on the spec files. Each step has an entry condition and an exit condition. Do not advance until the exit condition is met.

## Phase 0 — Read foundation (no code yet)

Read in order. Do not skim. These files are referenced from every implementation file.

1. `docs/moods-spec.md` (master)
2. `spec/00-stack.md`
3. `spec/01-data-contracts.md`
4. `spec/02-emotion-taxonomy.md`
5. `spec/03-design-system.md`
6. `spec/04-api-contract.md`
7. `spec/05-acceptance-criteria.md`

**Exit condition:** All seven files have been read; no implementation has begun.

## Phase 1 — Backend

The backend is built first because mobile tests can't pass without it.

| Step | File                                | Output                                     | Verify                                  |
|------|-------------------------------------|--------------------------------------------|-----------------------------------------|
| 1.1  | `spec/backend/00-overview.md`       | (read only)                                | —                                       |
| 1.2  | `spec/backend/01-project-setup.md`  | `backend/package.json`, `tsconfig.json`, scripts | `cd backend && npm install` succeeds |
| 1.3  | `spec/backend/02-data-store.md`     | `backend/src/db.ts`, `backend/src/store/entries.ts` | unit tests for atomic write pass    |
| 1.4  | `spec/backend/03-validation.md`     | `backend/src/validation.ts`                | schemas compile, types inferred         |
| 1.5  | `spec/backend/04-error-handling.md` | `backend/src/plugins/errorHandler.ts`      | wired in `server.ts`                    |
| 1.6  | `spec/backend/05-auth-middleware.md`| `backend/src/plugins/auth.ts`              | hook rejects bad tokens                 |
| 1.7  | `spec/backend/06-route-auth.md`     | `backend/src/routes/auth.ts`               | `POST /login` returns the canonical body|
| 1.8  | `spec/backend/07-route-emotions.md` | `backend/src/routes/emotions.ts`           | `GET /emotions` returns 16 items        |
| 1.9  | `spec/backend/08-route-entries.md`  | `backend/src/routes/entries.ts`            | `POST/GET/DELETE` round-trip works      |
| 1.10 | `spec/backend/09-seed-data.md`      | `backend/src/seed.ts`, `backend/db.seed.json` | first-boot seed populates store      |
| 1.11 | `spec/backend/10-tests.md`          | `backend/test/**`                          | `npm test` is green                     |

**Exit condition:** `cd backend && npm run dev` starts cleanly on port 3000; manually hitting `POST /login`, `GET /emotions`, `POST /entries`, `GET /entries`, `DELETE /entries/:id` with `curl` matches the spec; `npm test` passes; ACs 24–37 are satisfied.

## Phase 2 — Mobile

Mobile work begins only after Phase 1 exit.

| Step | File                                  | Output                                       | Verify                                      |
|------|---------------------------------------|----------------------------------------------|---------------------------------------------|
| 2.1  | `spec/mobile/00-overview.md`          | (read only)                                  | —                                           |
| 2.2  | `spec/mobile/01-project-setup.md`     | `package.json`, `app.json`, `tsconfig.json`  | `npm install && npx expo start` boots       |
| 2.3  | `spec/mobile/02-routing.md`           | `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, route stubs | tabs visible, auth gate redirects |
| 2.4  | `spec/mobile/03-state-store.md`       | `lib/store.ts`                               | store initializes, hydrates token           |
| 2.5  | `spec/mobile/04-api-client.md`        | `lib/api.ts`                                 | typed methods for every endpoint            |
| 2.6  | `spec/mobile/05-design-tokens.md`     | `lib/colors.ts`, `lib/spacing.ts`, `lib/typography.ts` | imports compile                  |
| 2.7  | `spec/mobile/06-shared-components.md` | `components/QuadrantTile.tsx`, `EmotionChip.tsx`, `IntensityDots.tsx`, `IntensitySlider.tsx`, `EntryCard.tsx`, `Button.tsx` | render in isolation |
| 2.8  | `spec/mobile/07-screen-login.md`      | `app/login.tsx`                              | AC-01, AC-02 pass                           |
| 2.9  | `spec/mobile/08-screen-log.md`        | `app/(tabs)/log.tsx`                         | AC-05 through AC-14 pass                    |
| 2.10 | `spec/mobile/09-screen-today.md`      | `app/(tabs)/today.tsx`                       | AC-15 through AC-17 pass                    |
| 2.11 | `spec/mobile/10-screen-insights.md`   | `app/(tabs)/insights.tsx`                    | AC-18 through AC-20 pass                    |
| 2.12 | `spec/mobile/11-screen-entry-detail.md` | `app/entry/[id].tsx`                       | AC-21 through AC-23 pass                    |

**Exit condition:** Backend running; `npx expo start`; on the iOS simulator, the entire happy path from `spec/05-acceptance-criteria.md` AC-38 succeeds.

## Phase 3 — Cross-cutting verification

Run the full AC list one pass. Anything failing reopens the corresponding implementation file. Do not patch by editing the spec; fix the code.

## Dependency graph

```
01-data-contracts.md ──► every other file
02-emotion-taxonomy.md ──► spec/04, spec/backend/07, spec/backend/09, spec/mobile/05, spec/mobile/08
03-design-system.md  ──► spec/mobile/05, 06, 07, 08, 09, 10, 11
04-api-contract.md   ──► spec/backend/* (06, 07, 08), spec/mobile/04
05-acceptance-criteria.md ──► every implementation file (referenced by AC ID)

Backend Phase 1 ──► Mobile Phase 2 (mobile cannot complete without a running API)
```

## Definition of "done" (sequence-level)

- All steps above completed.
- All ACs in `spec/05-acceptance-criteria.md` pass.
- `git status` shows only files referenced by the spec (no orphans, no scratch files).
- README.md at the repo root contains the 5-line getting-started block.
