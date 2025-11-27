import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  // Use NEXT_PUBLIC_SUPABASE_URL first, fallback to SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

  // Use SERVICE_ROLE_KEY if available (for server-side operations), otherwise use ANON_KEY
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseKey) {
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase config missing:", {
      url: supabaseUrl ? "set" : "missing",
      key: supabaseKey ? "set" : "missing",
    });
    throw new Error("Supabase URL or key is not set");
  }

  const client = createClient(supabaseUrl, supabaseKey);

  return client;
}
