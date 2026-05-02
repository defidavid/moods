# Mobile 00 — Overview

## Purpose

Architectural summary for the Moods mobile app. Read first; every other mobile file assumes the choices below are settled. Where an implementation choice could be made, it has been; substitutions are not allowed.

## Stack snapshot

- Expo SDK 51 (managed workflow), React 18.2, React Native 0.74.
- Expo Router 3.5 for file-based routing (single Stack at the root, Tabs nested inside).
- Zustand 4.5 — single global store, no slices, no middleware beyond the bare creator.
- Native `fetch` wrapped by `lib/api.ts`. No axios, no react-query, no swr.
- AsyncStorage holds **only** the auth token (key `moods.token`). Entries and emotions live in the Zustand store, not on disk.
- React Native Reanimated 3.10 for the quadrant expand/collapse animation.
- `expo-haptics` for the intensity slider tick.
- `react-native-gifted-charts` for the Insights stacked bar.
- No UI library, no icon library, no form library.

See `spec/00-stack.md` for exact pins.

## File tree (target end state)

```
moods/
├── app/
│   ├── _layout.tsx              # root Stack + auth gate
│   ├── login.tsx                # /login
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab.Navigator (Log / Today / Insights)
│   │   ├── log.tsx              # /(tabs)/log
│   │   ├── today.tsx            # /(tabs)/today
│   │   └── insights.tsx         # /(tabs)/insights
│   └── entry/
│       └── [id].tsx             # /entry/[id]
├── components/
│   ├── Button.tsx
│   ├── QuadrantTile.tsx
│   ├── EmotionChip.tsx
│   ├── IntensitySlider.tsx
│   ├── IntensityDots.tsx
│   ├── EntryCard.tsx
│   └── EmptyState.tsx
├── lib/
│   ├── api.ts                   # typed fetch wrapper
│   ├── store.ts                 # Zustand store (single)
│   ├── types.ts                 # copied verbatim from spec/01
│   ├── emotions.ts              # bundled fallback taxonomy
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── quadrants.ts             # quadrant -> {label,color,gridPosition}
├── app.json
├── package.json
└── tsconfig.json
```

No `src/` directory. Expo Router requires `app/` at the project root.

## Data flow

```
launch
  └─► app/_layout.tsx
        ├─► useStore.hydrate()        # reads moods.token from AsyncStorage
        ├─► api.getEmotions() ───┐    # success: setEmotions(server list)
        │                        └─►  # failure: keep bundled EMOTIONS
        └─► auth gate
              ├─ no token  → <Redirect href="/login" />
              └─ token     → render <Stack> children (tabs)
```

After login, `app/(tabs)/log.tsx` mounts. On first focus the tabs may call `api.getEntries()` to populate the store; subsequent log/delete calls mutate the store directly so screens re-render without re-fetching.

## State boundaries

- **AsyncStorage:** token only. Cleared on 401 (see `lib/api.ts`).
- **Zustand store (`lib/store.ts`):** token, user, entries[], emotions[]. Memory only; rehydrated from server on each cold launch.
- **Component state:** ephemeral UI only — selected quadrant in the log flow, slider value before submit, note draft. Never persisted.

## Bundled emotion fallback

Per `spec/02-emotion-taxonomy.md`, `lib/emotions.ts` exports the canonical 16-entry `EMOTIONS` array. The store seeds `emotions` to `EMOTIONS` synchronously at construction time. `api.getEmotions()` overwrites with the server response on success; on failure the bundled list stays. This satisfies AC-40.

## Tab/screen ownership

| Screen            | Owns ACs                                    |
|-------------------|---------------------------------------------|
| `app/login.tsx`   | AC-01, AC-02                                |
| `app/(tabs)/log`  | AC-03 (tab bar shared), AC-05–AC-14, AC-39  |
| `app/(tabs)/today`| AC-15, AC-16, AC-17                         |
| `app/(tabs)/insights` | AC-18, AC-19, AC-20                     |
| `app/entry/[id]`  | AC-21, AC-22, AC-23                         |
| `lib/api.ts`      | AC-04 (401 handling), AC-39, AC-40 paths    |
| `lib/store.ts`    | AC-02 (token persistence), AC-11/AC-22 (live updates) |
| `app/_layout.tsx` | AC-01 (auth gate)                           |

Mobile does not own AC-24 through AC-37 (backend) or AC-38 (integration check); those ACs are verified end-to-end against this implementation.

## Non-goals (mobile)

- No offline write queue. A submit failure stays on the intensity step (AC-39).
- No optimistic UI. Entries appear in the store only after `POST /entries` resolves.
- No swipe-to-delete. Deletion is via the entry detail screen only (AC-22).
- No theme switcher. Light only (`spec/03-design-system.md`).
- No deep links beyond Expo Router defaults. `scheme: "moods"` is declared but no custom handlers.
