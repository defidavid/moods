# Mobile 01 — Project Setup

## Purpose

Stand up the Expo project shell so subsequent steps have a working install. Versions are pinned per `spec/00-stack.md`; do not substitute. After this step, `npm install && npx expo start` must boot to the Expo dev menu (no screens yet — those come in step 2.3).

## Files to create

- `/package.json`
- `/app.json`
- `/tsconfig.json`
- `/babel.config.js`

All paths are repo-root (no `src/`, no `mobile/` subfolder).

## `package.json`

```json
{
  "name": "moods",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-haptics": "~13.0.0",
    "expo-linking": "~6.3.0",
    "expo-status-bar": "~1.12.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "react-native-gifted-charts": "^1.4.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.45",
    "typescript": "~5.3.0",
    "eslint": "^8.57.0",
    "@react-native/eslint-config": "^0.74.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "prettier": "^3.2.0"
  }
}
```

No additional packages. If `npm install` fails because a published version no longer matches, bump to the nearest published patch and update `spec/00-stack.md` first.

## `app.json`

```json
{
  "expo": {
    "name": "Moods",
    "slug": "moods",
    "scheme": "moods",
    "version": "0.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": false,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.moods.app"
    },
    "android": {
      "package": "com.moods.app"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": false
    }
  }
}
```

No splash screen, no app icon configured beyond Expo defaults; v0 is dev-only. `userInterfaceStyle: "light"` aligns with the design system being light-only.

## `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

The `@/*` alias is intentional but unused by spec files; relative imports are still preferred in canonical snippets so they read in isolation.

## `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-reanimated/plugin must be listed last
      "react-native-reanimated/plugin",
    ],
  };
};
```

Reanimated requires the plugin or `useSharedValue`/`withTiming` calls fail at runtime.

## Boot command

```bash
npm install
npx expo start --clear
```

Press `i` for iOS simulator. The app should boot to a dev-rendered "unmatched route" placeholder until step 2.3 adds the routes.

## Behavior notes

- The mobile project lives at the repo root. The backend is independent under `/backend`.
- Lockfile (`package-lock.json`) is committed.
- Do not generate `metro.config.js` — Expo's default works.
- Do not generate `.eslintrc` beyond what `@react-native/eslint-config` provides; create `.eslintrc.js`:

  ```js
  module.exports = {
    root: true,
    extends: ["@react-native", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
  };
  ```

- Do not commit `.env`. Use `EXPO_PUBLIC_API_URL` from the shell when overriding the default API base.

## ACs in scope

This step satisfies no ACs directly but is the precondition for AC-01 onward. Verify by running `npm run typecheck` and `npx expo start` cleanly.
