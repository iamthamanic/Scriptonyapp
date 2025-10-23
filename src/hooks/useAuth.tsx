import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabaseConfig } from "../lib/env";
import { API_CONFIG } from "../lib/config";
import { getAuthClient } from "../lib/auth/getAuthClient";
import { getAuthToken } from "../lib/auth/getAuthToken";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "superadmin";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    checkSession();

    // Listen for auth state changes via adapter
    const unsubscribe = getAuthClient().onAuthStateChange(async (session) => {
      console.log("Auth state changed:", session ? "SIGNED_IN" : "SIGNED_OUT");
      
      if (session && session.raw) {
        // Extract user metadata from raw Supabase session
        const rawSession = session.raw as any;
        const metadata = rawSession?.user?.user_metadata || {};
        const email = rawSession?.user?.email || "";
        
        setUser({
          id: session.userId!,
          email,
          name: metadata?.name || "User",
          role: metadata?.role || "user",
          avatar: metadata?.avatar,
        });
      } else {
        setUser(null);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await getAuthClient().getSession();
      
      if (!session) {
        setUser(null);
        return;
      }

      if (session.raw) {
        // Extract user metadata from raw Supabase session
        const rawSession = session.raw as any;
        const metadata = rawSession?.user?.user_metadata || {};
        const email = rawSession?.user?.email || "";
        
        setUser({
          id: session.userId!,
          email,
          name: metadata?.name || "User",
          role: metadata?.role || "user",
          avatar: metadata?.avatar,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);

      // Call server to create user with email confirmation
      const response = await fetch(
        `${supabaseConfig.url}/functions/v1${API_CONFIG.SERVER_BASE_PATH}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseConfig.publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sign up failed");
      }

      const data = await response.json();

      // Now sign in
      await signIn(email, password);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const session = await getAuthClient().signInWithPassword(email, password);

      if (session && session.raw) {
        const rawSession = session.raw as any;
        const metadata = rawSession?.user?.user_metadata || {};
        const userEmail = rawSession?.user?.email || "";
        
        setUser({
          id: session.userId!,
          email: userEmail,
          name: metadata?.name || "User",
          role: metadata?.role || "user",
          avatar: metadata?.avatar,
        });
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);

      await getAuthClient().signInWithOAuth(provider, {
        redirectTo: window.location.origin,
      });

      // OAuth redirects to provider, so no need to update state here
      // The onAuthStateChange listener will handle the session after redirect
    } catch (error) {
      console.error(`${provider} OAuth sign in error:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await getAuthClient().signOut();
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in");

      await getAuthClient().updateUser({
        data: {
          name: updates.name || user.name,
          avatar: updates.avatar || user.avatar,
        },
      });

      setUser({ ...user, ...updates });
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await getAuthClient().resetPasswordForEmail(
        email,
        `${window.location.origin}/reset-password`
      );
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      await getAuthClient().updateUser({
        password: newPassword,
      });
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      return await getAuthToken();
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Legacy export removed - use getAuthClient() instead
