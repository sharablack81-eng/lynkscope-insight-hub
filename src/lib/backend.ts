import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Public configuration. We prefer Vite env vars, but fall back to the known
// Lovable Cloud project values to prevent blank screens when env injection fails.
const FALLBACK_BACKEND_URL = "https://dcjhxvoyheyjgocohihp.supabase.co";
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjamh4dm95aGV5amdvY29oaWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDI2ODYsImV4cCI6MjA3NTk3ODY4Nn0.V-HSEGi5beboP5J4-XekQcViQkXGIJmPFjlT82t98fw";

export const BACKEND_URL: string =
  import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_BACKEND_URL;

export const BACKEND_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? FALLBACK_PUBLISHABLE_KEY;

// Alias used in some fetch calls / redirect flow.
export const BACKEND_ANON_KEY = BACKEND_PUBLISHABLE_KEY;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "VITE_SUPABASE_URL missing at runtime; using fallback backend URL."
  );
}

if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "VITE_SUPABASE_PUBLISHABLE_KEY missing at runtime; using fallback publishable key."
  );
}

export const supabase = createClient<Database>(
  BACKEND_URL,
  BACKEND_PUBLISHABLE_KEY,
  {
    auth: {
      // Do not persist sessions between browser sessions — require manual sign-in
      persistSession: false,
      // Do not auto-refresh tokens silently
      autoRefreshToken: false,
    },
  }
);
