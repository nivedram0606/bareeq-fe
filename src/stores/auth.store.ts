import { create } from 'zustand';

import { loginResponseSchema, meSchema } from '@bareeq/shared';
import type { LoginResponse, ProfileDto } from '@bareeq/shared';

import { apiFetch, configureApiAuth, isApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** The API session token and when it expires (ISO). */
export type Session = LoginResponse;

interface AuthState {
  session: Session | null;
  /** The signed-in user's profile (id, role, org) — needed synchronously for route guards. */
  profile: ProfileDto | null;
  status: AuthStatus;
  /** i18n key explaining why the user was signed out (e.g. deactivated account). */
  error: string | null;
  init: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Changes the signed-in user's password; other devices are signed out. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Re-reads /me (e.g. after the profile or organization changed). */
  refreshProfile: () => Promise<void>;
}

export const ORG_QUERY_KEY = ['org'] as const;

const STORAGE_KEY = 'bareeq.session';

let initialized = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

/* ------------------------------------------------- persisted session token */

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = loginResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || Date.parse(parsed.data.expiresAt) <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function storeSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked storage: the session simply won't survive a reload.
  }
}

/* --------------------------------------------------------------- helpers */

const RETRY_DELAYS_MS = [400, 1200, 3000];
const isTransient = (err: unknown): boolean =>
  isApiError(err) && (err.status === 0 || err.status === 429 || err.status >= 500);

/** GET /me, retrying transient failures (network blips, API restarts) before giving up. */
async function fetchMeWithRetry() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await apiFetch('/me', { schema: meSchema });
    } catch (err) {
      const delay = RETRY_DELAYS_MS[attempt];
      if (!isTransient(err) || delay === undefined) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/** 401 because this account signed in on another device (one session per user) or its password changed. */
const signedInElsewhere = (err: unknown): boolean =>
  isApiError(err) && err.status === 401 && /signed in again|password changed/i.test(err.message);

function signInError(err: unknown): string {
  if (!isApiError(err)) return 'auth.errors.generic';
  if (err.status === 401 || err.status === 400) return 'auth.errors.invalid_credentials';
  if (err.status === 403 && /deactivated/i.test(err.message)) return 'auth.errors.inactive';
  if (err.status === 429) return 'auth.errors.too_many_attempts';
  return 'auth.errors.generic';
}

export const useAuthStore = create<AuthState>()((set, get) => {
  /** Remembers the session and signs out automatically when it expires. */
  function startSession(session: Session): void {
    storeSession(session);
    set({ session });
    clearTimeout(expiryTimer);
    const ms = Date.parse(session.expiresAt) - Date.now();
    // setTimeout overflows above ~24.8 days; longer sessions are checked again on reload.
    if (ms < 2 ** 31 - 1) {
      expiryTimer = setTimeout(() => {
        set({ error: 'auth.errors.expired' });
        clear();
      }, ms);
    }
  }

  function clear(): void {
    clearTimeout(expiryTimer);
    storeSession(null);
    queryClient.clear();
    set({ session: null, profile: null, status: 'unauthenticated' });
  }

  /** Loads /me; seeds the org query cache so the shell renders without a second request. */
  async function loadProfile(): Promise<void> {
    try {
      const me = await fetchMeWithRetry();
      queryClient.setQueryData(ORG_QUERY_KEY, me.org);
      set({ profile: me.profile, status: 'authenticated', error: null });
    } catch (err) {
      const error = !isApiError(err)
        ? 'auth.errors.generic'
        : err.status === 403 && /deactivated/i.test(err.message)
          ? 'auth.errors.inactive'
          : err.status === 401
            ? signedInElsewhere(err)
              ? 'auth.errors.signedOutElsewhere'
              : 'auth.errors.expired'
            : err.status === 403
              ? 'auth.errors.profile'
              : 'auth.errors.generic';
      clear();
      set({ error });
      throw new Error(error, { cause: err });
    }
  }

  return {
    session: null,
    profile: null,
    status: 'loading',
    error: null,

    async init() {
      if (initialized) return;
      initialized = true;

      configureApiAuth({
        getToken: () => get().session?.token,
        onUnauthorized: (err) => {
          if (!get().session) return;
          clear();
          if (signedInElsewhere(err)) set({ error: 'auth.errors.signedOutElsewhere' });
        },
      });

      // Signing out (or in as someone else) in another tab applies here too.
      window.addEventListener('storage', (e) => {
        if (e.key !== STORAGE_KEY) return;
        const next = readStoredSession();
        if (!next) {
          if (get().session) clear();
        } else if (next.token !== get().session?.token) {
          startSession(next);
          void loadProfile().catch(() => undefined);
        }
      });

      const stored = readStoredSession();
      if (!stored) {
        storeSession(null);
        set({ status: 'unauthenticated' });
        return;
      }
      startSession(stored);
      await loadProfile().catch(() => undefined);
    },

    async signIn(username, password) {
      set({ error: null });
      let session: Session;
      try {
        session = await apiFetch('/auth/login', {
          method: 'POST',
          body: { username, password },
          schema: loginResponseSchema,
        });
      } catch (err) {
        throw new Error(signInError(err), { cause: err });
      }
      startSession(session);
      await loadProfile();
    },

    async signOut() {
      clear();
      set({ error: null });
    },

    async changePassword(currentPassword, newPassword) {
      const session = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        schema: loginResponseSchema,
      });
      startSession(session);
    },

    async refreshProfile() {
      if (get().session) await loadProfile();
    },
  };
});
