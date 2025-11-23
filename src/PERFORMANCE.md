# 🚀 Scriptony Performance System

## Übersicht

Scriptony implementiert ein vollständiges Performance-Monitoring-System mit SLAs (Service Level Agreements), ähnlich wie McMaster-Carr. Das Ziel: **Übertrieben schnelle** User Experience mit automatischer Überwachung und Warnung bei Performance-Problemen.

## Kernkomponenten

### 1. Performance Monitor (`/lib/performance-monitor.ts`)

**SLA Targets:**
```typescript
{
  CACHE_READ: 50ms,          // Cache muss instant sein
  CACHE_WRITE: 100ms,        // Cache schreiben
  API_FAST: 300ms,           // Schnelle APIs
  API_STANDARD: 800ms,       // Standard APIs
  TIMELINE_LOAD: 1000ms,     // Timeline komplett laden < 1s!
  TAB_SWITCH: 200ms,         // Tab-Wechsel instant
  DROPDOWN_OPEN: 150ms,      // Dropdown öffnen
  USER_INTERACTION: 100ms,   // Alle User-Interactions
}
```

**Usage:**
```typescript
import { perfMonitor } from '../lib/performance-monitor';

// Async Operation
const result = await perfMonitor.measure(
  'unique-id',
  'TIMELINE_LOAD',
  'Loading timeline for Project X',
  async () => {
    return await loadTimelineData();
  },
  { projectId: 'abc' }
);

// Sync Operation
const result = perfMonitor.measureSync(
  'unique-id',
  'CACHE_READ',
  'Reading from cache',
  () => {
    return localStorage.getItem('key');
  }
);
```

**Console Output:**
- ✅ Grüne Logs wenn SLA eingehalten
- ⚠️ Gelbe Warnings wenn SLA verletzt
- Automatische Statistiken (P50, P95, P99)

### 2. Cache Manager (`/lib/cache-manager.ts`)

**Features:**
- **Memory Cache** (instant, < 1ms)
- **localStorage Cache** (persistent, < 50ms)
- **Stale-While-Revalidate** (alte Daten sofort zeigen, dann refreshen)
- **Automatic Quota Management** (auto-cleanup bei vollem localStorage)

**Usage:**
```typescript
import { cacheManager } from '../lib/cache-manager';

// Simple Get/Set
const cached = cacheManager.get('timeline:project-123');
if (cached.data) {
  console.log('Cache hit!', cached.isStale);
}

cacheManager.set('timeline:project-123', data, {
  ttl: 5 * 60 * 1000,      // 5 minutes
  staleTime: 30 * 1000,    // 30 seconds
});

// Stale-While-Revalidate (empfohlen!)
const data = await cacheManager.getWithRevalidate(
  'timeline:project-123',
  async () => {
    // Fetcher - wird nur aufgerufen wenn Cache leer/expired
    return await fetchFromAPI();
  },
  {
    ttl: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  }
);

// Invalidate after updates
cacheManager.invalidate('timeline:project-123');

// Invalidate by prefix (alle Projektdaten)
cacheManager.invalidatePrefix('project-123');
```

### 3. Prefetch Manager (`/lib/prefetch-manager.ts`)

**Hover-Based Prefetching** wie McMaster-Carr!

**Usage:**
```typescript
import { prefetchManager } from '../lib/prefetch-manager';

// Setup hover prefetch für ein Element
const cleanup = prefetchManager.setupHoverPrefetch(
  buttonElement,
  'timeline:project-123',
  async () => {
    // Fetcher - wird nach 100ms hover aufgerufen
    return await loadTimeline();
  },
  {
    delay: 100,        // Hover delay
    priority: 'high',  // high | low
  }
);

// Cleanup
cleanup();
```

### 4. Timeline Cache Hook (`/hooks/useTimelineCache.ts`)

**React Hook** für einfache Integration:

```typescript
import { useTimelineCache } from '../hooks/useTimelineCache';

function MyComponent({ projectId }) {
  const { 
    loadTimeline, 
    prefetchTimeline, 
    invalidateTimeline 
  } = useTimelineCache(projectId);
  
  const dropdownRef = useRef(null);
  
  // Setup hover prefetch
  useEffect(() => {
    return prefetchTimeline(dropdownRef.current);
  }, [prefetchTimeline]);
  
  // Load with caching
  const handleClick = async () => {
    const data = await loadTimeline();
    console.log('Loaded (possibly from cache):', data);
  };
  
  // Invalidate after update
  const handleUpdate = async () => {
    await updateTimeline();
    invalidateTimeline(); // Cache invalidieren!
  };
  
  return <button ref={dropdownRef} onClick={handleClick}>Load</button>;
}
```

## Integration in Components

### FilmDropdown / BookDropdown

**Bereits integriert:**
- ✅ Cache-Backed Loading mit Stale-While-Revalidate
- ✅ Performance Monitoring auf allen Loads
- ✅ Cache-Invalidierung bei Updates

**Code-Beispiel:**
```typescript
const loadTimelineData = async () => {
  const cacheKey = `timeline:${projectId}`;
  
  // Try cache first
  const cached = cacheManager.get(cacheKey);
  if (cached.data && !cached.isStale) {
    // Instant load from cache!
    setData(cached.data);
    return;
  }
  
  // Load from API with performance tracking
  const data = await perfMonitor.measure(
    `timeline-${projectId}`,
    'TIMELINE_LOAD',
    `Load Timeline: ${projectId}`,
    async () => {
      return await fetchFromAPI();
    }
  );
  
  // Cache for next time
  cacheManager.set(cacheKey, data, {
    ttl: 5 * 60 * 1000,
    staleTime: 30 * 1000,
  });
};
```

### StructureBeatsSection

**Hover-Prefetch auf Tabs:**
```typescript
const { prefetchTimeline } = useTimelineCache(projectId);
const dropdownTabRef = useRef(null);

useEffect(() => {
  // Prefetch wenn User über Tab hovert
  return prefetchTimeline(dropdownTabRef.current);
}, [prefetchTimeline]);

return <TabsTrigger ref={dropdownTabRef}>Dropdown</TabsTrigger>;
```

## Performance Dashboard

**Development-only** floating button (rechts unten):

- 📊 Real-time SLA Monitoring
- 💾 Cache Statistics
- ⚡ Prefetch Queue Status
- ❌ Violations Highlighting

**Console Commands:**
```javascript
// Show full report
window.scriptonyPerf.printReport();

// Get stats for category
window.scriptonyPerf.getStats('TIMELINE_LOAD');

// Clear measurements
window.scriptonyPerf.clear();

// Cache stats
window.scriptonyCache.stats();

// Clear cache
window.scriptonyCache.clear();

// Prefetch stats
window.scriptonyPrefetch.stats();
```

## Best Practices

### ✅ DO:

1. **Cache ALLES was geladen wird**
   ```typescript
   const data = await cacheManager.getWithRevalidate(key, fetcher);
   ```

2. **Invalidate nach Updates**
   ```typescript
   await updateItem();
   cacheManager.invalidate(`timeline:${projectId}`);
   ```

3. **Prefetch beim Hover**
   ```typescript
   setupHoverPrefetch(element, key, fetcher);
   ```

4. **Performance tracken**
   ```typescript
   await perfMonitor.measure(id, category, operation, fn);
   ```

5. **Stale-While-Revalidate nutzen**
   - Sofort alte Daten zeigen
   - Im Hintergrund refreshen
   - User sieht instant Feedback!

### ❌ DON'T:

1. **NICHT bei jedem Error alles neu laden**
   ```typescript
   // ❌ BAD
   catch (error) {
     loadTimeline(); // Lädt ALLES neu!
   }
   
   // ✅ GOOD
   catch (error) {
     // Nur betroffenes Item neu laden
     invalidateTimeline();
     // Oder einfach Optimistic UI behalten
   }
   ```

2. **NICHT ohne Cache laden**
   ```typescript
   // ❌ BAD
   const data = await fetchFromAPI();
   
   // ✅ GOOD
   const data = await cacheManager.getWithRevalidate(key, fetchFromAPI);
   ```

3. **NICHT synchron auf API warten**
   ```typescript
   // ❌ BAD - Blocking
   const data = await loadData();
   setData(data);
   
   // ✅ GOOD - Instant aus Cache, dann refresh
   const cached = cacheManager.get(key);
   if (cached.data) setData(cached.data);
   const fresh = await loadData();
   setData(fresh);
   ```

## SLA Enforcement

Das System **warnt automatisch** in der Console bei SLA-Verletzungen:

```
⚠️ [PERF SLA VIOLATION] Timeline Load
   Category: TIMELINE_LOAD
   Duration: 1523.45ms
   Target: 1000ms
   Exceeded by: 523.45ms (52.3%)
```

**Action Items bei Violations:**

1. **Prüfen ob Caching aktiv ist**
2. **Prefetching einbauen**
3. **API-Calls optimieren** (z.B. weniger Daten, Pagination)
4. **Server-Side Performance** (wenn API zu langsam)
5. **Lazy Loading** (nicht alles auf einmal laden)

## McMaster-Carr Speed Checklist

- ✅ **Hover Prefetch** - Daten laden bevor User klickt
- ✅ **Aggressive Caching** - localStorage + Memory
- ✅ **Stale-While-Revalidate** - Alte Daten sofort, refresh im Hintergrund
- ✅ **Performance Monitoring** - SLAs überwachen
- ✅ **Optimistic UI** - Instant Updates ohne API-Wait
- ✅ **Critical CSS Inline** - Tailwind schon da
- ✅ **Parallel Loading** - Promise.all für alle Daten

## Performance Goals

| Operation | Target | Status |
|-----------|--------|--------|
| Cache Read | < 50ms | ✅ |
| Tab Switch | < 200ms | ✅ |
| Dropdown Open (cached) | < 150ms | ✅ |
| Timeline Load (cached) | < 100ms | ✅ |
| Timeline Load (API) | < 1s | ⚠️ Work in progress |
| User Interaction | < 100ms | ✅ |

## Future Optimizations

1. **Server-Side Aggregation** - Counts ohne Full Data
2. **Virtual Scrolling** - Nur sichtbare Items rendern
3. **Web Workers** - Schwere Berechnungen im Background
4. **HTTP/2 Push** - Server schickt Daten bevor Client fragt
5. **Service Worker** - Offline-fähig mit aggressive caching
6. **IndexedDB** - Für große Datasets (besser als localStorage)

---

**🎯 Ziel: Scriptony muss sich so schnell anfühlen wie McMaster-Carr!**

Jede Operation die langsamer als ihr SLA ist, muss optimiert werden.
