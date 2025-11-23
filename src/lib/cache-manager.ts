/**
 * 🚀 SCRIPTONY CACHE MANAGER
 * 
 * Aggressive caching with localStorage + memory
 * Stale-While-Revalidate pattern for instant loads
 */

import { perfMonitor, type SLACategory } from './performance-monitor';

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheConfig {
  ttl?: number;           // Time to live in ms (default: 5 minutes)
  staleTime?: number;     // Time before considering stale (default: 30 seconds)
  version?: string;       // Cache version for invalidation
  slaCategory?: SLACategory; // Performance tracking category
}

const DEFAULT_CONFIG: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000,      // 5 minutes
  staleTime: 30 * 1000,    // 30 seconds
  version: '1.0',
  slaCategory: 'CACHE_READ',
};

// =============================================================================
// CACHE MANAGER
// =============================================================================

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private pendingRevalidations = new Map<string, Promise<any>>();
  
  /**
   * Get from cache (memory first, then localStorage)
   * Returns { data, isStale } - data might be stale but valid
   */
  get<T>(
    key: string,
    config: CacheConfig = {}
  ): { data: T | null; isStale: boolean; fromMemory: boolean } {
    const perfId = `cache-get-${key}`;
    perfMonitor.start(perfId);

    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();

    // 1. Try memory cache first (fastest!)
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      const age = now - memEntry.timestamp;
      const isExpired = age > fullConfig.ttl;
      const isStale = age > fullConfig.staleTime;

      if (!isExpired && memEntry.version === fullConfig.version) {
        perfMonitor.end(perfId, fullConfig.slaCategory, `Cache GET (memory): ${key}`, {
          age,
          isStale,
        });
        return { data: memEntry.data, isStale, fromMemory: true };
      }

      // Expired or wrong version - remove
      if (isExpired || memEntry.version !== fullConfig.version) {
        this.memoryCache.delete(key);
      }
    }

    // 2. Try localStorage (slower but persistent)
    try {
      const stored = localStorage.getItem(this.getStorageKey(key));
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        const age = now - entry.timestamp;
        const isExpired = age > fullConfig.ttl;
        const isStale = age > fullConfig.staleTime;

        if (!isExpired && entry.version === fullConfig.version) {
          // Promote to memory cache
          this.memoryCache.set(key, entry);

          perfMonitor.end(perfId, fullConfig.slaCategory, `Cache GET (localStorage): ${key}`, {
            age,
            isStale,
          });
          return { data: entry.data, isStale, fromMemory: false };
        }

        // Expired or wrong version - remove
        if (isExpired || entry.version !== fullConfig.version) {
          localStorage.removeItem(this.getStorageKey(key));
        }
      }
    } catch (error) {
      console.warn('[Cache] Error reading from localStorage:', error);
    }

    perfMonitor.end(perfId, fullConfig.slaCategory, `Cache GET (miss): ${key}`);
    return { data: null, isStale: false, fromMemory: false };
  }

  /**
   * Set cache (both memory and localStorage)
   */
  set<T>(
    key: string,
    data: T,
    config: CacheConfig = {}
  ): void {
    const perfId = `cache-set-${key}`;
    perfMonitor.start(perfId);

    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: fullConfig.version,
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);

    // Set in localStorage (async, non-blocking)
    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('[Cache] Error writing to localStorage:', error);
      // If quota exceeded, clear old entries
      this.clearOldEntries();
    }

    perfMonitor.end(perfId, 'CACHE_WRITE', `Cache SET: ${key}`, {
      size: JSON.stringify(data).length,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn('[Cache] Error removing from localStorage:', error);
    }
    console.log(`[Cache] Invalidated: ${key}`);
  }

  /**
   * Invalidate by prefix (e.g., 'timeline:project-123')
   */
  invalidatePrefix(prefix: string): void {
    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const storagePrefix = this.getStorageKey(prefix);
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(storagePrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[Cache] Invalidated ${keysToRemove.length} entries with prefix: ${prefix}`);
    } catch (error) {
      console.warn('[Cache] Error invalidating by prefix:', error);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.pendingRevalidations.clear();
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('scriptony:cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[Cache] Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.warn('[Cache] Error clearing localStorage:', error);
    }
  }

  /**
   * Stale-While-Revalidate pattern
   * Returns cached data immediately (even if stale), revalidates in background
   */
  async getWithRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const cached = this.get<T>(key, config);

    // If we have fresh data, return it
    if (cached.data && !cached.isStale) {
      return cached.data;
    }

    // If we have stale data, return it but revalidate in background
    if (cached.data && cached.isStale) {
      // Don't start duplicate revalidations
      if (!this.pendingRevalidations.has(key)) {
        const revalidation = this.revalidate(key, fetcher, config);
        this.pendingRevalidations.set(key, revalidation);
        revalidation.finally(() => this.pendingRevalidations.delete(key));
      }
      
      console.log(`[Cache] Returning stale data for ${key}, revalidating in background...`);
      return cached.data;
    }

    // No cached data, fetch fresh
    const data = await perfMonitor.measure(
      `cache-fetch-${key}`,
      fullConfig.slaCategory || 'API_STANDARD',
      `Cache FETCH: ${key}`,
      fetcher
    );

    this.set(key, data, config);
    return data;
  }

  /**
   * Revalidate in background
   */
  private async revalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, config);
      console.log(`[Cache] ✅ Revalidated: ${key}`);
    } catch (error) {
      console.error(`[Cache] ❌ Revalidation failed for ${key}:`, error);
    }
  }

  /**
   * Prefetch data (low priority, don't block)
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<void> {
    // Skip if already cached and fresh
    const cached = this.get<T>(key, config);
    if (cached.data && !cached.isStale) {
      console.log(`[Cache] Prefetch skipped (already cached): ${key}`);
      return;
    }

    // Fetch with low priority
    try {
      const data = await perfMonitor.measure(
        `cache-prefetch-${key}`,
        'PREFETCH',
        `Cache PREFETCH: ${key}`,
        fetcher
      );
      this.set(key, data, config);
    } catch (error) {
      console.warn(`[Cache] Prefetch failed for ${key}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    localStorageEntries: number;
    totalSize: number;
  } {
    let localStorageEntries = 0;
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('scriptony:cache:')) {
          localStorageEntries++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
    } catch (error) {
      console.warn('[Cache] Error getting stats:', error);
    }

    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries,
      totalSize,
    };
  }

  /**
   * Clear old entries when quota exceeded
   */
  private clearOldEntries(): void {
    try {
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('scriptony:cache:')) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const entry: CacheEntry<any> = JSON.parse(value);
              entries.push({ key, timestamp: entry.timestamp });
            } catch {
              // Invalid entry, remove it
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25%
      const removeCount = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(entries[i].key);
      }

      console.log(`[Cache] Cleared ${removeCount} old entries due to quota`);
    } catch (error) {
      console.warn('[Cache] Error clearing old entries:', error);
    }
  }

  /**
   * Get storage key with namespace
   */
  private getStorageKey(key: string): string {
    return `scriptony:cache:${key}`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const cacheManager = new CacheManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).scriptonyCache = {
    manager: cacheManager,
    get: (key: string) => cacheManager.get(key),
    set: (key: string, data: any) => cacheManager.set(key, data),
    invalidate: (key: string) => cacheManager.invalidate(key),
    invalidatePrefix: (prefix: string) => cacheManager.invalidatePrefix(prefix),
    clear: () => cacheManager.clear(),
    stats: () => cacheManager.getStats(),
  };
  
  console.log(
    '%c💾 SCRIPTONY CACHE MANAGER ACTIVE',
    'color: #6E59A5; font-weight: bold; font-size: 14px;'
  );
  console.log('%cUse window.scriptonyCache.stats() to see cache stats', 'color: #888;');
}
