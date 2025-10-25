# 🏗️ EDGE FUNCTIONS - VOLLSTÄNDIGE ARCHITEKTUR

## ❓ DEINE FRAGE:
"Wieso nur 4 Edge Functions? Wieso ist da keine für Gym und für Present dabei?"

---

## 📊 ANALYSE: GYM & PRESENT

### **1. CREATIVE GYM (CreativeGymPage.tsx)**

**AKTUELLER STATUS:**
```typescript
// Hardcoded Mock-Daten:
const level = 1;
const xp = 0;
const streak = 0;
const challenges = [{ id: "1", title: "Prompt Forge", ... }];

// KEIN Backend-Call!
// Alles Frontend-Only
```

**WAS ES TUT:**
- Zeigt Level, XP, Streak
- Challenges (Prompt Forge, Style Lock, Constraint Bench)
- Art Forms (Comedy, Songwriting, Visual Arts, etc.)
- Achievements

**BRAUCHT ES BACKEND?**
```
JETZT: ❌ Nein (alles hardcoded)

SPÄTER: ✅ JA!
- User Level/XP speichern
- Challenges tracken (completed, in-progress)
- Streak berechnen (daily challenges)
- Achievements freischalten
- Challenge Submissions speichern
```

---

### **2. PRESENT MODE (PresentPage.tsx)**

**AKTUELLER STATUS:**
```typescript
// EmptyState - "In Entwicklung"
// KEIN Code, nur Placeholder
```

**WAS ES TUN SOLL:**
- Projekte präsentieren (Slideshow?)
- Welten zeigen (Visual Showcase?)
- Charaktere präsentieren
- Export für Präsentationen

**BRAUCHT ES BACKEND?**
```
JETZT: ❌ Nein (noch nicht implementiert)

SPÄTER: ⚠️ HALB
- Liest bestehende Daten (Projects, Worlds, Characters)
- Nutzt bestehende Edge Functions (scriptony-projects, scriptony-worldbuilding)
- Keine EIGENE Function nötig! (außer spezielle Präsentations-Features)
```

---

## 🎯 ANTWORT AUF DEINE FRAGE

### **WARUM NUR 4 FUNCTIONS?**

```
1. scriptony-projects      → Projects CRUD
2. scriptony-timeline      → Acts, Sequences, Scenes, Shots
3. scriptony-worldbuilding → Worlds, Characters
4. scriptony-ai            → AI Chat, RAG

Present: Nutzt 1, 2, 3 (liest nur Daten!)
Gym: Braucht EIGENE Function (später)!
```

**ICH HABE GYM VERGESSEN!** 😅

---

## ✅ KORRIGIERTE ARCHITEKTUR

### **MVP (Film Template fertig machen):**
```
1. scriptony-projects      → Projects
2. scriptony-timeline      → Timeline
3. scriptony-worldbuilding → Worlds + Characters
4. scriptony-ai            → AI Chat
```

**Gym:** Mock-Daten OK (wird später implementiert)
**Present:** Nutzt bestehende Functions (liest Daten)

---

### **POST-MVP (Serie Template + Features):**
```
1. scriptony-projects      → Projects
2. scriptony-timeline      → Timeline
3. scriptony-worldbuilding → Worlds + Characters
4. scriptony-ai            → AI Chat
5. scriptony-gym           → Creative Gym! ← NEU!
```

**Gym Features:**
- Challenges Management
- User Progress (Level, XP, Streak)
- Achievements System
- Challenge Submissions
- Leaderboards (optional)

---

### **SPÄTER (alle Features):**
```
1. scriptony-projects      → Projects
2. scriptony-timeline      → Timeline
3. scriptony-worldbuilding → Worlds + Characters
4. scriptony-ai            → AI Chat
5. scriptony-gym           → Creative Gym
6. scriptony-present       → Presentation Features (optional!)
```

**Present Features (optional eigene Function):**
- Custom Presentation Layouts
- Export to Powerpoint/PDF
- Public Sharing Links
- Presentation Analytics

**ODER:** Present nutzt einfach bestehende Functions (kein Bedarf für eigene)

---

## 🤔 WAS IST MIT GYM & PRESENT IM MVP?

### **FRAGE AN DICH:**

```
Creative Gym:
□ MVP Critical (muss ins MVP)
□ Post-MVP (kommt nach Film Template)
□ Later (nach Serie/Buch)

Present Mode:
□ MVP Critical
□ Post-MVP
□ Later
```

**Basierend auf deiner Roadmap:**
```
1. Serie Template           ← Prio 1
2. Buch Template           ← Prio 2
3. Version Control         ← Prio 3
4. AI Chat                 ← Prio 4
5. Storyboard Generator    ← Prio 5
6. Script Analysis         ← Prio 6
7. Script Analysis         ← Prio 7
8. Creative Gym            ← Prio 8 🎯
9. Collaboration           ← Prio 9
10. Character Arcs         ← Prio 10
11. Theaterstück           ← Prio 11
12. Präsentation Mode      ← Prio 12 🎯
```

**GYM = Prio 8, PRESENT = Prio 12**

→ **NICHT IM MVP!** ✅

---

## 🎯 EMPFEHLUNG

### **PHASE 1: JETZT (MVP)**
```
Edge Functions:
1. scriptony-projects
2. scriptony-timeline
3. scriptony-worldbuilding
4. scriptony-ai

Gym: Mock-Daten (wie jetzt)
Present: EmptyState (wie jetzt)
```

**WARUM?**
- ✅ Film MVP = Projects + Timeline + Worldbuilding + AI
- ✅ Gym/Present nicht kritisch für MVP
- ✅ Fokus auf Core Features

---

### **PHASE 2: POST-MVP (Serie Template fertig)**
```
Noch keine neue Function!

Gym: Immer noch Mock-Daten
Present: Nutzt bestehende Functions (zeigt Projects/Worlds)
```

**WARUM?**
- ✅ Serie Template wichtiger
- ✅ Gym/Present können warten

---

### **PHASE 3: CREATIVE GYM FEATURE**
```
NEUE Edge Function:
5. scriptony-gym

Routes:
- GET    /gym/profile          → Level, XP, Streak
- GET    /gym/challenges       → Available Challenges
- POST   /gym/challenges/:id/start
- POST   /gym/challenges/:id/submit
- GET    /gym/achievements     → Unlocked Achievements
- POST   /gym/streak           → Update Daily Streak
```

**Frontend:**
```typescript
// CreativeGymPage.tsx
import { apiGet, apiPost } from '../lib/api-gateway';

// Statt Mock-Daten:
const { profile } = await apiGet('/gym/profile', token);
const { challenges } = await apiGet('/gym/challenges', token);

// Level, XP, Streak aus Backend! ✅
```

---

### **PHASE 4: PRESENT MODE FEATURE**
```
OPTION A: Keine eigene Function
- Present nutzt scriptony-projects, scriptony-worldbuilding
- Liest nur Daten, zeigt sie schön an
- Frontend-Only Implementation

OPTION B: Eigene Function (nur wenn spezielle Features nötig)
6. scriptony-present

Routes:
- POST /present/sessions      → Create Presentation Session
- GET  /present/sessions/:id  → Get Presentation Data
- POST /present/export        → Export to PDF/PPTX
- GET  /present/analytics     → View Analytics
```

**ICH EMPFEHLE OPTION A** (kein Backend nötig)

---

## 📊 TIMELINE

```
┌─────────────────────────────────────────────┐
│ WOCHE 1: MVP (4 Functions)                  │
│ - scriptony-projects                        │
│ - scriptony-timeline                        │
│ - scriptony-worldbuilding                   │
│ - scriptony-ai                              │
│                                             │
│ Gym: Mock ✅                                │
│ Present: EmptyState ✅                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ WOCHE 2-3: Serie Template                   │
│ - Keine neue Function!                      │
│ - Template nutzt bestehende Functions       │
│                                             │
│ Gym: Mock ✅                                │
│ Present: EmptyState ✅                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ WOCHE 4-6: Buch Template, Version Control   │
│ - Keine neue Function!                      │
│                                             │
│ Gym: Mock ✅                                │
│ Present: Basic (liest Projects/Worlds) 🆕   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ MONAT 2: Creative Gym Implementation        │
│ - scriptony-gym 🆕                          │
│ - Database Tables (gym_profiles, etc.)      │
│ - Frontend Integration                      │
│                                             │
│ Present: Weiter ausbauen                    │
└─────────────────────────────────────────────┘
```

---

## 🎯 KONKRETE ANTWORT

### **WARUM NUR 4 FUNCTIONS JETZT?**

```
1. scriptony-projects      ✅ Kritisch für MVP
2. scriptony-timeline      ✅ Kritisch für MVP
3. scriptony-worldbuilding ✅ Kritisch für MVP
4. scriptony-ai            ✅ Kritisch für MVP

5. scriptony-gym           ⏳ Prio 8 (nach Serie/Buch)
6. scriptony-present       ⏳ Prio 12 (später)
```

**Gym & Present sind NICHT im MVP!**

Basierend auf deiner Roadmap:
```
MVP = Film Template fertig
→ Projects, Timeline, Worldbuilding, AI

Post-MVP Prio 1-7:
→ Serie, Buch, Version Control, AI Features, Storyboard, Script Analysis

Post-MVP Prio 8:
→ Creative Gym ← DANN scriptony-gym Function!

Post-MVP Prio 12:
→ Present Mode ← DANN ggf. scriptony-present Function
```

---

## ✅ KORRIGIERTE ROADMAP

### **PHASE 1: MVP (4 Functions)**
```
Edge Functions:
1. scriptony-projects
2. scriptony-timeline
3. scriptony-worldbuilding
4. scriptony-ai

Frontend Pages:
✅ ProjectsPage      → scriptony-projects
✅ FilmTimelinePage  → scriptony-timeline
✅ WorldbuildingPage → scriptony-worldbuilding
✅ ScriptonyAssistant → scriptony-ai
✅ SettingsPage      → scriptony-ai
⏸️ CreativeGymPage  → Mock-Daten (OK für jetzt)
⏸️ PresentPage      → EmptyState (OK für jetzt)
```

---

### **PHASE 2: POST-MVP Features (immer noch 4 Functions!)**
```
Serie Template:
- Nutzt scriptony-timeline (gleiche Routes!)

Buch Template:
- Nutzt scriptony-timeline (gleiche Routes!)

Version Control:
- Nutzt scriptony-projects (neue Routes)

AI Features:
- Nutzt scriptony-ai (neue Routes)
```

---

### **PHASE 3: GYM IMPLEMENTATION (5. Function!)**
```
Edge Functions:
5. scriptony-gym 🆕

Database:
- gym_profiles (user_id, level, xp, streak)
- gym_challenges (id, title, description, type)
- gym_user_challenges (user_id, challenge_id, status, submitted_at)
- gym_achievements (id, title, requirement)
- gym_user_achievements (user_id, achievement_id, unlocked_at)

Frontend:
✅ CreativeGymPage → scriptony-gym (echte Daten!)
```

---

### **PHASE 4: PRESENT IMPLEMENTATION (optional 6. Function)**
```
Option A: Keine eigene Function
- PresentPage nutzt scriptony-projects, scriptony-worldbuilding
- Frontend-Only (liest Daten, zeigt sie schön)

Option B: Eigene Function (nur wenn nötig)
6. scriptony-present

Features:
- Custom Presentation Layouts
- Export to PDF/PPTX
- Public Sharing
```

---

## 💡 FAZIT

**DU HAST RECHT GYM & PRESENT ZU ERWÄHNEN!**

**ABER:**
- ✅ MVP = nur 4 Functions (Gym/Present nicht kritisch)
- ✅ Gym = Prio 8 in deiner Roadmap → **scriptony-gym kommt später!**
- ✅ Present = Prio 12 → **scriptony-present ggf. gar nicht nötig**

**KORRIGIERTE ARCHITEKTUR:**

```
JETZT (MVP):
4 Functions (Projects, Timeline, Worldbuilding, AI)

SPÄTER (Post-MVP Prio 8):
5 Functions (+ Gym)

VIEL SPÄTER (Post-MVP Prio 12):
6 Functions (+ Present, optional)
```

---

## ❓ FRAGE AN DICH

**IST GYM WICHTIGER ALS ICH DACHTE?**

```
Wenn JA (Gym ist MVP-kritisch):
→ Ich erstelle scriptony-gym JETZT (5. Function im MVP)
→ Database Schema für Gym
→ Frontend Integration

Wenn NEIN (Gym kann warten):
→ 4 Functions JETZT (wie geplant)
→ Gym = Mock-Daten OK
→ scriptony-gym kommt Prio 8 (nach Serie/Buch)
```

**WAS SAGST DU?** 🎯
