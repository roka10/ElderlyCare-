import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (process.env.NODE_ENV !== "production") {
  if (!supabaseUrl || !supabaseAnonKey) {
    // We avoid throwing in production so the app can still render a friendly state
    // even if env vars are missing in some deployment environment.
    // eslint-disable-next-line no-console
    console.warn(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local.",
    )
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

