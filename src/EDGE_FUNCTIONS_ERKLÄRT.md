# 🏗️ EDGE FUNCTIONS ARCHITEKTUR ERKLÄRT

## ❓ DEINE FRAGE:
"Wie sollten wir Edge Functions aufteilen? Ehrlich gesagt keine ahnung, was würdest du sagen? Und warum?"

---

## 🎯 DREI OPTIONEN

### **OPTION A: FEATURE-BASIERT (4 Functions)**

```
scriptony-projects      → Projects CRUD (alle Templates)
scriptony-timeline      → Acts, Sequences, Scenes, Shots (alle Templates)
scriptony-worldbuilding → Worlds, Characters
scriptony-ai            → AI Chat, RAG, Tools
```

**WIE ES FUNKTIONIERT:**
```typescript
// Frontend:
apiPost('/shots', { sceneId: '123', cameraAngle: 'medium' });
  ↓
// API Gateway erkennt "/shots" → routet zu scriptony-timeline
  ↓
// scriptony-timeline/index.ts:
app.post('/shots', async (c) => {
  const body = await c.req.json();
  
  // Speichert Shot (egal ob Film, Serie, Buch)
  const shot = await supabase.from('shots').insert(body);
  
  return c.json({ shot });
});
```

**VORTEILE:**
- ✅ Nur 4 Functions = einfach!
- ✅ Template-Logic im Frontend (wo sie hingehört)
- ✅ Backend ist "dumb" (speichert nur Daten)
- ✅ Neue Template? → Nur Frontend ändern!
- ✅ Wenig Code-Duplikation

**NACHTEILE:**
- ⚠️ Timeline Function kann groß werden (Acts+Seqs+Scenes+Shots)
- ⚠️ Aber: Immer noch kleiner als jetziger Monolith!

---

### **OPTION B: TEMPLATE-BASIERT (5+ Functions)**

```
scriptony-projects      → Project CRUD + Template Selection
scriptony-film          → Film-spezifische Features
scriptony-series        → Serien-spezifische Features
scriptony-book          → Buch-spezifische Features
scriptony-theater       → Theater-spezifische Features
scriptony-ai            → AI Chat
```

**WIE ES FUNKTIONIERT:**
```typescript
// Frontend (Film):
apiPost('/film/shots', { sceneId: '123', cameraAngle: 'medium' });
  ↓
// API Gateway erkennt "/film" → routet zu scriptony-film
  ↓
// scriptony-film/index.ts:
app.post('/shots', async (c) => {
  const body = await c.req.json();
  
  // Film-spezifische Validierung
  if (!body.cameraAngle) {
    return c.json({ error: 'cameraAngle required for film!' }, 400);
  }
  
  const shot = await supabase.from('shots').insert(body);
  return c.json({ shot });
});

// Frontend (Buch):
apiPost('/book/paragraphs', { sceneId: '123', povCharacterId: 'char-1' });
  ↓
// API Gateway erkennt "/book" → routet zu scriptony-book
  ↓
// scriptony-book/index.ts:
app.post('/paragraphs', async (c) => {
  const body = await c.req.json();
  
  // Buch-spezifische Validierung
  if (!body.povCharacterId) {
    return c.json({ error: 'POV required for book!' }, 400);
  }
  
  const shot = await supabase.from('shots').insert({
    ...body,
    template_data: { povCharacterId: body.povCharacterId }
  });
  return c.json({ shot });
});
```

**VORTEILE:**
- ✅ Klare Trennung pro Template
- ✅ Template-spezifische Validierung im Backend
- ✅ Kleine Functions (Film ≠ Serie ≠ Buch)

**NACHTEILE:**
- ❌ VIELE Functions (5+ wenn mehr Templates kommen)
- ❌ Code-Duplikation (Shots-Logic in jeder Function!)
- ❌ Frontend muss wissen welche Function für welches Template
- ❌ Neues Template = neue Function deployen
- ❌ Wartungs-Overhead

---

### **OPTION C: HYBRID (6 Functions)**

```
scriptony-projects      → Projects CRUD
scriptony-core          → Shared Logic (Acts, Sequences, Scenes)
scriptony-film          → Film Shots + Camera Details
scriptony-series        → Serie Episodes + Seasons
scriptony-worldbuilding → Worlds, Characters
scriptony-ai            → AI Chat
```

**WIE ES FUNKTIONIERT:**
```typescript
// Shared Route (alle Templates):
apiGet('/acts?projectId=123');
  ↓ scriptony-core
  
// Film-spezifisch:
apiPost('/film/shots', { cameraAngle: 'medium' });
  ↓ scriptony-film

// Buch-spezifisch:
apiPost('/book/chapters', { povCharacterId: 'char-1' });
  ↓ scriptony-book
```

**VORTEILE:**
- ✅ Shared Logic nicht dupliziert
- ✅ Template-Spezifik isoliert
- ✅ Gute Balance

**NACHTEILE:**
- ⚠️ Komplexer (mehr Functions als A, weniger als B)
- ⚠️ Routing-Logic komplizierter

---

## 📊 VERGLEICH FÜR SCRIPTONY

### **SZENARIO: Shot Bug Fix (wie JETZT)**

#### **OPTION A (Feature-basiert):**
```
1. Fix shots route in scriptony-timeline
2. Deploy NUR scriptony-timeline
3. Test Shots
4. Done ✅

Affected: Timeline
Unaffected: Projects, Worlds, AI
Time: 5 minutes
```

#### **OPTION B (Template-basiert):**
```
1. Fix shots route in scriptony-film
2. Deploy scriptony-film
3. Test Film Shots
4. Fix shots route in scriptony-series (gleicher Bug!)
5. Deploy scriptony-series
6. Test Serie Shots
7. Done ✅

Affected: Film, Serie
Unaffected: Buch, Theater, Projects, Worlds, AI
Time: 10 minutes (Code-Duplikation!)
```

#### **OPTION C (Hybrid):**
```
1. Fix shots route in scriptony-film
2. Deploy scriptony-film
3. Test Shots
4. Done ✅

Affected: Film only
Unaffected: Serie, Core, Projects, Worlds, AI
Time: 5 minutes
```

---

### **SZENARIO: Neue Feature "Storyboard Generator" (alle Templates)**

#### **OPTION A:**
```
1. Add /storyboard route to scriptony-timeline
2. Deploy scriptony-timeline
3. Works for Film, Serie (automatisch!)
4. Buch/Theater ignorieren feature
5. Done ✅

Functions geändert: 1
Time: 10 minutes
```

#### **OPTION B:**
```
1. Add /storyboard to scriptony-film
2. Add /storyboard to scriptony-series
3. Buch/Theater brauchen es nicht
4. Deploy film + series (beide!)
5. Done ✅

Functions geändert: 2
Time: 20 minutes (Code-Duplikation!)
```

#### **OPTION C:**
```
1. Add /storyboard to scriptony-core
2. Deploy scriptony-core
3. Works for alle!
4. Done ✅

Functions geändert: 1
Time: 10 minutes
```

---

### **SZENARIO: Serie Template hinzufügen (nach MVP)**

#### **OPTION A:**
```
Frontend:
1. Create SeriesTemplate.tsx
2. Use existing /acts, /sequences, /scenes, /shots routes
3. Done ✅

Backend:
- Nothing! Routes work already ✅

Functions geändert: 0
Time: 2 hours (nur Frontend)
```

#### **OPTION B:**
```
Frontend:
1. Create SeriesTemplate.tsx
2. Call /series/* routes

Backend:
1. Create scriptony-series function
2. Implement /acts, /sequences, /scenes, /shots
3. Copy paste from scriptony-film (Code-Duplikation!)
4. Deploy new function
5. Update API Gateway routing
6. Done ✅

Functions geändert: 1 neu + Gateway
Time: 4 hours (Frontend + Backend!)
```

#### **OPTION C:**
```
Frontend:
1. Create SeriesTemplate.tsx
2. Use /acts, /sequences (from core)
3. Use /series/episodes (new route)

Backend:
1. Add /episodes route to scriptony-series
2. Deploy scriptony-series
3. Done ✅

Functions geändert: 1 neu
Time: 3 hours
```

---

## 🎯 MEINE EMPFEHLUNG: **OPTION A (Feature-basiert)**

### **WARUM?**

```
1. MVP = nur Film
   → Option A: Film nutzt scriptony-timeline ✅
   → Option B: Film nutzt scriptony-film ✅
   → Gleich!

2. Serie Template hinzufügen:
   → Option A: Nur Frontend ändern! ✅✅✅
   → Option B: Neue Function + Backend-Code ❌
   → WINNER: Option A!

3. Buch Template hinzufügen:
   → Option A: Frontend ändern, /shots optional nutzen ✅
   → Option B: Neue Function scriptony-book ❌
   → WINNER: Option A!

4. Bug Fix:
   → Option A: 1 Function ändern ✅
   → Option B: Mehrere Functions (wenn Bug in Shared Logic) ❌
   → WINNER: Option A!

5. Code Maintenance:
   → Option A: 4 Functions, wenig Duplikation ✅
   → Option B: 5-10 Functions, viel Duplikation ❌
   → WINNER: Option A!
```

---

## 🏗️ KONKRET FÜR SCRIPTONY

### **EMPFOHLENE ARCHITEKTUR:**

```
1. scriptony-projects (300 LOC)
   Routes:
   - GET    /projects
   - POST   /projects (mit type: 'film' | 'series' | 'book')
   - GET    /projects/:id
   - PUT    /projects/:id
   - DELETE /projects/:id
   - POST   /projects/:id/init (3-Act Setup)

2. scriptony-timeline (800 LOC)
   Routes:
   - GET    /acts
   - POST   /acts
   - PUT    /acts/:id
   - DELETE /acts/:id
   
   - GET    /sequences
   - POST   /sequences
   - PUT    /sequences/:id
   - DELETE /sequences/:id
   
   - GET    /scenes
   - POST   /scenes
   - PUT    /scenes/:id
   - DELETE /scenes/:id
   
   - GET    /shots/:sceneId
   - POST   /shots
   - PUT    /shots/:id
   - DELETE /shots/:id

3. scriptony-worldbuilding (400 LOC)
   Routes:
   - GET    /worlds
   - POST   /worlds
   - GET    /worlds/:id
   - PUT    /worlds/:id
   - DELETE /worlds/:id
   
   - GET    /characters
   - POST   /characters
   - GET    /characters/:id
   - PUT    /characters/:id
   - DELETE /characters/:id

4. scriptony-ai (600 LOC)
   Routes:
   - GET    /ai/settings
   - POST   /ai/settings
   - PUT    /ai/settings/:id
   
   - GET    /conversations
   - POST   /conversations
   - DELETE /conversations/:id
   
   - GET    /conversations/:id/messages
   - POST   /conversations/:id/messages
   
   - POST   /ai/chat (MCP Tools!)
   
   - GET    /rag/documents
   - POST   /rag/sync
```

### **TEMPLATE-LOGIC IM FRONTEND:**

```typescript
// FilmTemplate.tsx
function createShot() {
  return apiPost('/shots', {
    sceneId,
    shotNumber: '1A',
    cameraAngle: 'medium',    // ← Film-spezifisch
    cameraMovement: 'static',
    lens: '50mm'
  });
}

// SeriesTemplate.tsx (SPÄTER)
function createShot() {
  return apiPost('/shots', {
    sceneId,
    shotNumber: '1A',
    cameraAngle: 'medium',    // ← Gleich wie Film!
    cameraMovement: 'static',
    episodeId: episode.id     // ← Serie-spezifisch
  });
}

// BookTemplate.tsx (SPÄTER)
function createParagraph() {
  return apiPost('/shots', {  // ← Gleiche Route!
    sceneId,
    shotNumber: '1',
    description: paragraphText,
    template_data: {           // ← Buch-spezifisch in JSON
      povCharacterId: char.id,
      mood: 'dark',
      timestamp: '2024-01-15'
    }
  });
}
```

---

## ✅ ZUSAMMENFASSUNG

### **OPTION A = BESTE WAHL!**

**Gründe:**
1. ✅ **Einfachheit:** Nur 4 Functions
2. ✅ **Flexibilität:** Neue Templates = nur Frontend
3. ✅ **Wartbarkeit:** Wenig Code-Duplikation
4. ✅ **Deployment:** Isoliert aber nicht fragmentiert
5. ✅ **Zukunftssicher:** Skaliert mit 10+ Templates

**PERFEKT FÜR:**
- MVP mit nur Film ✅
- Später Serie/Buch/Theater ✅
- Ständige Feature-Entwicklung ✅
- Kleine Teams ✅

---

## 🚀 NÄCHSTER SCHRITT

**SOLL ICH:**
1. ✅ **Option A implementieren?** (4 Feature-basierte Functions)
2. ⏳ Shot Bug JETZT fixen (Monolith), dann Migration?
3. 🤔 Andere Meinung?

**SAG MIR!** 🎬
