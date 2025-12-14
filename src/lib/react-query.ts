/**
 * 🚀 REACT QUERY SETUP
 * 
 * Performance-optimierte Query Configuration für "übertrieben schnelle" UX
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient mit aggressiver Cache-Strategie
 * 
 * ⚡ PERFORMANCE TARGETS:
 * - Beats laden in <10ms (aus Cache)
 * - Stale-While-Revalidate für instant UI
 * - Optimistic Updates für alle Mutations
 * - Background Refetching für freshness
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ⚡ Cache für 5 Minuten (beats ändern sich selten)
      gcTime: 5 * 60 * 1000,
      
      // 🔥 Daten werden nach 30s als "stale" markiert → background refetch
      staleTime: 30 * 1000,
      
      // ✅ Zeige alte Daten während neue laden (instant UI!)
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // 🎯 Retry Strategy
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      
      // 📊 Network Mode
      networkMode: 'online',
    },
    mutations: {
      // 🎯 Mutations ohne Retry (UX-Gründe)
      retry: false,
      
      // 📊 Network Mode
      networkMode: 'online',
    },
  },
});

/**
 * Query Keys Factory
 * 
 * Zentralisierte Query Keys für einfaches Invalidation & Prefetching
 */
export const queryKeys = {
  // Beats
  beats: {
    all: ['beats'] as const,
    byProject: (projectId: string) => ['beats', 'project', projectId] as const,
  },
  
  // Projects
  projects: {
    all: ['projects'] as const,
    byId: (projectId: string) => ['projects', projectId] as const,
    byOrg: (orgId: string) => ['projects', 'org', orgId] as const,
  },
  
  // Acts
  acts: {
    all: ['acts'] as const,
    byProject: (projectId: string) => ['acts', 'project', projectId] as const,
  },
  
  // Playbook
  playbook: {
    all: ['playbook'] as const,
    byProject: (projectId: string) => ['playbook', 'project', projectId] as const,
  },
} as const;
