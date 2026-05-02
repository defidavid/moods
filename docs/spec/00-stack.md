# 00 — Stack

Every dependency and the rationale for it. Gas City must use these exact choices. No substitutions.

## Mobile

| Dependency                       | Version       | Purpose                                                |
|----------------------------------|---------------|--------------------------------------------------------|
| `expo`                           | `~51.0.0`     | RN runtime, build, OTA — managed workflow              |
| `expo-router`                    | `~3.5.0`      | File-based routing, stacks + tabs                      |
| `react`                          | `18.2.0`      | Pinned by Expo SDK                                     |
| `react-native`                   | `0.74.x`      | Pinned by Expo SDK                                     |
| `typescript`                     | `~5.3.0`      | Type checking                                          |
| `zustand`                        | `^4.5.0`      | Single global store, no boilerplate                    |
| `@react-native-async-storage/async-storage` | `1.23.x` | Token + ephemeral cache                       |
| `react-native-gifted-charts`     | `^1.4.0`      | Bar chart for Insights                                 |
| `expo-haptics`                   | `~13.0.0`     | Haptic ticks on intensity slider                       |
| `react-native-reanimated`        | `~3.10.0`     | Quadrant expand animation                              |
| `react-native-gesture-handler`   | `~2.16.0`     | Touchables consistent with Reanimated                  |
| `react-native-safe-area-context` | `4.10.x`      | Required peer for expo-router native navigation        |
| `react-native-screens`           | `~3.31.0`     | Required peer for expo-router native navigation        |
| `expo-linking`                   | `~6.3.0`      | Deep-link handling, peer of expo-router                |
| `expo-status-bar`                | `~1.12.0`     | Status bar component used by the route shell           |

No additional UI library (no NativeBase, no Tamagui, no React Native Paper). Components are hand-written against the design tokens in `spec/03-design-system.md`.

## Backend

| Dependency               | Version    | Purpose                                            |
|--------------------------|------------|----------------------------------------------------|
| `node`                   | `>=20.10`  | Runtime — declared in `engines`                     |
| `fastify`                | `^4.26.0`  | HTTP framework                                     |
| `@fastify/cors`          | `^9.0.0`   | CORS for Expo dev server                           |
| `@fastify/sensible`      | `^5.5.0`   | Standard error helpers                             |
| `zod`                    | `^3.23.0`  | Runtime validation, single source of truth for types |
| `pino-pretty`            | `^11.0.0`  | Dev log readability                                |
| `uuid`                   | `^9.0.1`   | Entry IDs                                          |
| `tsx`                    | `^4.7.0`   | TypeScript execution in dev                         |
| `typescript`             | `~5.3.0`   | Build + checks                                     |
| `vitest`                 | `^1.5.0`   | Test runner                                        |

No ORM. No HTTP client (the backend doesn't talk to anything). No queue, no broker, no cache, no migrator.

## Tooling

- Package manager: `npm` (not yarn, not pnpm). Lock files are committed.
- Lint: `eslint` with `@react-native` and `@typescript-eslint` recommended only. No custom rules.
- Formatter: `prettier` defaults, no config file beyond `printWidth: 100`.
- Editor expectations: VS Code with TypeScript + ESLint extensions. No `.vscode/settings.json`.

## Versioning policy

- Use the versions above as `^` or `~` per the table.
- If `npm install` fails because a published version no longer matches, bump to the nearest published patch and record the new version in this file before continuing.
- Do not introduce a dependency not on this list without first proposing it as a change to this file.

## Stack-level non-goals

- No monorepo tooling (Nx, Turborepo, Lerna).
- No code generation from OpenAPI / GraphQL / etc.
- No native modules beyond what Expo SDK ships managed.
- No CI/CD config (no `.github/workflows`).
