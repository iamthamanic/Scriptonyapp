/**
 * Environment Variable Validation & Type-Safe Access
 * 
 * This module provides centralized, type-safe access to all environment variables.
 * All environment access should go through this module to ensure runtime validation.
 */

import { projectId as rawProjectId, publicAnonKey as rawPublicAnonKey } from '../utils/supabase/info';

// =============================================================================
// Types
// =============================================================================

export interface SupabaseConfig {
  projectId: string;
  publicAnonKey: string;
  url: string;
}

export interface AppConfig {
  isDevelopment: boolean;
  isProduction: boolean;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates that a value is a non-empty string
 */
function validateString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(
      `Environment validation failed: ${name} must be a non-empty string. ` +
      `Got: ${typeof value === 'string' ? '(empty string)' : typeof value}`
    );
  }
  return value.trim();
}

/**
 * Validates a Supabase Project ID format
 */
function validateProjectId(value: string): string {
  // Supabase project IDs are lowercase alphanumeric strings
  if (!/^[a-z0-9]{20}$/.test(value)) {
    console.warn(
      `⚠️ Project ID doesn't match expected format (20 lowercase alphanumeric chars). ` +
      `This might still work, but please verify.`
    );
  }
  return value;
}

/**
 * Validates a Supabase Anon Key format (JWT)
 */
function validateAnonKey(value: string): string {
  // JWT tokens have 3 parts separated by dots
  const parts = value.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `Environment validation failed: publicAnonKey must be a valid JWT token. ` +
      `Expected 3 parts separated by dots, got ${parts.length}.`
    );
  }
  return value;
}

// =============================================================================
// Supabase Configuration
// =============================================================================

let _supabaseConfig: SupabaseConfig | null = null;

/**
 * Returns validated Supabase configuration.
 * Validates on first access and caches the result.
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (_supabaseConfig) {
    return _supabaseConfig;
  }

  try {
    const projectId = validateString(rawProjectId, 'SUPABASE_PROJECT_ID');
    validateProjectId(projectId);

    const publicAnonKey = validateString(rawPublicAnonKey, 'SUPABASE_ANON_KEY');
    validateAnonKey(publicAnonKey);

    const url = `https://${projectId}.supabase.co`;

    _supabaseConfig = {
      projectId,
      publicAnonKey,
      url,
    };

    return _supabaseConfig;
  } catch (error) {
    console.error('❌ Supabase Configuration Validation Failed:', error);
    throw error;
  }
}

// =============================================================================
// App Configuration
// =============================================================================

let _appConfig: AppConfig | null = null;

/**
 * Returns validated app configuration.
 * Determines environment based on available signals.
 */
export function getAppConfig(): AppConfig {
  if (_appConfig) {
    return _appConfig;
  }

  // In browser environments, we can check for development indicators
  const isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname.startsWith('127.0.0.1'));

  _appConfig = {
    isDevelopment,
    isProduction: !isDevelopment,
  };

  return _appConfig;
}

// =============================================================================
// Convenience Exports
// =============================================================================

/**
 * Validated Supabase configuration.
 * Use this instead of importing from utils/supabase/info directly.
 */
export const supabaseConfig = getSupabaseConfig();

/**
 * Validated app configuration.
 */
export const appConfig = getAppConfig();

// =============================================================================
// Debug Logging (Development Only)
// =============================================================================

if (appConfig.isDevelopment) {
  console.log('✅ Environment Validation Complete:', {
    supabase: {
      projectId: supabaseConfig.projectId,
      url: supabaseConfig.url,
      hasAnonKey: supabaseConfig.publicAnonKey.length > 0,
    },
    app: {
      environment: appConfig.isDevelopment ? 'development' : 'production',
    },
  });
}
