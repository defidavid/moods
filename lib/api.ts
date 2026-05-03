import type { Emotion, ErrorCode, LoginResponse, MoodEntry } from "./types";
import { storeApi } from "./store";

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  "http://localhost:3000";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface CreateEntryInput {
  emotionId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

type Method = "GET" | "POST" | "DELETE";

interface RequestOptions {
  method: Method;
  path: string;
  body?: unknown;
  auth: boolean;
}

async function request<T>(opts: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.auth) {
    const token = storeApi.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "INTERNAL_ERROR", "Network request failed");
  }

  if (res.status === 401) {
    await storeApi.clearAuth();
    throw new ApiError(401, "UNAUTHORIZED", "Session expired");
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(
        res.status,
        "INTERNAL_ERROR",
        "Invalid JSON from server",
      );
    }
  }

  if (!res.ok) {
    const env = payload as {
      error?: { code?: ErrorCode; message?: string };
    } | null;
    const code = env?.error?.code ?? "INTERNAL_ERROR";
    const message = env?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, code, message);
  }

  return payload as T;
}

export const api = {
  login: async (): Promise<LoginResponse> => {
    return request<LoginResponse>({
      method: "POST",
      path: "/login",
      body: {},
      auth: false,
    });
  },

  getEmotions: async (): Promise<Emotion[]> => {
    const res = await request<{ emotions: Emotion[] }>({
      method: "GET",
      path: "/emotions",
      auth: true,
    });
    return res.emotions;
  },

  getEntries: async (): Promise<MoodEntry[]> => {
    const res = await request<{ entries: MoodEntry[] }>({
      method: "GET",
      path: "/entries",
      auth: true,
    });
    return res.entries;
  },

  createEntry: async (input: CreateEntryInput): Promise<MoodEntry> => {
    const body = {
      emotionId: input.emotionId,
      intensity: input.intensity,
      note: input.note,
    };
    const res = await request<{ entry: MoodEntry }>({
      method: "POST",
      path: "/entries",
      body,
      auth: true,
    });
    return res.entry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await request<{ ok: true }>({
      method: "DELETE",
      path: `/entries/${encodeURIComponent(id)}`,
      auth: true,
    });
  },
};
