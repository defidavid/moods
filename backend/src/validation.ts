import { z } from "zod";

/** The 16 canonical emotion ids. Mirrors spec/02-emotion-taxonomy.md. */
export const EMOTION_IDS = [
  "energetic", "excited", "joyful", "proud",
  "calm", "content", "grateful", "relaxed",
  "angry", "anxious", "frustrated", "stressed",
  "sad", "tired", "lonely", "bored",
] as const;

export type EmotionId = (typeof EMOTION_IDS)[number];

/** POST /login — body is ignored but must parse. */
export const LoginBody = z.object({}).passthrough();
export type LoginBodyT = z.infer<typeof LoginBody>;

/**
 * POST /entries — request body.
 * - emotionId: must be in the canonical taxonomy
 * - intensity: integer 1..5
 * - note: optional; "", null, or omitted are all accepted; route normalizes to null
 */
export const EntryCreateBody = z.object({
  emotionId: z.enum(EMOTION_IDS, {
    errorMap: (_issue, ctx) => ({
      message: `unknown emotionId: ${String(ctx.data)}`,
    }),
  }),
  intensity: z
    .number({ invalid_type_error: "intensity must be an integer between 1 and 5" })
    .int("intensity must be an integer between 1 and 5")
    .min(1, "intensity must be an integer between 1 and 5")
    .max(5, "intensity must be an integer between 1 and 5"),
  note: z
    .union([z.string().max(500, "note must be 500 characters or fewer"), z.null()])
    .optional(),
});
export type EntryCreateBodyT = z.infer<typeof EntryCreateBody>;

/** DELETE /entries/:id — path params. */
export const EntryParams = z.object({
  id: z.string().uuid("id must be a UUID"),
});
export type EntryParamsT = z.infer<typeof EntryParams>;
