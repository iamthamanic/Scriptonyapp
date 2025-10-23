/**
 * Supabase Auth Adapter
 * 
 * Implements AuthClient interface using Supabase GoTrue.
 * This is the ONLY place in the frontend that should use supabase.auth.*
 */

import { supabase } from "../../utils/supabase/client";
import type { AuthClient, AuthSession } from "./AuthClient";

export class SupabaseAuthAdapter implements AuthClient {
  /**
   * Maps Supabase session to AuthSession
   */
  private map(session: any): AuthSession | null {
    if (!session) return null;
    
    const token = session?.access_token ?? session?.accessToken ?? null;
    const uid = session?.user?.id ?? null;
    
    return token ? { accessToken: token, userId: uid, raw: session } : null;
  }

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[SupabaseAuthAdapter] getSession error:', error);
      return null;
    }
    return this.map(data.session);
  }

  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      throw error;
    }
    
    const session = this.map(data.session);
    if (!session) {
      throw new Error('Sign in succeeded but no session returned');
    }
    
    return session;
  }

  async signInWithOAuth(provider: string, options?: Record<string, any>): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: provider as any, 
      options 
    });
    
    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async updateUser(patch: Record<string, any>): Promise<void> {
    const { error } = await supabase.auth.updateUser(patch);
    if (error) {
      throw error;
    }
  }

  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { 
      redirectTo 
    });
    
    if (error) {
      throw error;
    }
  }

  onAuthStateChange(cb: (session: AuthSession | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        cb(this.map(session));
      }
    );
    
    return () => subscription.unsubscribe();
  }
}
