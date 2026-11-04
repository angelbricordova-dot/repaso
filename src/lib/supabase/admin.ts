import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con la service role key: salta RLS. Úsalo solo en el servidor y solo
 * después de comprobar quién hace la petición.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
