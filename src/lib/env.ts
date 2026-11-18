import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_API_URL: z.url(),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(
    `Invalid web environment (see apps/web/.env.example): ${parsed.error.issues
      .map((i) => i.path.join('.'))
      .join(', ')}`,
  );
}

/** Public, build-time configuration. Never put secrets in VITE_* variables. */
export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
  apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ''),
};
