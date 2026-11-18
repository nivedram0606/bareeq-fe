import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { meSchema } from '@bareeq/shared';
import type { ProfileDto } from '@bareeq/shared';

import { apiFetch, configureApiAuth, isApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  session: Session | null;
  /** The signed-in user's profile (id, role, org) — needed synchronously for route guards. */
  profile: ProfileDto | null;
  status: AuthStatus;
  /** i18n key explaining why the user was signed out (e.g. deactivated account). */
  error: string | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads /me (e.g. after the profile or organization changed). */
  refreshProfile: () => Promise<void>;
}

export const ORG_QUERY_KEY = ['org'] as const;

let initialized = false;

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

export const useAuthStore = create<AuthState>()((set, get) => {
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
          : err.status === 403 || err.status === 401
            ? 'auth.errors.profile'
            : 'auth.errors.generic';
      await supabase.auth.signOut({ scope: 'local' });
      set({ session: null, profile: null, status: 'unauthenticated', error });
      throw new Error(error, { cause: err });
    }
  }

  function clear(): void {
    queryClient.clear();
    set({ session: null, profile: null, status: 'unauthenticated' });
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
        getToken: () => get().session?.access_token,
        onUnauthorized: () => void get().signOut(),
      });

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          if (get().session) clear();
          return;
        }
        set({ session });
        // Profile loads for new sessions (invite/recovery links). Deferred: supabase-js must not
        // be re-entered from inside this callback.
        if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && !get().profile) {
          setTimeout(() => void loadProfile().catch(() => undefined), 0);
        }
      });

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        set({ status: 'unauthenticated' });
        return;
      }
      set({ session: data.session });
      await loadProfile().catch(() => undefined);
    },

    async signIn(email, password) {
      set({ error: null });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        throw new Error(
          error?.code === 'invalid_credentials' || error?.status === 400
            ? 'auth.errors.invalid_credentials'
            : 'auth.errors.generic',
          { cause: error },
        );
      }
      set({ session: data.session });
      await loadProfile();
    },

    async signOut() {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      clear();
    },

    async refreshProfile() {
      if (get().session) await loadProfile();
    },
  };
});
