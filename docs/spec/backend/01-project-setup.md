# Backend — 01 Project Setup

## Purpose

Stand up the `backend/` npm project: `package.json`, `tsconfig.json`, `.gitignore`. After this file, `cd backend && npm install` succeeds and `npm run dev` would start (once `src/server.ts` exists).

Pinned dependency versions come from `spec/00-stack.md`. Do not bump.

## Files to create

- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.gitignore`

## `backend/package.json` (canonical)

```json
{
  "name": "moods-backend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.10"
  },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "test": "vitest run",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.0",
    "@fastify/sensible": "^5.5.0",
    "fastify": "^4.26.0",
    "pino-pretty": "^11.0.0",
    "uuid": "^9.0.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/uuid": "^9.0.8",
    "tsx": "^4.7.0",
    "typescript": "~5.3.0",
    "vitest": "^1.5.0"
  }
}
```

Notes:
- `"type": "module"` is mandatory — every `import` is ESM and `tsconfig.module` is `NodeNext`.
- `start` uses `tsx` (not `node dist/...`) because v0 has no build step. tsx-from-source is the deploy story.
- `seed` is a manual escape hatch (`npm run seed`) for forcing a re-seed during development. The boot path also seeds; this script just calls the same function.

## `backend/tsconfig.json` (canonical)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Notes:
- `noEmit: true` — we never compile to JS. tsx executes `.ts` directly.
- `noUncheckedIndexedAccess` is on, so `map.get(id)` returns `T | undefined`. The store and routes must handle the `undefined` branch.
- `verbatimModuleSyntax: false` keeps the snippets in this spec free of `import type` ceremony; flip later if desired.

## `backend/.gitignore` (canonical)

```gitignore
node_modules
dist
db.json
*.log
.DS_Store
```

`db.json` is gitignored because it is generated. `db.seed.json` is committed.

## Verification

```bash
cd backend
npm install
npx tsc --noEmit
```

`npm install` exits 0. `tsc --noEmit` exits 0 (with no source files yet, this is a no-op; once `src/` exists it must stay clean).

## Acceptance criteria

This file owns no ACs directly. It is the foundation for AC-24 through AC-37.
