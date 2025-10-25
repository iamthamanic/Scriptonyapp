# 🔍 MIGRATION COVERAGE ANALYSIS

## ❓ DEINE FRAGEN

1. **Soll ich die alte Edge Function stehen lassen und neue parallel deployen?**
2. **Sind in der Monolith-Function noch Sachen, für die wir keine neue Function haben?**
3. **Haben wir an alle Sachen gedacht?**

---

## 📊 KOMPLETTE ANALYSE: WAS IST WO?

### **AKTUELLER MONOLITH: make-server-3b52693b**

```typescript
// /supabase/functions/server/index.tsx

✅ Health Check
   → /make-server-3b52693b/health

✅ Projects CRUD
   → GET    /make-server-3b52693b/projects
   → POST   /make-server-3b52693b/projects
   → DELETE /make-server-3b52693b/projects/:id

✅ Worlds CRUD
   → GET    /make-server-3b52693b/worlds
   → POST   /make-server-3b52693b/worlds

✅ Timeline Hierarchy
   → GET    /make-server-3b52693b/projects/:projectId/acts
   (Returns full hierarchy: Acts → Sequences → Scenes → Shots)

✅ Timeline Routes (via mounted route files)
   → /make-server-3b52693b/acts/*              (routes-acts.tsx)
   → /make-server-3b52693b/sequences/*         (routes-sequences.tsx)
   → /make-server-3b52693b/scenes/*            (routes-scenes.tsx)
   → /make-server-3b52693b/shots/*             (routes-shots.tsx)

✅ Project Initialization
   → /make-server-3b52693b/projects/*          (routes-projects-init.tsx)
   (POST /projects/:projectId/init-three-act)

✅ AI Chat (MINIMAL)
   → /make-server-3b52693b/ai/*                (routes-ai-minimal.tsx)
   → /make-server-3b52693b/conversations/*
   → /make-server-3b52693b/rag/*

✅ Storage
   → GET /make-server-3b52693b/storage/usage

✅ Debug Routes
   → /make-server-3b52693b/debug/*             (routes-debug.tsx)

✅ Helper Functions
   → getUserIdFromAuth()
   → getUserOrganizations()
   → getOrCreateUserOrganization()
```

### **ZUSÄTZLICHE ROUTE FILES (nicht im Index gemounted)**

```typescript
// EXISTIEREN, aber NICHT in index.tsx eingebunden:

❌ routes-characters.tsx
   → createCharactersRoutes()
   → Characters CRUD
   → NOT MOUNTED!

❌ routes-episodes.tsx
   → createEpisodesRoutes()
   → Episodes CRUD (für Series)
   → NOT MOUNTED!

❌ routes-worlds.tsx
   → createWorldsRoutes()
   → Worlds CRUD (duplicate?)
   → NOT MOUNTED!
```

---

## 🎯 COVERAGE VERGLEICH

| Feature | Monolith | Neue Functions | Status |
|---------|----------|----------------|--------|
| **Projects CRUD** | ✅ index.tsx | ✅ scriptony-projects | ✅ COVERED |
| **Project Init** | ✅ routes-projects-init | ✅ scriptony-timeline-v2 | ✅ COVERED |
| **Timeline Hierarchy** | ✅ index.tsx | ✅ scriptony-timeline-v2 | ✅ COVERED |
| **Acts CRUD** | ✅ routes-acts | ✅ scriptony-timeline (old) | ✅ COVERED |
| **Sequences CRUD** | ✅ routes-sequences | ✅ scriptony-timeline (old) | ✅ COVERED |
| **Scenes CRUD** | ✅ routes-scenes | ✅ scriptony-timeline (old) | ✅ COVERED |
| **Shots CRUD** | ✅ routes-shots | ✅ scriptony-timeline (old) | ✅ COVERED |
| **Worlds CRUD** | ✅ index.tsx | ✅ scriptony-worldbuilding | ✅ COVERED |
| **Characters CRUD** | ❌ routes-characters (NOT MOUNTED!) | ✅ scriptony-worldbuilding | ✅ COVERED |
| **Episodes CRUD** | ❌ routes-episodes (NOT MOUNTED!) | ❌ KEINE FUNCTION | ⚠️ NOT COVERED |
| **AI Chat** | ✅ routes-ai-minimal | ✅ scriptony-assistant | ✅ COVERED |
| **AI Settings** | ✅ routes-ai-minimal | ✅ scriptony-assistant | ✅ COVERED |
| **Conversations** | ✅ routes-ai-minimal | ✅ scriptony-assistant | ✅ COVERED |
| **RAG** | ✅ routes-ai-minimal | ✅ scriptony-assistant | ✅ COVERED |
| **Storage Usage** | ✅ index.tsx | ❌ KEINE FUNCTION | ⚠️ NOT COVERED |
| **Debug Routes** | ✅ routes-debug | ❌ KEINE FUNCTION | ⚠️ NOT COVERED |
| **Auth (Signup)** | ❌ NICHT IM MONOLITH | ❌ KEINE FUNCTION | ⚠️ NOT COVERED |
| **Organization Mgmt** | ✅ index.tsx (helpers) | ❌ KEINE FUNCTION | ⚠️ NOT COVERED |
| **Gym** | ❌ NICHT EXISTENT | ✅ scriptony-gym | ✅ NEW FEATURE |

---

## ⚠️ FEHLENDE COVERAGE

### **1. EPISODES (Series Support)**
```
STATUS: Routes existieren (routes-episodes.tsx)
        Aber NICHT im Monolith gemounted
        Keine neue Function erstellt

RISIKO: Niedrig - Feature wird aktuell nicht genutzt
LÖSUNG: Später zu scriptony-timeline-v2 hinzufügen
```

### **2. STORAGE USAGE**
```
STATUS: Route existiert im Monolith
        Keine neue Function erstellt

RISIKO: Mittel - SettingsPage nutzt das!
LÖSUNG: Zu scriptony-auth oder scriptony-projects hinzufügen
```

### **3. DEBUG ROUTES**
```
STATUS: Route existiert im Monolith
        Keine neue Function erstellt

RISIKO: Niedrig - Nur für Development
LÖSUNG: Kann in jeder Function implementiert werden
```

### **4. ORGANIZATION MANAGEMENT**
```
STATUS: Helper Functions im Monolith
        Keine neue Function erstellt

RISIKO: Hoch - Wird bei Signup/Project-Creation genutzt!
LÖSUNG: scriptony-auth erstellen (empfohlen!)
```

### **5. AUTH (Signup/Organization Creation)**
```
STATUS: Nicht im Monolith (nur GoTrue)
        Aber Organisation Creation fehlt!

RISIKO: Hoch - Signup Flow benötigt das!
LÖSUNG: scriptony-auth erstellen (DRINGEND!)
```

---

## 🚨 KRITISCHE DEPENDENCIES

### **Organization Creation**
```typescript
// AKTUELL: Im Monolith (index.tsx)
async function getOrCreateUserOrganization(userId: string)

// WIRD GENUTZT VON:
✅ POST /projects → Erstellt Organization wenn nötig
✅ Signup Flow → Muss Organization erstellen

// PROBLEM:
Wenn Monolith abgeschaltet → Organization Creation bricht!

// LÖSUNG:
scriptony-auth MUSS diese Funktion haben!
```

### **Storage Usage**
```typescript
// AKTUELL: Im Monolith
GET /make-server-3b52693b/storage/usage

// WIRD GENUTZT VON:
✅ SettingsPage.tsx → Zeigt Storage Verbrauch

// PROBLEM:
Wenn Monolith abgeschaltet → Settings Page bricht!

// LÖSUNG:
Zu scriptony-projects oder scriptony-auth verschieben
```

---

## ✅ MIGRATION STRATEGIE (3 OPTIONEN)

### **OPTION 1: PARALLEL BETRIEB (SICHER!) ✅ EMPFOHLEN**

```
PHASE 1: Deploy neue Functions
─────────────────────────────────
1. Deploy scriptony-projects
2. Deploy scriptony-timeline-v2
3. Deploy scriptony-worldbuilding
4. Deploy scriptony-assistant
5. Deploy scriptony-gym

→ Monolith bleibt ONLINE!
→ Neue Functions laufen PARALLEL!

PHASE 2: Test neue Functions
─────────────────────────────────
1. Test Health Checks
2. Test API Gateway Routing
3. Test einzelne Endpoints
4. Vergleiche Responses (alt vs. neu)

→ Wenn Fehler → Rollback zu Monolith!

PHASE 3: Frontend Switch (schrittweise)
─────────────────────────────────────────
1. Projects Page → neue Function
2. Timeline Page → neue Function
3. Worldbuilding Page → neue Function
4. AI Chat → neue Function
5. Gym → neue Function

→ Feature für Feature umstellen!
→ Bei Fehler → Zurück zu Monolith Route!

PHASE 4: Fehlende Features deployen
─────────────────────────────────────────
1. Deploy scriptony-auth (Organization + Storage)
2. Update API Gateway
3. Test Signup Flow
4. Test Settings Page

PHASE 5: Monolith abschalten
─────────────────────────────────
→ Erst wenn ALLE Features migriert sind!
→ Erst wenn ALLES getestet ist!
→ Monolith löschen
```

**VORTEILE:**
- ✅ Kein Risiko
- ✅ Schrittweise Umstellung
- ✅ Jederzeit Rollback möglich
- ✅ Zeit für Testing

**NACHTEILE:**
- ⏰ Langsamer
- 💾 Beide Functions laufen parallel (doppelte Kosten?)

---

### **OPTION 2: BIG BANG (RISKANT!) ⚠️**

```
1. Deploy ALLE neuen Functions
2. Deploy scriptony-auth (fehlende Features)
3. Schalte Monolith AB
4. Hoffe alles läuft 😅

RISIKO: HOCH!
→ Wenn was fehlt → App bricht!
→ Schwer zu debuggen
```

**VORTEILE:**
- ⚡ Schnell
- 🎯 Klarer Cut

**NACHTEILE:**
- 🚨 Hohes Risiko
- 😱 Wenn Fehler → PANIK!
- 🐛 Schwer zu debuggen

---

### **OPTION 3: HYBRID (MITTEL) ⚖️**

```
PHASE 1: Deploy kritische Functions + scriptony-auth
─────────────────────────────────────────────────────
1. scriptony-projects
2. scriptony-auth (Organization + Storage!)
3. scriptony-timeline-v2

→ Test intensiv!

PHASE 2: Deploy Rest
─────────────────────
4. scriptony-worldbuilding
5. scriptony-assistant
6. scriptony-gym

PHASE 3: Frontend Switch
─────────────────────────
→ Alle Pages auf einmal umstellen

PHASE 4: Monolith abschalten
─────────────────────────────
→ Nach 1-2 Wochen Testing
```

**VORTEILE:**
- ⚖️ Balance Risk/Speed
- ✅ Kritische Features zuerst

**NACHTEILE:**
- ⏰ Immer noch mehrere Phasen
- 🎯 Mehr Koordination nötig

---

## 🎯 MEINE EMPFEHLUNG

### **PARALLEL BETRIEB (Option 1)!**

```
✅ Monolith bleibt online (Fallback)
✅ Neue Functions parallel deployed
✅ API Gateway routet zu neuen Functions
✅ Schrittweise Frontend Migration
✅ Erst wenn ALLES läuft → Monolith löschen
```

**WARUM?**
- Du arbeitest in Figma Make (kein lokales Setup)
- Rollback ist einfach (API Gateway umschalten)
- Zeit für Testing
- Kein Stress

---

## 📋 DEPLOYMENT CHECKLIST (Parallel Betrieb)

### **PHASE 1: Deploy Neue Functions**

```
□ scriptony-projects deployen
  → Test: curl .../scriptony-projects/health
  → Test: GET /projects

□ scriptony-worldbuilding deployen
  → Test: curl .../scriptony-worldbuilding/health
  → Test: GET /worlds, GET /characters

□ scriptony-timeline-v2 deployen
  → Test: curl .../scriptony-timeline-v2/health
  → Test: GET /nodes

□ scriptony-assistant deployen
  → Test: curl .../scriptony-assistant/health
  → Test: GET /ai/settings

□ scriptony-gym deployen
  → Test: curl .../scriptony-gym/health
  → Test: GET /exercises
```

### **PHASE 2: Fehlende Features**

```
□ scriptony-auth erstellen mit:
  - Organization Management (getOrCreateUserOrganization)
  - Storage Usage
  - Signup Flow

□ scriptony-auth deployen
  → Test: Organization Creation
  → Test: Storage Usage

□ API Gateway erweitern
  - /signup → scriptony-auth
  - /storage → scriptony-auth
  - /organizations → scriptony-auth
```

### **PHASE 3: Frontend Testing**

```
□ Test Projects Page
  → Nutzt API Gateway
  → Vergleiche mit Monolith Response

□ Test Timeline Page
  → Nutzt API Gateway
  → Vergleiche mit Monolith Response

□ Test Worldbuilding Page
  → Nutzt API Gateway
  → Vergleiche mit Monolith Response

□ Test AI Chat
  → Nutzt API Gateway
  → Vergleiche mit Monolith Response

□ Test Settings Page
  → Storage Usage funktioniert?
```

### **PHASE 4: Produktiv schalten**

```
□ Alle neuen Functions laufen stabil
□ Alle Features getestet
□ Keine Fehler in Logs
□ User Feedback positiv

→ Monolith kann abgeschaltet werden!
```

---

## 🔧 WAS MUSS NOCH ERSTELLT WERDEN?

### **1. scriptony-auth (DRINGEND!)**

```typescript
// /supabase/functions/scriptony-auth/index.ts

Features:
✅ POST   /signup → Custom signup + Organization
✅ GET    /organizations → User's orgs
✅ POST   /organizations → Create org
✅ PUT    /organizations/:id → Update org
✅ GET    /organizations/:id/members → List members
✅ POST   /organizations/:id/members → Invite member
✅ DELETE /organizations/:id/members/:user_id → Remove

✅ GET    /storage/usage → Storage usage
✅ POST   /storage/upload → Upload file

✅ GET    /profile → User profile
✅ PUT    /profile → Update profile
```

### **2. Episodes Support (OPTIONAL)**

```typescript
// SPÄTER: In scriptony-timeline-v2 integrieren

Features:
✅ GET    /episodes
✅ POST   /episodes
✅ PUT    /episodes/:id
✅ DELETE /episodes/:id
```

### **3. Debug Routes (OPTIONAL)**

```typescript
// Kann in jede Function integriert werden

Features:
✅ GET /debug/schema
✅ GET /debug/tables
✅ POST /debug/test-connection
```

---

## 🎯 NÄCHSTE SCHRITTE

### **JETZT:**

1. **Ich erstelle scriptony-auth** mit allen fehlenden Features
2. **Deployment Checklist** abarbeiten
3. **Parallel Betrieb** starten
4. **Testing** durchführen
5. **Monolith abschalten** (später)

### **SOLL ICH STARTEN?**

Option 1: **scriptony-auth erstellen** (fehlende Features abdecken)
Option 2: **Nur die 5 Functions deployen** (Monolith läuft weiter)
Option 3: **Kompletten Deployment Guide** erstellen

**Was willst du?** 🤔

---

## 📊 ZUSAMMENFASSUNG

```
AKTUELL IM MONOLITH:
✅ Projects, Worlds → COVERED (neue Functions)
✅ Timeline (Acts/Sequences/Scenes/Shots) → COVERED (neue Functions)
✅ AI Chat → COVERED (scriptony-assistant)
⚠️ Organization Management → NOT COVERED (scriptony-auth fehlt!)
⚠️ Storage Usage → NOT COVERED (scriptony-auth fehlt!)
⚠️ Episodes → NOT COVERED (später zu Timeline hinzufügen)

STRATEGIE:
✅ Parallel Betrieb (Monolith + neue Functions)
✅ scriptony-auth für fehlende Features
✅ Schrittweise Frontend Migration
✅ Monolith erst löschen wenn ALLES läuft

RISIKO:
✅ Niedrig - Monolith ist Fallback
✅ Zeit für Testing
✅ Keine Breaking Changes
```

**Ready?** 🚀
