# 🏗️ FINALE ARCHITEKTUR - MIT GYM & PRESENT

## 📊 ALLE PAGES & IHRE BACKEND-NEEDS

```
FRONTEND PAGES:                  BACKEND FUNCTION:          MVP?
─────────────────────────────────────────────────────────────────
HomePage                         (keine)                    ✅
AuthPage                         supabase.auth.*            ✅
ProjectsPage                     scriptony-projects         ✅
FilmTimelinePage                 scriptony-timeline         ✅
WorldbuildingPage                scriptony-worldbuilding    ✅
SettingsPage                     scriptony-ai               ✅
ScriptonyAssistant (AI Chat)     scriptony-ai               ✅
AdminPage                        scriptony-projects         ✅
SuperadminPage                   scriptony-projects         ✅

CreativeGymPage                  scriptony-gym              ❌ Later (Prio 8)
PresentPage                      (nutzt bestehende)         ❌ Later (Prio 12)

ApiTestPage                      (dev only)                 ✅
MigrationPage                    (dev only)                 ✅
UploadPage                       (storage)                  ✅
ResetPasswordPage                supabase.auth.*            ✅
```

---

## 🎯 EDGE FUNCTIONS MAPPING

### **4 CORE FUNCTIONS (MVP):**

```
┌───────────────────────────────────────────────────────────┐
│ 1. scriptony-projects                                     │
├───────────────────────────────────────────────────────────┤
│ Pages: ProjectsPage, AdminPage, SuperadminPage           │
│ Routes:                                                   │
│   GET    /projects                                        │
│   POST   /projects                                        │
│   GET    /projects/:id                                    │
│   PUT    /projects/:id                                    │
│   DELETE /projects/:id                                    │
│   POST   /projects/:id/init                               │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 2. scriptony-timeline                                     │
├───────────────────────────────────────────────────────────┤
│ Pages: FilmTimelinePage                                   │
│ Routes:                                                   │
│   GET    /acts                                            │
│   POST   /acts                                            │
│   PUT    /acts/:id                                        │
│   DELETE /acts/:id                                        │
│                                                           │
│   GET    /sequences                                       │
│   POST   /sequences                                       │
│   PUT    /sequences/:id                                   │
│   DELETE /sequences/:id                                   │
│                                                           │
│   GET    /scenes                                          │
│   POST   /scenes                                          │
│   PUT    /scenes/:id                                      │
│   DELETE /scenes/:id                                      │
│                                                           │
│   GET    /shots/:sceneId                                  │
│   POST   /shots                                           │
│   PUT    /shots/:id                                       │
│   DELETE /shots/:id                                       │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 3. scriptony-worldbuilding                                │
├───────────────────────────────────────────────────────────┤
│ Pages: WorldbuildingPage                                  │
│ Routes:                                                   │
│   GET    /worlds                                          │
│   POST   /worlds                                          │
│   GET    /worlds/:id                                      │
│   PUT    /worlds/:id                                      │
│   DELETE /worlds/:id                                      │
│                                                           │
│   GET    /characters                                      │
│   POST   /characters                                      │
│   GET    /characters/:id                                  │
│   PUT    /characters/:id                                  │
│   DELETE /characters/:id                                  │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 4. scriptony-ai                                           │
├───────────────────────────────────────────────────────────┤
│ Pages: SettingsPage, ScriptonyAssistant                   │
│ Routes:                                                   │
│   GET    /ai/settings                                     │
│   POST   /ai/settings                                     │
│   PUT    /ai/settings/:id                                 │
│                                                           │
│   GET    /conversations                                   │
│   POST   /conversations                                   │
│   DELETE /conversations/:id                               │
│                                                           │
│   GET    /conversations/:id/messages                      │
│   POST   /conversations/:id/messages                      │
│                                                           │
│   POST   /ai/chat           ← MCP Tools!                  │
│                                                           │
│   GET    /rag/documents                                   │
│   POST   /rag/sync                                        │
└───────────────────────────────────────────────────────────┘
```

---

### **POST-MVP FUNCTIONS:**

```
┌───────────────────────────────────────────────────────────┐
│ 5. scriptony-gym (Prio 8 - nach Serie/Buch/AI Features)  │
├───────────────────────────────────────────────────────────┤
│ Pages: CreativeGymPage                                    │
│ Routes:                                                   │
│   GET    /gym/profile          → Level, XP, Streak       │
│   PUT    /gym/profile          → Update Progress         │
│                                                           │
│   GET    /gym/challenges       → All Challenges          │
│   GET    /gym/challenges/:id   → Challenge Details       │
│   POST   /gym/challenges/:id/start                       │
│   POST   /gym/challenges/:id/submit                      │
│   PUT    /gym/challenges/:id/complete                    │
│                                                           │
│   GET    /gym/achievements     → User Achievements       │
│   POST   /gym/achievements/:id/unlock                    │
│                                                           │
│   POST   /gym/streak           → Daily Streak Update     │
│                                                           │
│   GET    /gym/leaderboard      → Optional                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 6. scriptony-present (Prio 12 - optional!)                │
├───────────────────────────────────────────────────────────┤
│ Pages: PresentPage                                        │
│                                                           │
│ OPTION A: Keine eigene Function!                         │
│   → Nutzt scriptony-projects (Projects laden)            │
│   → Nutzt scriptony-worldbuilding (Worlds laden)         │
│   → Frontend rendert Präsentation                        │
│                                                           │
│ OPTION B: Eigene Function (nur wenn spezielle Features)  │
│ Routes:                                                   │
│   POST /present/sessions       → Create Presentation     │
│   GET  /present/sessions/:id   → Get Presentation        │
│   POST /present/export         → Export to PDF/PPTX      │
│   GET  /present/share/:token   → Public Share Link       │
│   GET  /present/analytics      → View Stats              │
└───────────────────────────────────────────────────────────┘
```

---

## 🗓️ DEPLOYMENT ROADMAP

### **WOCHE 1: MVP (4 Functions)**

```
MONTAG:
✅ Deploy Monolith (Shot Bug Fix)
✅ Film MVP weiter entwickeln

DIENSTAG:
□ Erstelle scriptony-projects
□ Erstelle scriptony-timeline

MITTWOCH:
□ Erstelle scriptony-worldbuilding
□ Erstelle scriptony-ai

DONNERSTAG:
□ Frontend Migration (API Gateway)
□ Testing

FREITAG:
□ Deploy scriptony-projects
□ Deploy scriptony-timeline
□ Deploy scriptony-worldbuilding
□ Deploy scriptony-ai
□ Deprecate Monolith ✅

RESULT:
✅ Kein Deployment Chaos mehr!
✅ Film MVP production-ready
```

---

### **WOCHE 2-3: SERIE TEMPLATE**

```
□ SeriesTemplate.tsx erstellen
□ Nutzt bestehende Functions! (keine neue Function)
□ Template Registry erweitern
□ Testing

RESULT:
✅ Serie Template läuft
✅ Nutzt scriptony-timeline (gleiche Routes!)
```

---

### **WOCHE 4-6: BUCH + FEATURES**

```
□ BookTemplate.tsx erstellen
□ Version Control (neue Routes in scriptony-projects)
□ AI Features (neue Routes in scriptony-ai)

RESULT:
✅ Buch Template läuft
✅ Version Control läuft
✅ Immer noch nur 4 Functions!
```

---

### **MONAT 2: CREATIVE GYM**

```
□ Database Schema (gym_profiles, gym_challenges, etc.)
□ Erstelle scriptony-gym Function
□ Frontend Migration (CreativeGymPage)
□ Testing

RESULT:
✅ 5 Functions total
✅ Creative Gym production-ready
```

---

### **MONAT 3+: PRESENT MODE**

```
OPTION A:
□ PresentPage nutzt bestehende Functions
□ Frontend-Only Implementation
□ Keine neue Function! ✅

OPTION B:
□ Erstelle scriptony-present Function
□ Export Features (PDF/PPTX)
□ Public Sharing

RESULT:
✅ Present Mode production-ready
```

---

## 📊 FUNCTION COUNT TIMELINE

```
┌────────────────────────────────────────────┐
│ WOCHE 1 (MVP):                             │
│ Functions: 4                               │
│ - projects, timeline, worldbuilding, ai    │
│                                            │
│ Pages funktionieren:                       │
│ ✅ Projects                                │
│ ✅ Timeline (Film)                         │
│ ✅ Worldbuilding                           │
│ ✅ AI Chat                                 │
│ ⏸️ Gym (Mock-Daten)                       │
│ ⏸️ Present (EmptyState)                   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ MONAT 1 (Serie/Buch):                      │
│ Functions: 4 (gleich!)                     │
│                                            │
│ Pages funktionieren:                       │
│ ✅ Projects (alle Templates!)             │
│ ✅ Timeline (Film, Serie, Buch)           │
│ ✅ Worldbuilding                           │
│ ✅ AI Chat                                 │
│ ⏸️ Gym (Mock-Daten)                       │
│ ⏸️ Present (EmptyState)                   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ MONAT 2 (Creative Gym):                    │
│ Functions: 5 (+1 scriptony-gym)            │
│                                            │
│ Pages funktionieren:                       │
│ ✅ Projects                                │
│ ✅ Timeline                                │
│ ✅ Worldbuilding                           │
│ ✅ AI Chat                                 │
│ ✅ Gym (echte Daten!)                     │
│ ⏸️ Present (nutzt bestehende Functions)   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ MONAT 3+ (Present Mode):                   │
│ Functions: 5 oder 6 (optional)             │
│                                            │
│ Pages funktionieren:                       │
│ ✅ ALLES!                                  │
└────────────────────────────────────────────┘
```

---

## 💡 ZUSAMMENFASSUNG

### **DEINE FRAGE:**
> "Wieso nur 4 Edge Functions? Wieso ist da keine für Gym und für Present dabei?"

### **ANTWORT:**

**GYM:**
- ⏳ **Prio 8** in deiner Roadmap
- 🎯 **Kommt nach:** Serie, Buch, Version Control, AI Features
- ✅ **Wird eigene Function:** scriptony-gym (später!)
- 📝 **JETZT:** Mock-Daten OK (nicht MVP-kritisch)

**PRESENT:**
- ⏳ **Prio 12** in deiner Roadmap
- 🎯 **Kommt nach:** Gym, Collaboration, Character Arcs, Theater
- ⚠️ **Braucht ggf. KEINE eigene Function** (nutzt Projects + Worldbuilding)
- 📝 **JETZT:** EmptyState OK (nicht MVP-kritisch)

---

## ✅ FINALE ENTSCHEIDUNG

**SOLL ICH:**

### **OPTION A: 4 Functions MVP (wie geplant)**
```
JETZT (MVP):
- scriptony-projects
- scriptony-timeline
- scriptony-worldbuilding
- scriptony-ai

Gym: Mock-Daten ✅
Present: EmptyState ✅

SPÄTER (Prio 8):
+ scriptony-gym

VIEL SPÄTER (Prio 12):
+ scriptony-present (optional)
```

---

### **OPTION B: 5 Functions MVP (mit Gym)**
```
JETZT (MVP):
- scriptony-projects
- scriptony-timeline
- scriptony-worldbuilding
- scriptony-ai
- scriptony-gym ← NEU!

Gym: Echte Daten! ✅
Present: EmptyState ✅

Zeit: +2-3 Stunden (Gym Function + Database)
```

---

### **OPTION C: 6 Functions MVP (mit Gym + Present)**
```
JETZT (MVP):
- scriptony-projects
- scriptony-timeline
- scriptony-worldbuilding
- scriptony-ai
- scriptony-gym ← NEU!
- scriptony-present ← NEU!

Gym: Echte Daten! ✅
Present: Echte Features! ✅

Zeit: +4-5 Stunden (beide Functions + Database)
```

---

## 🎯 MEINE EMPFEHLUNG

**OPTION A** (4 Functions MVP)

**WARUM?**
```
✅ Fokus auf Film MVP (Core Features)
✅ Gym/Present nicht kritisch (Prio 8 & 12)
✅ Schnellster Weg zu Production
✅ Weniger Risiko

DANN:
- Film MVP fertig
- Serie Template (nutzt gleiche Functions!)
- Buch Template (nutzt gleiche Functions!)
- Gym Implementation (neue Function wenn Zeit)
```

**ABER:** Wenn Gym WICHTIG ist (häufig genutzt, User-Engagement), dann **Option B**!

---

**WAS MÖCHTEST DU?** 🎯
