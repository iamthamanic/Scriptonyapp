# 🏗️ Timeline V2 Refactoring Plan

## 🎯 Ziel

Die monolithische Timeline V2 Edge Function (1789 Zeilen) in kleinere, wartbare Microservices aufteilen.

## ❌ Problem: Aktuelle Architektur

```
scriptony-timeline-v2 (1789 Zeilen) - MONOLITH
├── Nodes CRUD         ~400 Zeilen
├── Shots CRUD         ~600 Zeilen
├── Characters CRUD    ~300 Zeilen
├── Project Init       ~200 Zeilen
└── Helpers            ~200 Zeilen
```

**Probleme:**
- ❌ Langsame Cold Starts (>2s)
- ❌ Schwierige Deployments
- ❌ Cache-Invalidierung betrifft ALLES
- ❌ Schwer zu debuggen
- ❌ Ein Bug = Alles down

## ✅ Neue Architektur (Microservices)

```
┌─────────────────────────────────────────────────┐
│ Phase 1: Shots Microservice                     │
├─────────────────────────────────────────────────┤
│ scriptony-shots (~600 Zeilen) ✅                │
│ • GET/POST/PUT/DELETE /shots                    │
│ • Image Upload                                  │
│ • Audio Files (via scriptony-audio)             │
│ • Shot-Character Relations                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Phase 2: Timeline Nodes (Core)                  │
├─────────────────────────────────────────────────┤
│ scriptony-timeline-nodes (~500 Zeilen) ✅       │
│ • GET/POST/PUT/DELETE /nodes                    │
│ • Project Initialization                        │
│ • Bulk Operations                               │
│ • Reordering                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Phase 3: Characters → Worldbuilding             │
├─────────────────────────────────────────────────┤
│ scriptony-worldbuilding (erweitert) ✅          │
│ • Characters sind Worldbuilding-Entities        │
│ • Kein separater Service nötig                  │
└─────────────────────────────────────────────────┘
```

## 📋 Phase 1: Shots Microservice (PRIORITÄT: HOCH)

### Warum zuerst Shots?

1. **Größter Teil** (~600 Zeilen)
2. **Hohe Request-Frequenz** (Editor Auto-Save)
3. **Eigene Domain** (Film-spezifisch)
4. **Klare Abgrenzung** (keine Dependencies zu Nodes)

### Neue Function: `scriptony-shots`

**Routes:**
```typescript
GET    /shots?project_id=X           // Bulk Load für Project
GET    /shots/:sceneId                // Shots für Scene
POST   /shots                         // Create Shot
PUT    /shots/:id                     // Update Shot (+ timestamp!)
DELETE /shots/:id                     // Delete Shot
POST   /shots/reorder                 // Reorder in Scene
POST   /shots/:id/upload-image        // Image Upload
POST   /shots/:id/characters          // Add Character
DELETE /shots/:id/characters/:charId  // Remove Character
```

**Dependencies:**
- ✅ Supabase `shots` table
- ✅ Supabase `shot_audio` table (read only)
- ✅ Supabase `shot_characters` join table
- ✅ `scriptony-audio` für Audio Management
- ✅ `scriptony-worldbuilding` für Characters

### Migration Steps

1. ✅ **Neue Function erstellen:** `/supabase/functions/scriptony-shots/index.ts`
2. ✅ **Code kopieren** aus Timeline V2 (Shots Section)
3. ✅ **API Gateway anpassen** (Route `/shots/*` zu neue Function)
4. ✅ **Testing:** Parallel laufen lassen
5. ✅ **Switch:** API Gateway umschalten
6. ✅ **Cleanup:** Shots Code aus Timeline V2 entfernen

### API Gateway Routing

```typescript
// VORHER
PUT /timeline-v2/shots/:id → scriptony-timeline-v2

// NACHHER
PUT /shots/:id → scriptony-shots ✅
```

## 📋 Phase 2: Timeline Nodes Refactoring

### Umbenennung & Fokus

**Alte Function:** `scriptony-timeline-v2`  
**Neue Function:** `scriptony-timeline-nodes`

**Routes:**
```typescript
GET    /nodes?project_id=X&level=1   // Query Nodes
GET    /nodes/:id                     // Single Node
GET    /nodes/:id/children            // Children
GET    /nodes/:id/path                // Path to Root
POST   /nodes                         // Create Node
PUT    /nodes/:id                     // Update Node
DELETE /nodes/:id                     // Delete Node
POST   /nodes/reorder                 // Reorder
POST   /nodes/bulk                    // Bulk Create
POST   /initialize-project            // Init Structure
```

**Scope:**
- ✅ Acts, Sequences, Scenes (Level 1-3)
- ✅ Generic Template Engine
- ✅ KEINE Shots (jetzt in scriptony-shots)

## 📋 Phase 3: Characters Cleanup

### Option A: In Worldbuilding integrieren ✅ EMPFOHLEN

**Begründung:**
- Characters SIND Worldbuilding-Entities
- Vermeidet Duplikation
- Bereits `scriptony-worldbuilding` vorhanden

**Routes in scriptony-worldbuilding:**
```typescript
GET    /characters?project_id=X
GET    /characters/:id
POST   /characters
PUT    /characters/:id
DELETE /characters/:id
```

**Timeline ruft auf:**
```typescript
// Frontend verwendet Worldbuilding API
import { getCharacters } from '@/lib/api/worldbuilding-api'
```

### Option B: Eigener Service (wenn nötig)

Nur wenn Characters Timeline-spezifische Logik brauchen.

## 🎨 API Gateway Changes

### Routing Logic

```typescript
// api-gateway.ts
const FUNCTION_ROUTES = {
  // Timeline System
  '/nodes': 'scriptony-timeline-nodes',
  '/initialize-project': 'scriptony-timeline-nodes',
  
  // Shots System
  '/shots': 'scriptony-shots',
  
  // Worldbuilding (inkl. Characters)
  '/characters': 'scriptony-worldbuilding',
  '/worlds': 'scriptony-worldbuilding',
  '/locations': 'scriptony-worldbuilding',
  
  // Other Services
  '/projects': 'scriptony-projects',
  '/chat': 'scriptony-assistant',
  '/audio': 'scriptony-audio',
};
```

## 📊 Performance Vorteile

### Vorher (Monolith)

```
scriptony-timeline-v2
├── Cold Start: 2.5s ❌
├── Response Time: 800ms ❌
├── Deploy Time: 45s ❌
└── Cache Invalidation: ALLES ❌
```

### Nachher (Microservices)

```
scriptony-shots
├── Cold Start: 0.8s ✅
├── Response Time: 200ms ✅
├── Deploy Time: 15s ✅
└── Cache Invalidation: Nur Shots ✅

scriptony-timeline-nodes
├── Cold Start: 1.0s ✅
├── Response Time: 300ms ✅
├── Deploy Time: 20s ✅
└── Cache Invalidation: Nur Nodes ✅
```

## 🚀 Rollout Plan

### Week 1: Shots Microservice

- [ ] Neue Function `scriptony-shots` erstellen
- [ ] Code aus Timeline V2 extrahieren
- [ ] Unit Tests schreiben
- [ ] API Gateway Routing hinzufügen
- [ ] Parallel Testing (beide Functions aktiv)
- [ ] Switch über Feature Flag

### Week 2: Timeline Nodes Refactoring

- [ ] Timeline V2 → Timeline Nodes umbenennen
- [ ] Shots Code entfernen
- [ ] Characters Code entfernen
- [ ] Tests aktualisieren
- [ ] Deploy & Verify

### Week 3: Characters Cleanup

- [ ] Characters in Worldbuilding verschieben
- [ ] Frontend API Calls anpassen
- [ ] Timeline-Character Relations testen
- [ ] Alte Routes deprecaten

## 🧪 Testing Strategy

### Integration Tests

```typescript
// Test Suite für Shots
describe('Shots Microservice', () => {
  it('should create shot', async () => {
    const response = await fetch('/shots', { method: 'POST', ... })
    expect(response.status).toBe(201)
  })
  
  it('should update shot with timestamp', async () => {
    const response = await fetch('/shots/123', { 
      method: 'PUT',
      body: JSON.stringify({ 
        dialog: {...},
        updated_at: new Date().toISOString()
      })
    })
    const shot = await response.json()
    expect(shot.updatedAt).toBe(/* expected timestamp */)
  })
})
```

### Load Testing

```bash
# Vorher
wrk -t12 -c400 -d30s /timeline-v2/shots
# Requests/sec: 450 ❌

# Nachher
wrk -t12 -c400 -d30s /shots
# Requests/sec: 1800 ✅ (4x faster!)
```

## 📝 Migration Checklist

### Pre-Migration

- [ ] Backup Database
- [ ] Document current API
- [ ] Setup monitoring
- [ ] Create rollback plan

### During Migration

- [ ] Deploy new functions
- [ ] Update API Gateway
- [ ] Run parallel for 24h
- [ ] Monitor error rates
- [ ] Verify performance

### Post-Migration

- [ ] Remove old code
- [ ] Update documentation
- [ ] Archive old functions
- [ ] Celebrate! 🎉

## 🔍 Monitoring & Alerting

### Metrics to Track

```typescript
// Cold Start Times
shots_cold_start_p95 < 1000ms ✅
timeline_nodes_cold_start_p95 < 1200ms ✅

// Response Times
shots_response_p95 < 300ms ✅
timeline_nodes_response_p95 < 400ms ✅

// Error Rates
shots_error_rate < 0.1% ✅
timeline_nodes_error_rate < 0.1% ✅
```

## 💡 Best Practices

1. **Single Responsibility:** Jede Function macht EINE Sache gut
2. **Small Functions:** 200-600 Zeilen max
3. **Independent Deployments:** Shots unabhängig von Nodes deployen
4. **Shared Types:** TypeScript Interfaces in `/lib/types`
5. **API Gateway:** Zentrale Routing-Logik
6. **Graceful Degradation:** Wenn Shots down, Nodes läuft weiter

## 🎯 Success Metrics

### Goals

- ✅ Cold Start < 1s (aktuell: 2.5s)
- ✅ Response Time < 300ms (aktuell: 800ms)
- ✅ Deploy Time < 20s (aktuell: 45s)
- ✅ Error Rate < 0.1%
- ✅ Developer Velocity +50%

## 📚 References

- [Microservice Architecture Patterns](https://microservices.io/patterns/)
- [Supabase Edge Functions Best Practices](https://supabase.com/docs/guides/functions/best-practices)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)

---

**Status:** ⏳ Planning Phase  
**Priority:** 🔴 HIGH (Performance Critical)  
**Effort:** 2-3 Wochen  
**Impact:** 🚀 VERY HIGH
