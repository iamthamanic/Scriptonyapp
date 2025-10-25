# 🏗️ MULTI-FUNCTION ARCHITECTURE

## 🎯 WARUM?

### **Problem mit Monolith:**
- ❌ **1 Edge Function** = 1900+ Zeilen Code
- ❌ Jedes Feature-Update = **kompletter Re-Deploy**
- ❌ Schwer zu warten
- ❌ Langsames Cold Start
- ❌ Deployment-Konflikte (Timeline Fix killt AI Chat)

### **Lösung mit Microservices:**
- ✅ **5 kleine Edge Functions** = ~400 Zeilen pro Function
- ✅ Feature-Update = **Nur betroffene Function deployen**
- ✅ Leicht zu warten
- ✅ Schnelles Cold Start
- ✅ Unabhängige Deployments

---

## 🏗️ NEUE ARCHITEKTUR

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           API GATEWAY (lib/api-gateway.ts)            │  │
│  │  Automatically routes requests to correct function    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
        ┌────────────────────────────────────────┐
        │     Route-based Automatic Routing       │
        └────────────────────────────────────────┘
                              ▼
    ┌──────────┬──────────┬──────────┬──────────┬──────────┐
    │          │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼          │
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│Projects│ │Timeline│ │World-  │ │Episodes│ │   AI   │   │
│        │ │        │ │building│ │        │ │  Chat  │   │
├────────┤ ├────────┤ ├────────┤ ├────────┤ ├────────┤   │
│Projects│ │Acts    │ │Worlds  │ │Episodes│ │Settings│   │
│Init    │ │Seqs    │ │Chars   │ │        │ │Convos  │   │
│        │ │Scenes  │ │        │ │        │ │Messages│   │
│        │ │Shots   │ │        │ │        │ │RAG     │   │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
    │          │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┴──────────┘
                              ▼
                  ┌───────────────────────┐
                  │  SUPABASE POSTGRES    │
                  │  (Shared Database)    │
                  └───────────────────────┘
```

---

## 📦 EDGE FUNCTIONS ÜBERSICHT

### **1. scriptony-projects**
```
Routes:
  GET    /projects
  POST   /projects
  GET    /projects/:id
  PUT    /projects/:id
  DELETE /projects/:id
  POST   /projects/:id/init

Dependencies:
  - routes-projects-init.tsx

Size: ~300 Zeilen
Deploy Frequency: Selten
```

### **2. scriptony-timeline** ⭐
```
Routes:
  GET    /acts
  POST   /acts
  PUT    /acts/:id
  DELETE /acts/:id
  
  GET    /sequences
  POST   /sequences
  PUT    /sequences/:id
  DELETE /sequences/:id
  
  GET    /scenes
  POST   /scenes
  PUT    /scenes/:id
  DELETE /scenes/:id
  
  GET    /shots/:sceneId
  POST   /shots
  PUT    /shots/:id
  DELETE /shots/:id

Dependencies:
  - routes-acts.tsx
  - routes-sequences.tsx
  - routes-scenes.tsx
  - routes-shots.tsx

Size: ~800 Zeilen
Deploy Frequency: SEHR OFT (Timeline Features)
```

### **3. scriptony-worldbuilding**
```
Routes:
  GET    /worlds
  POST   /worlds
  GET    /worlds/:id
  PUT    /worlds/:id
  DELETE /worlds/:id
  
  GET    /characters
  POST   /characters
  GET    /characters/:id
  PUT    /characters/:id
  DELETE /characters/:id

Dependencies:
  - routes-worlds.tsx
  - routes-characters.tsx

Size: ~400 Zeilen
Deploy Frequency: Mittel
```

### **4. scriptony-episodes**
```
Routes:
  GET    /episodes
  POST   /episodes
  GET    /episodes/:id
  PUT    /episodes/:id
  DELETE /episodes/:id

Dependencies:
  - routes-episodes.tsx

Size: ~200 Zeilen
Deploy Frequency: Selten
```

### **5. scriptony-ai** ⭐
```
Routes:
  GET    /ai/settings
  POST   /ai/settings
  PUT    /ai/settings/:id
  
  GET    /conversations
  POST   /conversations
  DELETE /conversations/:id
  
  GET    /conversations/:id/messages
  POST   /conversations/:id/messages
  
  POST   /ai/chat
  
  GET    /rag/documents
  POST   /rag/sync

Dependencies:
  - routes-ai-chat.tsx
  - ai-provider-calls.tsx
  - token-counter.tsx
  - tools-*.tsx

Size: ~600 Zeilen
Deploy Frequency: SEHR OFT (AI Features)
```

---

## 🔄 FRONTEND MIGRATION

### **VORHER (Monolith):**

```typescript
// lib/api-client.ts
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;

export async function getProjects(token: string) {
  const response = await fetch(`${API_BASE}/projects`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
}
```

### **NACHHER (Multi-Function):**

```typescript
// lib/api-gateway.ts automatically routes!
import { apiGet } from './lib/api-gateway';

export async function getProjects(token: string) {
  // Automatically routed to scriptony-projects
  return apiGet('/projects', token);
}

export async function getShots(sceneId: string, token: string) {
  // Automatically routed to scriptony-timeline
  return apiGet(`/shots/${sceneId}`, token);
}

export async function chatWithAI(message: string, token: string) {
  // Automatically routed to scriptony-ai
  return apiPost('/ai/chat', { message }, token);
}
```

---

## 📋 MIGRATION PLAN

### **Phase 1: API Gateway Setup** ✅
- [x] Create `/lib/api-gateway.ts`
- [x] Define route mapping
- [x] Create convenience methods (apiGet, apiPost, etc.)

### **Phase 2: Create Edge Functions**
- [ ] `scriptony-projects` (smallest, easiest first)
- [ ] `scriptony-episodes` (also small)
- [ ] `scriptony-worldbuilding` (medium)
- [ ] `scriptony-timeline` (large, important)
- [ ] `scriptony-ai` (large, complex)

### **Phase 3: Update Frontend** (Automated!)
- [ ] Replace direct fetch calls with `apiGateway()`
- [ ] Update all API client files
- [ ] Test each function independently

### **Phase 4: Deploy & Test**
- [ ] Deploy functions one by one
- [ ] Test each function
- [ ] Monitor logs
- [ ] Rollback if needed (easy with multi-function!)

### **Phase 5: Deprecate Monolith**
- [ ] All routes migrated
- [ ] Delete `make-server-3b52693b`
- [ ] Clean up old code

---

## 🚀 DEPLOYMENT WORKFLOW

### **Scenario: Shot Bug Fix (wie jetzt!)**

**VORHER (Monolith):**
```bash
1. Fix shot routes in massive file
2. Deploy ENTIRE server (1900 Zeilen)
3. Hope nichts anderes kaputt geht
4. Pray AI Chat noch funktioniert
5. 404 Errors in Projects/Worlds 😱
```

**NACHHER (Multi-Function):**
```bash
1. Fix shot routes in scriptony-timeline
2. Deploy NUR scriptony-timeline (~800 Zeilen)
3. Alles andere läuft weiter
4. AI Chat? ✅ Läuft
5. Projects? ✅ Läuft
6. Worlds? ✅ Läuft
```

**Zeit gespart:** 10 Minuten → 2 Minuten
**Risiko:** Hoch → Niedrig
**Debugging:** Schwer → Einfach

---

## 💡 VORTEILE

### **Development:**
- ✅ Kleinere Dateien = leichter zu lesen
- ✅ Klare Separation of Concerns
- ✅ Einfacher zu testen
- ✅ Weniger Merge-Konflikte

### **Deployment:**
- ✅ Unabhängige Deployments
- ✅ Rollback nur der betroffenen Function
- ✅ A/B Testing möglich
- ✅ Canary Deployments möglich

### **Performance:**
- ✅ Schnelleres Cold Start (kleinere Functions)
- ✅ Bessere Skalierung (Functions separat skalierbar)
- ✅ Weniger Memory Footprint

### **Maintenance:**
- ✅ Bugs betreffen nur 1 Function
- ✅ Einfacher zu debuggen
- ✅ Logs getrennt pro Function
- ✅ Kosten-Transparenz

---

## 🎯 NÄCHSTE SCHRITTE

### **Option A: Schrittweise Migration (EMPFOHLEN)**
```
1. Create scriptony-projects (einfachste Function)
2. Deploy & Test
3. Update Frontend für /projects Routes
4. Test
5. Repeat für andere Functions
```

### **Option B: Big Bang (NICHT EMPFOHLEN)**
```
1. Create alle 5 Functions
2. Deploy alle gleichzeitig
3. Hope everything works
4. Debug chaos
```

---

## 🔍 TESTING STRATEGY

### **Per Function:**
```bash
# Test scriptony-projects
curl https://xxx.supabase.co/functions/v1/scriptony-projects/health
curl https://xxx.supabase.co/functions/v1/scriptony-projects/projects

# Test scriptony-timeline
curl https://xxx.supabase.co/functions/v1/scriptony-timeline/health
curl https://xxx.supabase.co/functions/v1/scriptony-timeline/acts

# etc.
```

### **Integration Tests:**
```typescript
// Test that API Gateway routes correctly
test('API Gateway routes /projects to scriptony-projects', async () => {
  const result = await apiGet('/projects', token);
  expect(result).toBeDefined();
});

test('API Gateway routes /shots to scriptony-timeline', async () => {
  const result = await apiGet('/shots/scene-123', token);
  expect(result).toBeDefined();
});
```

---

## 📊 ROLLOUT TIMELINE

| Week | Task | Function | Status |
|------|------|----------|--------|
| 1 | Setup API Gateway | - | ✅ Done |
| 1 | Create scriptony-projects | Projects | ⏳ Todo |
| 2 | Migrate Projects frontend | Projects | ⏳ Todo |
| 2 | Create scriptony-episodes | Episodes | ⏳ Todo |
| 3 | Create scriptony-worldbuilding | Worlds+Chars | ⏳ Todo |
| 4 | Create scriptony-timeline | Timeline | ⏳ Todo |
| 5 | Create scriptony-ai | AI Chat | ⏳ Todo |
| 6 | Deprecate monolith | - | ⏳ Todo |

**Total Time:** 6 Wochen (bei schrittweiser Migration)
**Risk Level:** Niedrig (immer Rollback möglich)

---

## 🎬 FAZIT

### **JA, das macht ABSOLUT Sinn!**

Die Multi-Function Architektur ist:
- ✅ **Wartbarer**
- ✅ **Skalierbarer**
- ✅ **Sicherer** (isolierte Deployments)
- ✅ **Schneller** (kleinere Functions)
- ✅ **Professioneller**

### **Nächster Schritt:**

Soll ich:
1. **Alle 5 Functions komplett erstellen?** (Big Bang)
2. **Nur scriptony-timeline erstellen?** (Fix Shot Bug isolated)
3. **Schrittweise Migration starten?** (Projects first)

**Deine Wahl!** 🚀
