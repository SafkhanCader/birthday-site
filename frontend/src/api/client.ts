import type { Content, NewWish, VoiceNote, Wish, WishInvite } from "./types";

/**
 * One small API layer for the whole app.
 *
 * VITE_USE_MOCK=true  → everything is simulated in the browser (frontend-only work)
 * VITE_USE_MOCK=false → talks to FastAPI. Login sets an httpOnly cookie; every
 *                       later request sends it automatically (credentials: include).
 *
 * Components never know which mode is active — swapping to the real backend
 * is just changing the env flag.
 */

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

/** Turn a stored media path into a URL the browser can load. */
export function mediaUrl(path?: string): string | undefined {
  if (!path) return undefined;
  // Full URLs, local previews and site paths ("/voice/…" in public/) are used as-is
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
  // Everything else lives in backend/media, e.g. "album/01.webp"
  return `/api/media/${path}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ---------------------------- mock mode ---------------------------- */

const MOCK_SESSION_KEY = "bd-mock-session";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readSession(): boolean {
  try {
    return sessionStorage.getItem(MOCK_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSession(on: boolean) {
  try {
    if (on) sessionStorage.setItem(MOCK_SESSION_KEY, "1");
    else sessionStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    /* storage unavailable — session lasts until reload */
  }
}

let mockLoggedIn = readSession();

// Guest wishes in preview mode are kept in this browser only
const MOCK_WISHES_KEY = "bd-mock-guest-wishes";
const mockGuestCode = () => import.meta.env.VITE_MOCK_GUEST_CODE || "family2026";
const mockVoiceCode = () => import.meta.env.VITE_MOCK_VOICE_CODE || "1310";

function readGuestWishes(): Wish[] {
  try {
    return JSON.parse(localStorage.getItem(MOCK_WISHES_KEY) ?? "[]") as Wish[];
  } catch {
    return [];
  }
}

const mockApi = {
  async me() {
    await wait(150);
    return mockLoggedIn;
  },

  async login(password: string) {
    await wait(700);
    const expected = import.meta.env.VITE_MOCK_PASSWORD || "love";
    if (password.trim().toLowerCase() !== expected.toLowerCase()) {
      throw new ApiError(401, "That's not quite it, my love.");
    }
    mockLoggedIn = true;
    writeSession(true);
  },

  async logout() {
    mockLoggedIn = false;
    writeSession(false);
  },

  async content(): Promise<Content> {
    await wait(400);
    // Loaded on demand, so it never ships in the real (backend) build.
    const { mockContent } = await import("../mock/content");
    const sealed = import.meta.env.VITE_MOCK_LOCKED === "true";
    const { getVideo } = await import("../mock/videoStore");
    const guest = await Promise.all(
      readGuestWishes().map(async (w) => {
        if (!w.video?.startsWith("idb:")) return w;
        const blob = await getVideo(w.video.slice(4)).catch(() => undefined);
        return { ...w, video: blob ? URL.createObjectURL(blob) : undefined };
      }),
    );
    const content: Content = {
      ...mockContent,
      wishes: [...mockContent.wishes, ...guest],
      wishInvite: `/wish?code=${encodeURIComponent(mockGuestCode())}`,
    };
    // Same behaviour the backend will have: sealed sections are removed.
    return sealed ? { ...content, gift: null, london: null } : content;
  },

  async unlockVoice(code: string): Promise<VoiceNote> {
    await wait(700);
    if (code.trim().toLowerCase() !== mockVoiceCode().toLowerCase()) throw new ApiError(401, "Wrong code");
    const { mockVoice } = await import("../mock/content");
    return mockVoice;
  },

  async wishInvite(code: string): Promise<WishInvite> {
    await wait(300);
    if (code !== mockGuestCode()) throw new ApiError(404, "This invite link isn't valid.");
    const { mockContent } = await import("../mock/content");
    const { herName, fromName, birthday } = mockContent.site;
    return { herName, fromName, birthday };
  },

  async submitWish(wish: NewWish, video?: File | null, onProgress?: (pct: number) => void): Promise<void> {
    if (wish.code !== mockGuestCode()) throw new ApiError(403, "This invite link isn't valid.");
    // Simulated upload progress so the UI can be designed without a backend
    const steps = video ? 20 : 4;
    for (let i = 1; i <= steps; i++) {
      await wait(video ? 90 : 150);
      onProgress?.(Math.round((i / steps) * 100));
    }
    if (wish.website) return; // honeypot: pretend success, keep nothing
    const id = Math.random().toString(36).slice(2, 14);
    const saved: Wish = {
      id,
      name: wish.name.trim(),
      relation: wish.relation,
      message: wish.message.trim(),
      createdAt: new Date().toISOString(),
    };
    if (video) {
      // Preview only: keep the video in this browser's IndexedDB
      const { putVideo } = await import("../mock/videoStore");
      try {
        await putVideo(id, video);
        saved.video = `idb:${id}`;
      } catch {
        /* storage blocked — wish still saved without video */
      }
    }
    try {
      localStorage.setItem(MOCK_WISHES_KEY, JSON.stringify([...readGuestWishes(), saved]));
    } catch {
      /* storage full or blocked — preview only */
    }
  },
};

/* ---------------------------- real mode ---------------------------- */

const realApi = {
  async me() {
    try {
      await request<{ ok: boolean }>("/api/me");
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return false;
      throw e;
    }
  },

  async login(password: string) {
    await request<void>("/api/login", { method: "POST", body: JSON.stringify({ password }) });
  },

  async logout() {
    await request<void>("/api/logout", { method: "POST" });
  },

  async content() {
    return request<Content>("/api/content");
  },

  /** Checked on the server; the recording + subtitles are only sent back on success */
  async unlockVoice(code: string) {
    return request<VoiceNote>("/api/voice/unlock", { method: "POST", body: JSON.stringify({ code }) });
  },

  async wishInvite(code: string) {
    return request<WishInvite>(`/api/wishes/invite?code=${encodeURIComponent(code)}`);
  },

  /**
   * Sent as multipart/form-data (text fields + optional "video" file).
   * Uses XMLHttpRequest instead of fetch because fetch can't report upload progress.
   */
  submitWish(wish: NewWish, video?: File | null, onProgress?: (pct: number) => void) {
    const form = new FormData();
    for (const [k, v] of Object.entries(wish)) form.append(k, v);
    if (video) form.append("video", video, video.name);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/wishes");
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        let message = xhr.statusText;
        try {
          message = JSON.parse(xhr.responseText)?.detail ?? message;
        } catch {
          /* not JSON */
        }
        reject(new ApiError(xhr.status, message));
      };
      xhr.onerror = () => reject(new ApiError(0, "Network error"));
      xhr.send(form);
    });
  },
};

export const api = USE_MOCK ? mockApi : realApi;