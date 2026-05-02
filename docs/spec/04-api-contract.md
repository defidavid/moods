# 04 — API Contract

The complete REST contract. Both projects depend on this file; the backend implements it, the mobile client consumes it. Every payload below is canonical — copy literally.

## Base

- **Base URL (dev):** `http://localhost:3000`
- **Base URL (mobile, env-overridable):** `EXPO_PUBLIC_API_URL`, defaulting to `http://localhost:3000`
- **Content type:** `application/json` for every request and response body
- **Character encoding:** UTF-8

## Auth

- Every endpoint **except** `POST /login` requires header `Authorization: Bearer demo-token`.
- The literal token string is `demo-token`. Any other value yields `401 UNAUTHORIZED` with no handler running.
- Missing header on a protected endpoint yields the same `401`.

## Error envelope

All non-2xx responses share this exact shape (see `spec/01-data-contracts.md` for the TS type):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "intensity must be an integer between 1 and 5"
  }
}
```

Error codes are the closed set: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Endpoints

### POST /login

Mints a session for the hardcoded demo user. Body is ignored.

**Request**
```http
POST /login HTTP/1.1
Content-Type: application/json

{}
```

**Response — 200**
```json
{
  "token": "demo-token",
  "user": { "id": "u1", "displayName": "You" }
}
```

No 4xx paths. Backend always returns 200. Token value is the literal constant.

---

### GET /emotions

Returns the canonical taxonomy. Used by mobile on launch.

**Request**
```http
GET /emotions HTTP/1.1
Authorization: Bearer demo-token
```

**Response — 200**
```json
{
  "emotions": [
    { "id": "energetic", "label": "Energetic", "quadrant": "yellow" }
    /* 15 more — full list per spec/02-emotion-taxonomy.md */
  ]
}
```

**Possible errors:** 401.

---

### GET /entries

Returns all entries for user `u1`, sorted by `loggedAt` descending.

**Request**
```http
GET /entries HTTP/1.1
Authorization: Bearer demo-token
```

**Response — 200**
```json
{
  "entries": [
    {
      "id": "8f1c0d72-2b05-4a5e-9b3a-1f7d4f8e8c11",
      "userId": "u1",
      "emotionId": "energetic",
      "intensity": 4,
      "note": "Coffee + sunshine.",
      "loggedAt": "2026-05-02T18:14:00.000Z"
    }
  ]
}
```

When no entries exist: `{ "entries": [] }`.

**Possible errors:** 401.

---

### POST /entries

Creates a new entry. Server assigns `id`, `userId`, `loggedAt`.

**Request**
```http
POST /entries HTTP/1.1
Authorization: Bearer demo-token
Content-Type: application/json

{
  "emotionId": "anxious",
  "intensity": 3,
  "note": "Inbox spike."
}
```

`note` may be omitted, sent as `""`, or sent as `null`. Empty string is normalized to `null` server-side.

**Response — 201**
```json
{
  "entry": {
    "id": "<server-uuid>",
    "userId": "u1",
    "emotionId": "anxious",
    "intensity": 3,
    "note": "Inbox spike.",
    "loggedAt": "<server-iso8601>"
  }
}
```

**Possible errors:**
- `400 VALIDATION_ERROR` when:
  - `emotionId` missing or not in the taxonomy
  - `intensity` missing, not an integer, or not in 1..5
  - `note` is a string longer than 500 chars
- `401 UNAUTHORIZED` for missing/bad token

---

### DELETE /entries/:id

Hard-deletes an entry.

**Request**
```http
DELETE /entries/8f1c0d72-2b05-4a5e-9b3a-1f7d4f8e8c11 HTTP/1.1
Authorization: Bearer demo-token
```

**Response — 200**
```json
{ "ok": true }
```

**Possible errors:** 401, `404 NOT_FOUND` if the id does not exist.

## Status code matrix

| Endpoint            | 200 | 201 | 400 | 401 | 404 |
|---------------------|:---:|:---:|:---:|:---:|:---:|
| `POST /login`       |  ✓  |     |     |     |     |
| `GET /emotions`     |  ✓  |     |     |  ✓  |     |
| `GET /entries`      |  ✓  |     |     |  ✓  |     |
| `POST /entries`     |     |  ✓  |  ✓  |  ✓  |     |
| `DELETE /entries/:id`|  ✓  |     |     |  ✓  |  ✓  |

## CORS

In dev, the server allows origin `*`. In v0 there is no prod profile.

## Versioning

No `/v1` prefix. The spec is the version. When the contract changes, both projects update at the same commit.
