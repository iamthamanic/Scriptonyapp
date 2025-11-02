import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../../lib/env";

// Singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('[Supabase Client] Creating new singleton instance');
    supabaseInstance = createClient(
      supabaseConfig.url,
      supabaseConfig.publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Prevent multiple simultaneous auth requests
          flowType: 'pkce',
        },
      }
    );
    console.log('[Supabase Client] Singleton instance created');
  }
  return supabaseInstance;
};

// Export singleton instance
export const supabase = getSupabaseClient();

/**
 * Get the current user's access token for API calls
 * This is needed for server routes that check auth
 */
export const getUserAccessToken = async (): Promise<string | null> => {
  const client = getSupabaseClient();
  const { data: { session }, error } = await client.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session.access_token;
};
