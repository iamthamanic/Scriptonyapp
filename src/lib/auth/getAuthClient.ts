/**
 * Auth Client Factory
 * 
 * Returns a singleton instance of the configured auth client.
 * Currently uses SupabaseAuthAdapter, but can be switched to other providers.
 */

import { SupabaseAuthAdapter } from "./SupabaseAuthAdapter";
import type { AuthClient } from "./AuthClient";

let _client: AuthClient | null = null;

/**
 * Get the auth client singleton
 */
export function getAuthClient(): AuthClient {
  if (_client) return _client;
  
  // In the future, this could switch based on environment variable:
  // const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supabase';
  // switch (provider) {
  //   case 'auth0': return new Auth0Adapter();
  //   case 'clerk': return new ClerkAdapter();
  //   default: return new SupabaseAuthAdapter();
  // }
  
  _client = new SupabaseAuthAdapter();
  return _client;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetAuthClient(): void {
  _client = null;
}
