# 🏗️ PHASE 2 PLAN - MULTI-FUNCTION MIT GYM

## 🎯 START: NACHDEM SHOT BUG GEFIXT IST

---

## 📊 WAS WIRD GEBAUT

### **5 EDGE FUNCTIONS:**

```
1. scriptony-projects      → Projects CRUD
2. scriptony-timeline      → Acts, Sequences, Scenes, Shots
3. scriptony-worldbuilding → Worlds, Characters
4. scriptony-ai            → AI Chat, RAG, MCP Tools
5. scriptony-gym           → Creative Gym Features ← NEU!
```

---

## 🗓️ TIMELINE (4-5 STUNDEN VERTEILT ÜBER TAGE)

### **TAG 1: PROJECTS & TIMELINE (2h)**

**Ich erstelle:**
```
/supabase/functions/scriptony-projects/index.ts
/supabase/functions/scriptony-timeline/index.ts
/DEPLOY_GUIDE_PROJECTS.md
/DEPLOY_GUIDE_TIMELINE.md
```

**Du:**
- Reviewst die Functions
- Testest lokal (optional)
- Bereit für Deploy

---

### **TAG 2: WORLDBUILDING & AI (1.5h)**

**Ich erstelle:**
```
/supabase/functions/scriptony-worldbuilding/index.ts
/supabase/functions/scriptony-ai/index.ts
/DEPLOY_GUIDE_WORLDBUILDING.md
/DEPLOY_GUIDE_AI.md
```

**Du:**
- Reviewst die Functions
- Bereit für Deploy

---

### **TAG 3: GYM FUNCTION (1.5h)**

**Ich erstelle:**
```
/supabase/functions/scriptony-gym/index.ts
/supabase/migrations/013_creative_gym_tables.sql
/DEPLOY_GUIDE_GYM.md
```

**Database Schema:**
```sql
-- Gym Profiles (Level, XP, Streak)
CREATE TABLE gym_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Challenges (Prompt Forge, Style Lock, etc.)
CREATE TABLE gym_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'prompt', 'style', 'constraint'
  difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Challenge Progress
CREATE TABLE gym_user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  challenge_id UUID REFERENCES gym_challenges(id) NOT NULL,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submission TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Achievements (First Challenge, 7 Day Streak, etc.)
CREATE TABLE gym_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requirement JSONB, -- { "type": "streak", "days": 7 }
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Achievements
CREATE TABLE gym_user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES gym_achievements(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
```

**Du:**
- Reviewst Function & Schema
- Bereit für Deploy

---

### **TAG 4: FRONTEND MIGRATION (1h)**

**Ich erstelle:**
```
/lib/api-gateway-v2.ts (mit allen 5 Functions)
/MIGRATION_GUIDE_FRONTEND.md
```

**Was sich ändert:**
```typescript
// VORHER (Monolith):
import { apiGet, apiPost } from './lib/api-client';

// NACHHER (Multi-Function):
import { apiGet, apiPost } from './lib/api-gateway';

// API Calls bleiben GLEICH!
apiGet('/projects', token);      // → scriptony-projects
apiGet('/acts', token);           // → scriptony-timeline
apiGet('/worlds', token);         // → scriptony-worldbuilding
apiGet('/conversations', token);  // → scriptony-ai
apiGet('/gym/profile', token);    // → scriptony-gym
```

**Du:**
- Kein Code-Change nötig! (API Gateway routet automatisch)
- Optional: Frontend Tests

---

### **TAG 5: DEPLOYMENT (1h)**

**Schrittweise:**

```
1. Deploy scriptony-projects
   → Test: ProjectsPage funktioniert?
   ✅ Ja → Weiter
   ❌ Nein → Fix

2. Deploy scriptony-timeline
   → Test: Timeline funktioniert?
   ✅ Ja → Weiter
   ❌ Nein → Fix

3. Deploy scriptony-worldbuilding
   → Test: Worldbuilding funktioniert?
   ✅ Ja → Weiter
   ❌ Nein → Fix

4. Deploy scriptony-ai
   → Test: AI Chat funktioniert?
   ✅ Ja → Weiter
   ❌ Nein → Fix

5. Deploy scriptony-gym
   → Test: Creative Gym funktioniert?
   ✅ Ja → Weiter
   ❌ Nein → Fix

6. Deprecate Monolith (make-server-3b52693b)
   → Optional: Löschen oder als Backup behalten
```

---

## 🎯 WAS DU DANN HAST

### **VORHER (Monolith):**
```
make-server-3b52693b (1900 Zeilen)
└── Alles drin (Projects, Timeline, Worlds, AI, etc.)

Problem: Shot Bug Fix → Alle Routes neu deployen → 404 in Projects
```

### **NACHHER (Multi-Function):**
```
scriptony-projects      (300 Zeilen)
scriptony-timeline      (800 Zeilen)
scriptony-worldbuilding (400 Zeilen)
scriptony-ai            (600 Zeilen)
scriptony-gym           (300 Zeilen)

Shot Bug Fix → NUR scriptony-timeline deployen → Alles andere läuft! ✅
```

---

## 📊 GYM FEATURES NACH MIGRATION

### **CreativeGymPage.tsx - VORHER:**
```typescript
// Hardcoded Mock-Daten
const level = 1;
const xp = 0;
const streak = 0;
const challenges = [{ id: "1", title: "Prompt Forge", ... }];
```

### **CreativeGymPage.tsx - NACHHER:**
```typescript
// Echte Daten aus scriptony-gym!
import { apiGet, apiPost } from '../lib/api-gateway';

const { profile } = await apiGet('/gym/profile', token);
// { level: 3, xp: 250, streak: 5 }

const { challenges } = await apiGet('/gym/challenges', token);
// [{ id: "...", title: "Prompt Forge", status: "completed" }, ...]

const { achievements } = await apiGet('/gym/achievements', token);
// [{ id: "...", title: "First Challenge", unlocked: true }, ...]
```

---

## ✅ VORTEILE

### **1. DEPLOYMENT ISOLATION**
```
Shot Bug Fix:
VORHER: Deploy Monolith → 404 in Projects
NACHHER: Deploy Timeline → Alles andere läuft ✅
```

### **2. CODE WARTBARKEIT**
```
VORHER: 1900 Zeilen in einer Datei
NACHHER: 5 kleine Dateien (300-800 Zeilen)
```

### **3. TEAM-ARBEIT**
```
VORHER: Merge Conflicts (alle in einer Datei)
NACHHER: Keine Conflicts (unterschiedliche Dateien)
```

### **4. FEATURES**
```
VORHER: Gym = Mock-Daten (hardcoded)
NACHHER: Gym = Echte Daten (Database, Level, XP, Achievements) ✅
```

### **5. ZUKUNFT**
```
Serie Template:
VORHER: Monolith erweitern (2000 → 2500 Zeilen)
NACHHER: Nutzt scriptony-timeline (keine Änderung!) ✅

Buch Template:
VORHER: Monolith erweitern (2500 → 3000 Zeilen)
NACHHER: Nutzt scriptony-timeline (keine Änderung!) ✅
```

---

## 🎯 START SIGNAL

**Wenn Phase 1 fertig ist, sag mir:**

**"Shot Bug gefixt! Ready für Phase 2!"**

**DANN:**
1. Ich erstelle alle 5 Functions
2. Ich erstelle Gym Database Schema
3. Ich erstelle Deploy Guides
4. Du deployest schrittweise
5. Du testest
6. Done! ✅

---

## ⏱️ GESAMTZEIT

```
Phase 1 (Monolith Deploy):     5 Minuten   ✅ JETZT
Phase 2 (Multi-Function):      4-5 Stunden  ⏳ NÄCHSTE WOCHE

Verteilt über:
Tag 1: Projects + Timeline      (2h)
Tag 2: Worldbuilding + AI       (1.5h)
Tag 3: Gym Function + Schema    (1.5h)
Tag 4: Frontend Migration       (1h)
Tag 5: Deployment + Testing     (1h)

Total: ~7 Stunden (über 5 Tage)
Pro Tag: 1-2 Stunden
```

---

## 💡 WICHTIG

**Phase 1 MUSS fertig sein bevor wir Phase 2 starten!**

```
✅ Shot Bug gefixt
✅ Monolith deployed
✅ App funktioniert

→ DANN Phase 2 starten!
```

**JETZT:** Focus auf Phase 1! 🚀
