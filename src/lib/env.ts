import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
});

const parsed = envSchema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error(
    `Invalid web environment (see .env.example): ${parsed.error.issues
      .map((i) => i.path.join('.'))
      .join(', ')}`,
  );
}

/** Public, build-time configuration. Never put secrets in VITE_* variables. */
export const env = {
  apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ''),
};
