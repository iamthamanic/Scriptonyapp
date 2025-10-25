# 🚀 DEPLOYMENT GUIDE: 6 Edge Functions via Supabase Dashboard

## 📋 ÜBERSICHT

Du deployest jetzt **6 Edge Functions** parallel zum Monolith:

```
✅ scriptony-projects       → Projects CRUD
✅ scriptony-timeline-v2    → Timeline (Acts/Sequences/Scenes/Shots) + Templates
✅ scriptony-worldbuilding  → Worlds + Characters
✅ scriptony-assistant      → AI Chat (Conversations, RAG, MCP)
✅ scriptony-gym            → Creative Gym Exercises
✅ scriptony-auth           → Auth, Organizations, Storage, Profile ← NEU!
```

**WICHTIG:** Monolith bleibt ONLINE als Fallback!

---

## 🎯 DEPLOYMENT STRATEGIE

### **PARALLEL BETRIEB**

```
┌─────────────────────────────────────────┐
│         make-server-3b52693b            │
│           (MONOLITH)                    │
│         BLEIBT ONLINE! ✅               │
└─────────────────────────────────────────┘
              ↓ (Fallback)
              
┌─────────────────────────────────────────┐
│         API Gateway                     │
│    (routet zu neuen Functions)          │
└─────────────────────────────────────────┘
              ↓
              
┌──────────────┬──────────────┬──────────────┐
│  scriptony-  │  scriptony-  │  scriptony-  │
│  projects    │  timeline-v2 │  worldbuil-  │
│              │              │  ding        │
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┐
│  scriptony-  │  scriptony-  │  scriptony-  │
│  assistant   │  gym         │  auth        │
└──────────────┴──────────────┴──────────────┘
```

**VORTEILE:**
- ✅ Monolith als Fallback bei Problemen
- ✅ Schrittweise Testing möglich
- ✅ Jederzeit Rollback per API Gateway
- ✅ Keine Breaking Changes

---

## 📦 PHASE 1: ALLE 6 FUNCTIONS DEPLOYEN

### **WICHTIG: Reihenfolge beachten!**

```
1. scriptony-auth          ← ZUERST! (Organization Management)
2. scriptony-projects      ← Braucht Auth für Organizations
3. scriptony-timeline-v2   ← Braucht Projects
4. scriptony-worldbuilding
5. scriptony-assistant
6. scriptony-gym
```

---

## 🔐 FUNCTION 1: scriptony-auth (KRITISCH!)

### **Warum zuerst?**
```
✅ Organization Creation → Wird von Projects gebraucht!
✅ Storage Usage → Wird von Settings Page gebraucht!
✅ Signup Flow → Muss funktionieren!
```

### **Deployment:**

1. **Supabase Dashboard öffnen**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Edge Functions → New Function**
   ```
   Name: scriptony-auth
   ```

3. **Code einfügen**
   ```
   Kopiere KOMPLETTEN Code aus:
   /supabase/functions/scriptony-auth/index.ts
   
   Einfügen in Dashboard Editor
   ```

4. **Deploy klicken**
   ```
   "Deploy Function" Button
   
   Warten bis Status: "Active"
   ```

5. **Health Check testen**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth/health
   
   # Erwartete Response:
   {
     "status": "ok",
     "service": "scriptony-auth",
     "database": "connected",
     "timestamp": "2025-01-..."
   }
   ```

### **Routes:**
```
✅ POST   /signup
✅ POST   /create-demo-user
✅ GET    /profile
✅ PUT    /profile
✅ GET    /organizations
✅ GET    /organizations/:id
✅ POST   /organizations
✅ PUT    /organizations/:id
✅ DELETE /organizations/:id
✅ GET    /organizations/:id/members
✅ POST   /organizations/:id/members
✅ DELETE /organizations/:id/members/:user_id
✅ GET    /storage/usage
```

---

## 📁 FUNCTION 2: scriptony-projects

### **Deployment:**

1. **New Function**
   ```
   Name: scriptony-projects
   ```

2. **Code einfügen**
   ```
   Kopiere Code aus:
   /supabase/functions/scriptony-projects/index.ts
   ```

3. **Deploy**

4. **Health Check**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-projects/health
   ```

### **Routes:**
```
✅ GET    /projects
✅ POST   /projects
✅ GET    /projects/:id
✅ PUT    /projects/:id
✅ DELETE /projects/:id
✅ GET    /projects/:id/stats
```

---

## 🎬 FUNCTION 3: scriptony-timeline-v2

### **Deployment:**

1. **New Function**
   ```
   Name: scriptony-timeline-v2
   ```

2. **Code einfügen**
   ```
   Kopiere Code aus:
   /supabase/functions/scriptony-timeline-v2/index.ts
   ```

3. **Deploy**

4. **Health Check**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-timeline-v2/health
   ```

### **Routes:**
```
✅ GET    /nodes
✅ POST   /nodes
✅ PUT    /nodes/:id
✅ DELETE /nodes/:id
✅ POST   /nodes/:id/children
✅ POST   /projects/:projectId/init
✅ GET    /templates
✅ GET    /templates/:id
```

---

## 🌍 FUNCTION 4: scriptony-worldbuilding

### **Deployment:**

1. **New Function**
   ```
   Name: scriptony-worldbuilding
   ```

2. **Code einfügen**
   ```
   Kopiere Code aus:
   /supabase/functions/scriptony-worldbuilding/index.ts
   ```

3. **Deploy**

4. **Health Check**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-worldbuilding/health
   ```

### **Routes:**
```
✅ GET    /worlds
✅ POST   /worlds
✅ GET    /worlds/:id
✅ PUT    /worlds/:id
✅ DELETE /worlds/:id
✅ GET    /characters
✅ POST   /characters
✅ GET    /characters/:id
✅ PUT    /characters/:id
✅ DELETE /characters/:id
```

---

## 🤖 FUNCTION 5: scriptony-assistant

### **Deployment:**

1. **New Function**
   ```
   Name: scriptony-assistant
   ```

2. **Code einfügen**
   ```
   Kopiere Code aus:
   /supabase/functions/scriptony-assistant/index.ts
   ```

3. **Deploy**

4. **Health Check**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-assistant/health
   ```

### **Routes:**
```
✅ GET    /ai/settings
✅ PUT    /ai/settings
✅ POST   /ai/settings/validate-key
✅ GET    /conversations
✅ POST   /conversations
✅ GET    /conversations/:id
✅ DELETE /conversations/:id
✅ POST   /conversations/:id/messages
✅ GET    /rag/documents
✅ POST   /rag/sync
✅ GET    /rag/queue
```

---

## 💪 FUNCTION 6: scriptony-gym

### **Deployment:**

1. **New Function**
   ```
   Name: scriptony-gym
   ```

2. **Code einfügen**
   ```
   Kopiere Code aus:
   /supabase/functions/scriptony-gym/index.ts
   ```

3. **Deploy**

4. **Health Check**
   ```bash
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-gym/health
   ```

### **Routes:**
```
✅ GET    /exercises
✅ POST   /exercises
✅ GET    /exercises/:id
✅ PUT    /exercises/:id
✅ DELETE /exercises/:id
✅ GET    /categories
✅ GET    /stats
```

---

## ✅ PHASE 2: API GATEWAY AKTUALISIEREN

### **Warum?**
```
Frontend nutzt API Gateway für Routing
→ Gateway muss wissen wo welche Route liegt!
```

### **Was tun?**

Die API Gateway Datei ist bereits vorbereitet in:
```
/lib/api-gateway.ts
```

**NICHTS ZU TUN!** ✅

Das Gateway routet automatisch zu den neuen Functions:
```typescript
const ROUTE_MAP: Record<string, string> = {
  '/projects': 'scriptony-projects',
  '/nodes': 'scriptony-timeline-v2',
  '/worlds': 'scriptony-worldbuilding',
  '/characters': 'scriptony-worldbuilding',
  '/ai/settings': 'scriptony-assistant',
  '/conversations': 'scriptony-assistant',
  '/exercises': 'scriptony-gym',
  '/signup': 'scriptony-auth',        // ← NEU!
  '/profile': 'scriptony-auth',       // ← NEU!
  '/organizations': 'scriptony-auth', // ← NEU!
  '/storage': 'scriptony-auth',       // ← NEU!
};
```

---

## 🧪 PHASE 3: TESTING

### **Health Checks (ALLE!)**

```bash
# 1. Auth
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth/health

# 2. Projects
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-projects/health

# 3. Timeline
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-timeline-v2/health

# 4. Worldbuilding
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-worldbuilding/health

# 5. Assistant
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-assistant/health

# 6. Gym
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-gym/health
```

**ALLE müssen "status": "ok" zurückgeben!**

### **Frontend Testing**

1. **Signup testen**
   ```
   AuthPage → Neuen User erstellen
   → Checken ob Organization erstellt wurde
   ```

2. **Projects testen**
   ```
   ProjectsPage → Neues Projekt erstellen
   → Checken ob in richtiger Organization
   ```

3. **Timeline testen**
   ```
   TimelinePage → Project öffnen
   → 3-Act Structure initialisieren
   → Acts/Sequences/Scenes erstellen
   ```

4. **Worldbuilding testen**
   ```
   WorldbuildingPage → World erstellen
   → Character erstellen
   ```

5. **AI Chat testen**
   ```
   ScriptonyAssistant → API Key setzen
   → Conversation starten
   → Message senden
   ```

6. **Gym testen**
   ```
   CreativeGymPage → Exercises laden
   → Exercise starten
   ```

7. **Settings testen**
   ```
   SettingsPage → Storage Usage checken
   → Profile Update
   ```

---

## 🔍 TROUBLESHOOTING

### **Problem: Health Check gibt 404**

```bash
# Check ob Function deployed ist:
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions

# Status muss "Active" sein!
```

### **Problem: Health Check gibt 500**

```bash
# Logs checken:
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions/scriptony-xxx/logs

# Wahrscheinlich:
- Supabase ENV Vars fehlen
- Datenbank Tabellen fehlen
```

### **Problem: "Unauthorized"**

```bash
# Frontend sendet falschen Token
# Check in DevTools → Network → Headers

# Muss sein:
Authorization: Bearer eyJhbG...

# NICHT:
Authorization: Bearer YOUR_ANON_KEY
```

### **Problem: "Organization not found"**

```bash
# User hat keine Organization
# Lösung: Signup erneut durchführen
# Oder manuell Organization erstellen via scriptony-auth
```

### **Problem: Frontend nutzt alte Routes**

```bash
# API Gateway routet noch zum Monolith
# Check /lib/api-gateway.ts

# Sicherstellen dass ROUTE_MAP korrekt ist
```

---

## 📊 DEPLOYMENT CHECKLIST

### **PHASE 1: Deploy Functions**

```
□ scriptony-auth deployed
  □ Health Check OK
  □ POST /signup funktioniert
  □ GET /storage/usage funktioniert

□ scriptony-projects deployed
  □ Health Check OK
  □ GET /projects funktioniert

□ scriptony-timeline-v2 deployed
  □ Health Check OK
  □ GET /nodes funktioniert

□ scriptony-worldbuilding deployed
  □ Health Check OK
  □ GET /worlds funktioniert

□ scriptony-assistant deployed
  □ Health Check OK
  □ GET /ai/settings funktioniert

□ scriptony-gym deployed
  □ Health Check OK
  □ GET /exercises funktioniert
```

### **PHASE 2: Testing**

```
□ Signup Flow
  □ Neuer User erstellt
  □ Organization automatisch erstellt
  □ Login funktioniert

□ Projects
  □ Project erstellen
  □ Project laden
  □ Project löschen

□ Timeline
  □ 3-Act Init funktioniert
  □ Acts erstellen
  □ Sequences erstellen
  □ Scenes erstellen

□ Worldbuilding
  □ World erstellen
  □ Character erstellen

□ AI Chat
  □ API Key setzen
  □ Conversation erstellen
  □ Message senden

□ Gym
  □ Exercises laden
  □ Exercise starten

□ Settings
  □ Storage Usage angezeigt
  □ Profile Update
```

### **PHASE 3: Production Ready**

```
□ Alle Health Checks grün
□ Alle Frontend Features funktionieren
□ Keine Errors in Logs
□ Performance OK (< 500ms Response Time)
□ User Feedback positiv

→ Monolith kann abgeschaltet werden!
```

---

## 🎯 ROLLBACK PLAN

### **Wenn was schiefgeht:**

1. **API Gateway auf Monolith umschalten**
   ```typescript
   // /lib/api-gateway.ts
   
   // TEMPORÄR: Alle Routes zu Monolith
   const ROUTE_MAP: Record<string, string> = {
     '*': 'make-server-3b52693b',
   };
   ```

2. **Frontend neu deployen**
   ```
   Figma Make Desktop → Refresh
   ```

3. **Problem analysieren**
   ```
   Logs checken in Supabase Dashboard
   Frontend Console checken
   Network Tab checken
   ```

4. **Fix deployen**
   ```
   Function im Dashboard updaten
   Oder API Gateway wieder aktivieren
   ```

---

## 📈 MONITORING

### **Nach Deployment überwachen:**

```
1. Supabase Dashboard → Functions
   → Invocations Count
   → Error Rate
   → Response Time

2. Browser Console
   → Keine Errors
   → API Calls erfolgreich

3. User Feedback
   → Alles funktioniert?
   → Performance OK?
```

---

## 🚀 NEXT STEPS NACH ERFOLGREICHER MIGRATION

### **1. Monolith abschalten**
```
Wenn ALLE Tests grün:
→ make-server-3b52693b löschen
→ Alte Routes aus Code entfernen
```

### **2. Performance Optimierung**
```
→ Caching hinzufügen
→ Database Indexes optimieren
→ Response Sizes reduzieren
```

### **3. Features erweitern**
```
→ Episodes Support (zu scriptony-timeline-v2)
→ Team Invites (zu scriptony-auth)
→ Advanced Permissions (zu scriptony-auth)
```

---

## 📝 ZUSAMMENFASSUNG

### **WAS DU MACHST:**

```
1. ✅ 6 Edge Functions im Supabase Dashboard deployen
2. ✅ Health Checks testen
3. ✅ Frontend testen
4. ✅ Monolith bleibt als Fallback
5. ✅ Später Monolith abschalten
```

### **WARUM SICHER:**

```
✅ Parallel Betrieb (Monolith + neue Functions)
✅ API Gateway kann umschalten
✅ Schrittweise Testing
✅ Jederzeit Rollback möglich
```

### **ERWARTETE DEPLOYMENT ZEIT:**

```
⏱️ Function 1 (scriptony-auth):        ~5-10 Min
⏱️ Function 2 (scriptony-projects):    ~5 Min
⏱️ Function 3 (scriptony-timeline-v2): ~5 Min
⏱️ Function 4 (scriptony-worldbuilding): ~5 Min
⏱️ Function 5 (scriptony-assistant):   ~5 Min
⏱️ Function 6 (scriptony-gym):         ~5 Min
⏱️ Testing:                            ~30 Min

TOTAL: ~1 Stunde
```

---

## ✅ READY TO DEPLOY?

**CHECKLISTE VORHER:**

```
□ Supabase Dashboard Login OK
□ Project ID bekannt
□ Alle 6 Function Files bereit
□ Zeit für Testing eingeplant
□ Backup vom Monolith gemacht (falls nötig)
```

**START:**

1. **scriptony-auth deployen** (ZUERST!)
2. **Restliche 5 Functions deployen**
3. **Health Checks durchführen**
4. **Frontend testen**
5. **Feiern!** 🎉

---

**Los geht's!** 🚀
