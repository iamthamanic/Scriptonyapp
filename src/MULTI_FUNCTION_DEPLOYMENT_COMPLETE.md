# 🚀 MULTI-FUNCTION ARCHITECTURE - COMPLETE DEPLOYMENT GUIDE

## ✅ WAS IST FERTIG?

Du hast jetzt **5 standalone Edge Functions** + **erweiterten API Gateway**:

```
✅ /supabase/functions/scriptony-projects/index.ts (400 Zeilen)
   → Project CRUD, Stats, Initialization

✅ /supabase/functions/scriptony-timeline/index.ts (existiert - Acts only)
   → Old Timeline (weiter nutzbar)

✅ /supabase/functions/scriptony-timeline-v2/index.ts (800 Zeilen)
   → NEW Timeline mit Template Engine!

✅ /supabase/functions/scriptony-worldbuilding/index.ts (600 Zeilen)
   → Worlds, Characters, Locations

✅ /supabase/functions/scriptony-assistant/index.ts (700 Zeilen)
   → AI Chat, RAG, MCP Tools, Settings

✅ /supabase/functions/scriptony-gym/index.ts (500 Zeilen)
   → Exercises, Progress, Achievements

✅ /lib/api-gateway.ts (erweitert)
   → Automatic Routing zu allen Functions
```

---

## 🎯 ARCHITEKTUR OVERVIEW

### **VORHER (Monolith)**
```
❌ make-server-3b52693b (1900+ Zeilen)
   - Jede Änderung = kompletter Re-Deploy
   - Timeline Bug = AI Chat kann brechen
   - Schwer zu warten
```

### **NACHHER (Microservices)**
```
✅ 5 kleine Functions (~500 Zeilen each)
   - Timeline Fix = nur Timeline deployen
   - AI Update = nur Assistant deployen
   - Unabhängige Deployments
   - Einfach zu warten
```

---

## 📦 FUNCTION DETAILS

### **1. scriptony-projects** (⚙️ Project Management)
```typescript
Routes:
  GET    /projects              → All projects
  GET    /projects/:id          → Single project
  POST   /projects              → Create project
  PUT    /projects/:id          → Update project
  DELETE /projects/:id          → Delete project
  POST   /projects/:id/init     → Initialize structure
  GET    /projects/:id/stats    → Project statistics

Features:
  ✅ All project types (Film, Series, Book, Theater, Game)
  ✅ Template selection
  ✅ Organization support
  ✅ Statistics (nodes, worlds, characters)

Size: ~400 Zeilen
Deploy Frequency: Selten
```

### **2. scriptony-timeline-v2** (🎬 Timeline Engine)
```typescript
Routes:
  GET    /nodes                 → Query nodes (filtered)
  GET    /nodes/:id             → Single node
  GET    /nodes/:id/children    → Get children (recursive)
  GET    /nodes/:id/path        → Get breadcrumb path
  POST   /nodes                 → Create node
  PUT    /nodes/:id             → Update node
  DELETE /nodes/:id             → Delete node (cascade)
  POST   /nodes/bulk            → Bulk create
  POST   /nodes/reorder         → Reorder (drag & drop)
  POST   /initialize-project    → Initialize structure

Features:
  ✅ Generic Template Engine
  ✅ All templates (Film, Series, Book, Theater, Game)
  ✅ JSONB metadata
  ✅ Recursive queries
  ✅ Bulk operations

Size: ~800 Zeilen
Deploy Frequency: SEHR OFT
```

### **3. scriptony-worldbuilding** (🌍 Worlds & Characters)
```typescript
Routes:
  GET    /worlds                → All worlds
  GET    /worlds/:id            → Single world
  POST   /worlds                → Create world
  PUT    /worlds/:id            → Update world
  DELETE /worlds/:id            → Delete world
  
  GET    /characters            → All characters
  GET    /characters/:id        → Single character
  POST   /characters            → Create character
  PUT    /characters/:id        → Update character
  DELETE /characters/:id        → Delete character
  
  GET    /locations             → All locations (future)

Features:
  ✅ Worlds with lore & images
  ✅ Characters with backstory, personality
  ✅ World filtering
  ✅ Image support

Size: ~600 Zeilen
Deploy Frequency: Mittel
```

### **4. scriptony-assistant** (🤖 AI Assistant)
```typescript
Routes:
  GET    /ai/settings           → Get AI settings
  POST   /ai/settings           → Save AI settings
  
  GET    /conversations         → All conversations
  POST   /conversations         → Create conversation
  DELETE /conversations/:id     → Delete conversation
  
  GET    /conversations/:id/messages  → All messages
  POST   /conversations/:id/messages  → Add message
  
  POST   /ai/chat               → Main AI chat endpoint
  
  POST   /rag/sync              → Sync RAG database
  GET    /rag/search            → Search RAG
  
  GET    /mcp/tools             → Get available tools

Features:
  ✅ Multi-provider (OpenAI, Anthropic, OpenRouter, DeepSeek)
  ✅ Conversation management
  ✅ API key management
  ✅ Model selection
  ✅ System prompts
  ✅ RAG support
  ✅ MCP tools

Size: ~700 Zeilen
Deploy Frequency: SEHR OFT
```

### **5. scriptony-gym** (💪 Creative Gym)
```typescript
Routes:
  GET    /exercises             → All exercises
  GET    /exercises/:id         → Single exercise
  POST   /exercises/:id/complete  → Complete exercise
  
  GET    /progress              → User progress
  
  GET    /achievements          → All achievements
  
  GET    /categories            → Exercise categories
  
  GET    /daily-challenge       → Today's challenge

Features:
  ✅ Exercises/Challenges
  ✅ Progress tracking
  ✅ Achievements
  ✅ Daily challenges
  ✅ Categories

Size: ~500 Zeilen
Deploy Frequency: Mittel

Note: Currently mock data - DB tables need to be added
```

---

## 🚀 DEPLOYMENT (Step-by-Step)

### **OPTION A: Schrittweise (EMPFOHLEN!)**

Deploy Functions **eine nach der anderen** und teste jede!

#### **Schritt 1: Projects (Einfachste)**
```
1. Supabase Dashboard → Edge Functions
2. Create: "scriptony-projects"
3. Copy: /supabase/functions/scriptony-projects/index.ts
4. Deploy
5. Test: curl .../scriptony-projects/health
```

#### **Schritt 2: Worldbuilding**
```
1. Create: "scriptony-worldbuilding"
2. Copy: /supabase/functions/scriptony-worldbuilding/index.ts
3. Deploy
4. Test: curl .../scriptony-worldbuilding/health
```

#### **Schritt 3: Timeline V2**
```
1. Create: "scriptony-timeline-v2"
2. Copy: /supabase/functions/scriptony-timeline-v2/index.ts
3. Deploy
4. Test: curl .../scriptony-timeline-v2/health
```

#### **Schritt 4: Assistant**
```
1. Create: "scriptony-assistant"
2. Copy: /supabase/functions/scriptony-assistant/index.ts
3. Deploy
4. Test: curl .../scriptony-assistant/health
```

#### **Schritt 5: Gym**
```
1. Create: "scriptony-gym"
2. Copy: /supabase/functions/scriptony-gym/index.ts
3. Deploy
4. Test: curl .../scriptony-gym/health
```

**WICHTIG:** Nach jedem Deploy → Health Check testen!

---

### **OPTION B: All at Once (Riskanter)**

Deploy alle 5 Functions gleichzeitig. **Nur wenn du mutig bist!** 😅

---

## 🧪 TESTING

### **Health Checks (WICHTIG!)**
```bash
# Replace YOUR-PROJECT-ID with your actual project ID

# Projects
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-projects/health

# Timeline V2
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-timeline-v2/health

# Worldbuilding
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-worldbuilding/health

# Assistant
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-assistant/health

# Gym
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-gym/health

# Expected Response für alle:
{
  "status": "ok",
  "function": "scriptony-xxx",
  "version": "1.0.0",
  "timestamp": "..."
}
```

### **API Gateway Test (Frontend)**
```typescript
import { apiGet } from './lib/api-gateway';
import { getAuthToken } from './lib/auth/getAuthToken';

const token = await getAuthToken();

// Test Projects (automatic routing)
const projects = await apiGet('/projects', token);
console.log('Projects:', projects);

// Test Worlds (automatic routing)
const worlds = await apiGet('/worlds?project_id=xxx', token);
console.log('Worlds:', worlds);

// Test Nodes (automatic routing)
const nodes = await apiGet('/nodes?project_id=xxx&level=1', token);
console.log('Nodes:', nodes);

// Test AI Settings (automatic routing)
const settings = await apiGet('/ai/settings', token);
console.log('Settings:', settings);

// Test Exercises (automatic routing)
const exercises = await apiGet('/exercises', token);
console.log('Exercises:', exercises);
```

---

## 📊 API GATEWAY ROUTING

Der API Gateway routet **automatisch** zu den richtigen Functions:

```typescript
// Frontend Code (KEINE Änderung nötig!)
import { apiGet, apiPost } from './lib/api-gateway';

// Automatisch zu scriptony-projects
const projects = await apiGet('/projects', token);

// Automatisch zu scriptony-timeline-v2
const nodes = await apiGet('/nodes?project_id=xxx', token);

// Automatisch zu scriptony-worldbuilding
const characters = await apiGet('/characters?project_id=xxx', token);

// Automatisch zu scriptony-assistant
const response = await apiPost('/ai/chat', { message: 'Hi' }, token);

// Automatisch zu scriptony-gym
const exercises = await apiGet('/exercises', token);
```

**Du musst NICHTS im Frontend ändern!** Der Gateway macht das automatisch! ✅

---

## 🔄 MIGRATION VON MONOLITH

### **Parallel Betrieb (SICHER!)**

```
✅ Alte Functions bleiben online
✅ Neue Functions parallel deployed
✅ Frontend nutzt API Gateway
✅ Gateway routet zu neuen Functions
✅ Wenn Fehler → Rollback zu alt

Reihenfolge:
1. Deploy neue Functions
2. Test Health Checks
3. Test API Gateway Routing
4. Test einzelne Endpoints
5. Wenn alles läuft → Frontend Switch
6. Wenn Problem → Rollback (Gateway auf alt)
```

### **Big Bang Switch (RISKANT!)**

```
❌ Alle Functions gleichzeitig deployen
❌ Monolith sofort abschalten
❌ Hope everything works
❌ Wenn nicht → PANIK! 😱
```

**ICH EMPFEHLE: Parallel Betrieb!**

---

## ✅ DEPLOYMENT CHECKLIST

### **Vor Deployment:**
- [ ] Database Migrations gelaufen (timeline_nodes, template_id)
- [ ] Alle 5 Function Files erstellt
- [ ] API Gateway erweitert
- [ ] Health Check URLs vorbereitet

### **Deployment:**
- [ ] scriptony-projects deployed & tested
- [ ] scriptony-worldbuilding deployed & tested
- [ ] scriptony-timeline-v2 deployed & tested
- [ ] scriptony-assistant deployed & tested
- [ ] scriptony-gym deployed & tested

### **Testing:**
- [ ] Alle Health Checks grün
- [ ] API Gateway routing funktioniert
- [ ] Projects endpoints tested
- [ ] Worldbuilding endpoints tested
- [ ] Timeline nodes endpoints tested
- [ ] Assistant endpoints tested
- [ ] Gym endpoints tested

### **Frontend Integration:**
- [ ] API Gateway verwendet
- [ ] Alte monolith URLs ersetzt
- [ ] Error Handling vorhanden
- [ ] Logging funktioniert

---

## 🆕 NEUE FUNCTION HINZUFÜGEN

**So einfach ist es:**

### **1. Erstelle Function File**
```typescript
// /supabase/functions/scriptony-NEUEFUNC/index.ts

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

app.use('*', logger(console.log));
app.use("/*", cors({ /* ... */ }));

app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/myroute", async (c) => { /* ... */ });

Deno.serve(app.fetch);
```

### **2. Erweitere API Gateway**
```typescript
// /lib/api-gateway.ts

export const EDGE_FUNCTIONS = {
  // ... existing
  NEUEFUNC: 'scriptony-NEUEFUNC',
} as const;

const ROUTE_MAP: Record<string, string> = {
  // ... existing
  '/myroute': EDGE_FUNCTIONS.NEUEFUNC,
};
```

### **3. Deploy**
```
Supabase Dashboard → Edge Functions
→ Create: "scriptony-NEUEFUNC"
→ Copy code
→ Deploy
```

### **4. Use**
```typescript
// Frontend - AUTOMATISCH geroutet!
const data = await apiGet('/myroute', token);
```

**FERTIG!** ✅

---

## 🐛 TROUBLESHOOTING

### **Function nicht erreichbar (404)**
```bash
# Check: Function deployed?
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-projects/health

# If 404:
→ Function nicht deployed
→ Name falsch (case-sensitive!)
→ Check Supabase Dashboard → Edge Functions
```

### **Unauthorized (401)**
```typescript
// Check: Token korrekt?
import { getAuthToken } from './lib/auth/getAuthToken';
const token = await getAuthToken();
console.log('Token:', token);

// Token sollte nicht leer sein
// Wenn leer → User nicht eingeloggt
```

### **API Gateway routet falsch**
```typescript
// Check Routing
import { ROUTE_MAP } from './lib/api-gateway';
console.log(ROUTE_MAP);

// Check ob Route existiert
// Falls nicht → ROUTE_MAP erweitern
```

### **CORS Error**
```typescript
// Check: CORS in Function aktiviert?
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// WICHTIG: cors MUSS vor allen anderen routes sein!
```

---

## 📊 VERGLEICH: MONOLITH vs. MICROSERVICES

| Aspekt | Monolith | Microservices |
|--------|----------|---------------|
| **File Size** | 1900+ Zeilen | ~500 Zeilen each |
| **Deploy Time** | 2-5 Min | 30-60 Sek |
| **Deploy Risk** | Hoch (alles kaputt) | Niedrig (nur 1 Service) |
| **Debugging** | Schwer | Einfach |
| **Independence** | Keine | Komplett |
| **Scalability** | Begrenzt | Unbegrenzt |
| **Rollback** | Alles | Nur betroffene Function |
| **Cold Start** | Langsam | Schnell |

---

## 🎯 NÄCHSTE SCHRITTE

### **Phase 1: Deploy Functions (JETZT!)**
- [ ] Deploy alle 5 Functions
- [ ] Test Health Checks
- [ ] Test API Gateway

### **Phase 2: Frontend Integration**
- [ ] Update API calls zu Gateway
- [ ] Remove monolith URLs
- [ ] Test alle Features

### **Phase 3: Deprecate Monolith (SPÄTER)**
- [ ] Alle Routes migriert
- [ ] Monolith löschen
- [ ] Clean up

---

## 🎉 FERTIG!

Du hast jetzt:
- ✅ 5 standalone Edge Functions
- ✅ Automatic API Gateway Routing
- ✅ Template Engine integriert
- ✅ Unabhängige Deployments
- ✅ Easy erweiterbar

**Neue Function hinzufügen = 3 Schritte!** 🚀

**Timeline Fix deployen = NUR Timeline Function!** ⚡

**AI Update deployen = NUR Assistant Function!** 🤖

---

## 📚 RESOURCES

- **Architecture**: `/MULTI_FUNCTION_ARCHITECTURE.md`
- **API Gateway**: `/lib/api-gateway.ts`
- **Template Engine**: `/TEMPLATE_ENGINE_ARCHITECTURE.md`
- **Timeline V2 Deploy**: `/DEPLOY_TIMELINE_V2_EDGE_FUNCTION.md`

**Ready to deploy? Let's go! 🚀**
