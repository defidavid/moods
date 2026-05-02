# 02 — Emotion Taxonomy

The canonical list of emotions. This file is the source of truth. Both mobile and backend must serve and render this exact list. The backend exposes it via `GET /emotions`; mobile may also bundle it as a fallback.

## The List

```json
[
  { "id": "energetic",  "label": "Energetic",  "quadrant": "yellow" },
  { "id": "excited",    "label": "Excited",    "quadrant": "yellow" },
  { "id": "joyful",     "label": "Joyful",     "quadrant": "yellow" },
  { "id": "proud",      "label": "Proud",      "quadrant": "yellow" },

  { "id": "calm",       "label": "Calm",       "quadrant": "green"  },
  { "id": "content",    "label": "Content",    "quadrant": "green"  },
  { "id": "grateful",   "label": "Grateful",   "quadrant": "green"  },
  { "id": "relaxed",    "label": "Relaxed",    "quadrant": "green"  },

  { "id": "angry",      "label": "Angry",      "quadrant": "red"    },
  { "id": "anxious",    "label": "Anxious",    "quadrant": "red"    },
  { "id": "frustrated", "label": "Frustrated", "quadrant": "red"    },
  { "id": "stressed",   "label": "Stressed",   "quadrant": "red"    },

  { "id": "sad",        "label": "Sad",        "quadrant": "blue"   },
  { "id": "tired",      "label": "Tired",      "quadrant": "blue"   },
  { "id": "lonely",     "label": "Lonely",     "quadrant": "blue"   },
  { "id": "bored",      "label": "Bored",      "quadrant": "blue"   }
]
```

16 emotions total, 4 per quadrant.

## Quadrant Display

| Quadrant | Display label                | Color (hex) | Grid position  |
|----------|------------------------------|-------------|----------------|
| `yellow` | High Energy / Pleasant       | `#F4D35E`   | top-left       |
| `red`    | High Energy / Unpleasant     | `#E07A5F`   | top-right      |
| `green`  | Low Energy / Pleasant        | `#7BC47F`   | bottom-left    |
| `blue`   | Low Energy / Unpleasant      | `#6B8AC4`   | bottom-right   |

Grid order is canonical: yellow → red on the top row, green → blue on the bottom row. The horizontal axis is energy (low → high reads left → right within each row inverted; just match the table). The vertical axis is pleasantness.

## Bundled fallback

The mobile app must include the JSON above bundled at `lib/emotions.ts`:

```ts
// lib/emotions.ts
import type { Emotion } from "./types";

export const EMOTIONS: Emotion[] = [
  // ... paste the JSON above as TypeScript object literals
];
```

On launch, the app calls `GET /emotions`. If the call fails, the bundled list is used. This keeps the wheel renderable even with the backend down.

## Extending the list

Adding emotions in the future requires:
1. Editing this file (the source of truth).
2. Re-copying the JSON into `lib/emotions.ts`.
3. Re-copying into `backend/src/seed.ts` if the seed depends on the new id.
4. No migration is needed for existing entries — `MoodEntry.emotionId` is just a string reference.

Removing or renaming an emotion id is a breaking change. Don't.

## Validation

The backend's `POST /entries` handler must reject any `emotionId` not present in this taxonomy with status 400 and `{ "error": { "code": "VALIDATION_ERROR", "message": "unknown emotionId: <id>" } }`.
