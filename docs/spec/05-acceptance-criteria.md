# 05 — Acceptance Criteria

Every AC for the v0 product. Each is testable. Each is tagged by area. ACs are referenced by ID throughout the implementation files; do not renumber.

## Format

`AC-XX: GIVEN <precondition>, WHEN <action>, THEN <observable outcome>.`

One assertion per AC. Compound criteria are split into multiple ACs.

---

## Mobile — Auth & Shell

- **AC-01:** GIVEN no token in AsyncStorage, WHEN the app launches, THEN the `/login` route renders.
- **AC-02:** GIVEN `/login`, WHEN the user taps Continue and `POST /login` returns 200, THEN the token is stored under AsyncStorage key `moods.token` and the user is navigated to `/(tabs)/log`.
- **AC-03:** GIVEN any tab screen is visible, THEN the bottom tab bar shows three labeled tabs ("Log", "Today", "Insights"), each tappable.
- **AC-04:** GIVEN any API call returns 401, THEN the token is cleared from AsyncStorage and the user is redirected to `/login`.

## Mobile — Log flow

- **AC-05:** GIVEN `/(tabs)/log` and no quadrant is selected, THEN four colored quadrant tiles fill the screen in a 2×2 grid (yellow top-left, red top-right, green bottom-left, blue bottom-right) and each tile shows its display label centered.
- **AC-06:** GIVEN the quadrant grid, WHEN the user taps a tile, THEN that tile expands with a 280ms animation to fill the screen and the other three fade out.
- **AC-07:** GIVEN an expanded quadrant, THEN chips for every emotion whose `quadrant` matches are rendered in a wrap layout, each chip showing the emotion `label`.
- **AC-08:** GIVEN the expanded quadrant, WHEN the user taps the back affordance, THEN the quadrant grid is restored with the reverse animation.
- **AC-09:** GIVEN the expanded quadrant, WHEN the user taps an emotion chip, THEN an intensity step appears showing the emotion label as the title, a 1-to-5 segmented slider, and an optional 500-char note input below.
- **AC-10:** GIVEN the intensity step, WHEN the user changes the intensity value, THEN haptic feedback (`Haptics.impactAsync(Light)`) fires.
- **AC-11:** GIVEN the intensity step, WHEN the user taps Submit and `POST /entries` returns 201, THEN the view resets to the quadrant grid and the new entry is reflected in the Today tab without a manual refresh.
- **AC-12:** GIVEN the intensity step, WHEN the user leaves the note input empty, THEN the request body sends `"note": null` (not `""`).
- **AC-13:** GIVEN any tier 2 (chips) or tier 3 (intensity) step, WHEN the user taps back, THEN no `POST /entries` is issued.
- **AC-14:** GIVEN `/(tabs)/log` on an iPhone 14 viewport, THEN the quadrant grid fits one screen with no scroll.

## Mobile — Today

- **AC-15:** GIVEN entries exist for today (local time), WHEN the user opens `/(tabs)/today`, THEN entries render newest-first as cards showing emotion label, 5 intensity dots (filled to value), local time formatted `h:mm A`, and a one-line note preview if a note exists.
- **AC-16:** GIVEN no entries exist for today, WHEN the user opens `/(tabs)/today`, THEN an empty state reading "Nothing logged yet today." is shown with subdued typography.
- **AC-17:** GIVEN the Today list, WHEN the user taps a card, THEN `/entry/[id]` opens with that entry's id in the route.

## Mobile — Insights

- **AC-18:** GIVEN `/(tabs)/insights`, THEN a stacked bar chart renders with one bar per day for the past 7 days (oldest left, today right). Each bar segment is colored by quadrant; segment height is the count of entries in that quadrant on that day.
- **AC-19:** GIVEN no entries exist in the past 7 days, WHEN `/(tabs)/insights` opens, THEN an empty state reading "Log a mood to see your week." is shown in place of the chart.
- **AC-20:** GIVEN the Insights chart, THEN a legend below the chart shows each quadrant color paired with its display label.

## Mobile — Entry detail

- **AC-21:** GIVEN `/entry/[id]` for an existing entry, THEN the header shows the emotion label and the screen displays: a colored accent matching the quadrant, intensity (5 dots), full note (or "No note" in muted type), and a relative time ("3 hours ago") plus an absolute timestamp ("May 2, 2026 · 6:14 PM").
- **AC-22:** GIVEN entry detail, WHEN the user taps Delete and confirms via a native Alert, THEN `DELETE /entries/:id` is called and on 200 the user returns to `/(tabs)/today` with the entry removed from the list.
- **AC-23:** GIVEN entry detail, WHEN the user cancels the delete Alert, THEN no request is issued and the screen is unchanged.

## Backend — Bootstrap & Persistence

- **AC-24:** GIVEN the server cold starts and `db.json` exists, THEN the in-memory store is hydrated from `db.json` before the HTTP listener accepts requests.
- **AC-25:** GIVEN the server cold starts and `db.json` is missing, THEN the seed in `backend/src/seed.ts` runs and `db.json` is written before listening.
- **AC-26:** GIVEN a successful `POST /entries`, WHEN the process is killed and restarted, THEN `GET /entries` returns the previously created entry.
- **AC-27:** GIVEN any mutation, WHEN `db.json` is being written, THEN the write happens via `writeFileSync(tmp); renameSync(tmp, db.json)` so observers never see a partial file.

## Backend — Validation & Errors

- **AC-28:** GIVEN `POST /entries` with `intensity: 0`, THEN respond `400` with `error.code: "VALIDATION_ERROR"` and a message naming the field.
- **AC-29:** GIVEN `POST /entries` with `emotionId: "nonsense"`, THEN respond `400` with `error.code: "VALIDATION_ERROR"` and message `unknown emotionId: nonsense`.
- **AC-30:** GIVEN `POST /entries` with `note` longer than 500 chars, THEN respond `400 VALIDATION_ERROR`.
- **AC-31:** GIVEN any protected endpoint with no `Authorization` header, THEN respond `401 UNAUTHORIZED` and the route handler does not execute.
- **AC-32:** GIVEN any protected endpoint with `Authorization: Bearer wrong`, THEN respond `401 UNAUTHORIZED`.
- **AC-33:** GIVEN `DELETE /entries/:id` with a UUID not present in the store, THEN respond `404 NOT_FOUND`.
- **AC-34:** GIVEN any unhandled error in a handler, THEN respond `500 INTERNAL_ERROR` with the standard envelope and log the stack at `error` level.

## Backend — Behavior

- **AC-35:** GIVEN `POST /entries` with `note: ""`, THEN the persisted entry has `note: null`.
- **AC-36:** GIVEN any client-supplied `id`, `userId`, or `loggedAt` in the `POST /entries` body, THEN those fields are ignored and the server-assigned values are used.
- **AC-37:** GIVEN multiple entries in the store, WHEN `GET /entries` is called, THEN the response array is sorted by `loggedAt` descending.

## Integration

- **AC-38:** GIVEN both processes running, WHEN the user completes the log flow on mobile, THEN the new entry appears in the Today tab in the same session without a manual reload.
- **AC-39:** GIVEN the backend is killed mid-session, WHEN the user attempts to log a mood, THEN the app surfaces a non-blocking error toast reading "Couldn't save. Try again." and remains on the intensity step.
- **AC-40:** GIVEN the backend was unreachable on launch, THEN the bundled emotion list is used and the app remains functional for browsing existing local-cached state (read-only paths).
