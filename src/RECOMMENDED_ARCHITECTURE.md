# 🏗️ EMPFOHLENE ARCHITEKTUR (basierend auf aktuellem Code)

## 📊 WAS ICH GESEHEN HABE:

### **✅ BEREITS VORHANDEN:**

1. **Template System** (`/components/timeline/templates/`)
   - ✅ TemplateRegistry.ts (5 Templates definiert!)
   - ✅ FilmTemplate.tsx
   - ✅ Types definiert

2. **Database Schema:**
   - ✅ `project_type` ENUM (film, series, short, theater, audio, book, social)
   - ✅ Projects Tabelle mit `type` field

3. **Timeline Structure:**
   - ✅ Acts, Sequences, Scenes, Shots Tabellen
   - ✅ Modular Containers (ContainerAct, ContainerScene, etc.)

4. **Frontend Architektur:**
   - ✅ Template-basierte Components
   - ✅ Shared Container Components

**DU BIST SCHON SEHR GUT VORBEREITET!** 🎉

---

## 🎯 MEINE EMPFEHLUNG

### **ARCHITEKTUR: TEMPLATE-AWARE MONOREPO**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                                                          │
│  Template Selection → Load Template-Specific UI         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         TEMPLATE REGISTRY (Auto-Load)              │ │
│  │  if (project.type === 'film')  → FilmTemplate      │ │
│  │  if (project.type === 'series') → SeriesTemplate   │ │
│  │  if (project.type === 'book')   → BookTemplate     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │      API GATEWAY        │
              │  (Template-Agnostic)    │
              └─────────────────────────┘
                            ▼
    ┌──────────┬──────────┬──────────┬──────────┐
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│Projects ││Timeline ││Worldbldg││Episodes ││   AI    │
│         ││         ││         ││         ││         │
│All Types││Shared   ││Shared   ││Shared   ││Shared   │
│Film     ││Logic    ││(Chars,  ││Logic    ││Tools    │
│Series   ││         ││Worlds)  ││         ││         │
│Book     ││         ││         ││         ││         │
│Theater  ││         ││         ││         ││         │
└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                        ▼
            ┌───────────────────────┐
            │  POSTGRES DATABASE    │
            │                       │
            │  projects (type field)│
            │  acts (shared)        │
            │  sequences (shared)   │
            │  scenes (shared)      │
            │  shots (shared)       │
            │  + template metadata  │
            └───────────────────────┘
```

---

## 🗄️ DATABASE STRATEGIE

### **EMPFEHLUNG: SHARED TABLES + TEMPLATE METADATA**

```sql
-- ✅ BEREITS SO!
CREATE TYPE project_type AS ENUM (
  'film', 'series', 'short', 'theater', 'audio', 'book', 'social'
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  type project_type NOT NULL DEFAULT 'film',
  title TEXT NOT NULL,
  ...
);

-- ✅ SHARED STRUCTURE (alle Templates nutzen!)
CREATE TABLE acts (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  act_number INTEGER,
  title TEXT,
  -- Template-specific via labels!
  -- Film: "Akt 1"
  -- Serie: "Staffel 1"
  -- Buch: "Teil 1"
  ...
);

CREATE TABLE sequences (
  id UUID PRIMARY KEY,
  act_id UUID REFERENCES acts(id),
  sequence_number INTEGER,
  title TEXT,
  -- Template-specific via labels!
  -- Film: "Sequenz 1"
  -- Serie: "Episode 1"
  -- Buch: "Kapitel 1"
  ...
);

CREATE TABLE scenes (
  id UUID PRIMARY KEY,
  sequence_id UUID REFERENCES sequences(id),
  scene_number INTEGER,
  ...
);

CREATE TABLE shots (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  shot_number TEXT,
  
  -- ⭐ TEMPLATE-SPECIFIC FIELDS (optional!)
  camera_angle TEXT,      -- Film, Serie
  camera_movement TEXT,   -- Film, Serie
  lens TEXT,             -- Film, Serie
  storyboard_url TEXT,   -- Film, Serie
  
  pov_character_id UUID, -- Buch
  
  stage_direction TEXT,  -- Theater
  
  -- OR: Use JSONB for template-specific data
  template_data JSONB,
  
  ...
);
```

**WARUM SO?**
- ✅ Eine Tabelle für alles = einfach!
- ✅ Template-spezifische Felder = optional (NULL wenn nicht gebraucht)
- ✅ JSONB für extreme Flexibilität
- ✅ Frontend entscheidet was angezeigt wird (basierend auf template_type)

---

## 🎬 EDGE FUNCTIONS ARCHITEKTUR

### **EMPFEHLUNG: FEATURE-BASIERT (4 Functions)**

```
1. scriptony-projects
   - GET /projects (alle types!)
   - POST /projects (mit type field)
   - PUT /projects/:id
   - DELETE /projects/:id
   - POST /projects/:id/init (3-Act Setup, Template-aware!)

2. scriptony-timeline
   - GET /acts
   - POST /acts (title = template.customLabels.act)
   - GET /sequences
   - POST /sequences (title = template.customLabels.sequence)
   - GET /scenes
   - POST /scenes
   - GET /shots/:sceneId
   - POST /shots (camera_angle nur wenn type=film|series)
   - PUT /shots/:id
   - DELETE /shots/:id

3. scriptony-worldbuilding
   - GET /worlds
   - POST /worlds
   - GET /characters
   - POST /characters

4. scriptony-ai
   - POST /ai/chat (template-aware suggestions!)
   - GET /conversations
   - POST /rag/sync
```

**WARUM NUR 4?**
- ✅ Template-Logic ist **IM FRONTEND** (Template Components!)
- ✅ Backend ist **template-agnostic** (arbeitet mit allen types)
- ✅ Einfacher zu deployen
- ✅ Weniger Duplikation

**Template-Spezifik FRONTEND:**
```typescript
// FilmTemplate.tsx
function createShot(sceneId: string) {
  return apiPost('/shots', {
    sceneId,
    shotNumber: '1',
    cameraAngle: 'medium',  // ← Film-spezifisch!
    cameraMovement: 'static',
  });
}

// BookTemplate.tsx
function createScene(chapterId: string) {
  return apiPost('/scenes', {
    sequenceId: chapterId,
    sceneNumber: '1',
    povCharacterId: selectedCharacter.id, // ← Buch-spezifisch!
  });
}
```

---

## 🎨 FRONTEND STRUKTUR

### **EMPFEHLUNG: TEMPLATE COMPONENTS (bereits angelegt!)**

```
/components/timeline/
  templates/
    TemplateRegistry.ts       ✅ Bereits da!
    FilmTemplate.tsx          ✅ Bereits da!
    SeriesTemplate.tsx        ← TODO
    BookTemplate.tsx          ← TODO
    TheaterTemplate.tsx       ← TODO
    
  containers/
    ContainerAct.tsx          ✅ Shared (alle Templates)
    ContainerSequence.tsx     ✅ Shared (alle Templates)
    ContainerScene.tsx        ✅ Shared (alle Templates)
    ContainerShot.tsx         ✅ Film + Serie only
    
  TimelineView.tsx            ✅ Template-agnostic wrapper
```

**FLOW:**
```typescript
// TimelineView.tsx
function TimelineView({ project }) {
  const template = getTemplate(project.type); // 'film'
  const TemplateComponent = getTemplateComponent(project.type);
  
  return (
    <TemplateComponent
      project={project}
      template={template}
      labels={template.customLabels}
    />
  );
}

// FilmTemplate.tsx
function FilmTemplate({ project, template, labels }) {
  return (
    <>
      <h1>{project.title}</h1>
      {acts.map(act => (
        <ContainerAct
          key={act.id}
          act={act}
          label={labels.act} // "Akt"
          onAddSequence={handleAddSequence}
        >
          {sequences.map(seq => (
            <ContainerSequence
              key={seq.id}
              sequence={seq}
              label={labels.sequence} // "Sequenz"
            >
              {/* Film-specific: Shots */}
              <ShotsList />
            </ContainerSequence>
          ))}
        </ContainerAct>
      ))}
    </>
  );
}

// SeriesTemplate.tsx (später)
function SeriesTemplate({ project, template, labels }) {
  return (
    <>
      <h1>{project.title}</h1>
      {seasons.map(season => ( // seasons = acts!
        <ContainerAct
          key={season.id}
          act={season}
          label={labels.act} // "Staffel"
        >
          {episodes.map(episode => ( // episodes = sequences!
            <ContainerSequence
              key={episode.id}
              sequence={episode}
              label={labels.sequence} // "Episode"
            >
              {/* Serie: Auch Shots wie Film */}
              <ShotsList />
            </ContainerSequence>
          ))}
        </ContainerAct>
      ))}
    </>
  );
}

// BookTemplate.tsx (später)
function BookTemplate({ project, template, labels }) {
  return (
    <>
      <h1>{project.title}</h1>
      {parts.map(part => ( // parts = acts!
        <ContainerAct
          key={part.id}
          act={part}
          label={labels.act} // "Teil"
        >
          {chapters.map(chapter => ( // chapters = sequences!
            <ContainerSequence
              key={chapter.id}
              sequence={chapter}
              label={labels.sequence} // "Kapitel"
            >
              {/* Buch: Szenen ohne Shots! */}
              <ScenesList />
              {/* KEINE ShotsList! */}
            </ContainerSequence>
          ))}
        </ContainerAct>
      ))}
    </>
  );
}
```

---

## 🎯 MVP SCOPE

### **PHASE 1: FILM TEMPLATE MVP** (JETZT!)

```
✅ BEREITS FERTIG:
- Project Creation (Film)
- Acts/Sequences/Scenes Struktur
- Timeline View (basic)
- Characters
- Worlds
- AI Assistant

🚧 BLOCKT JETZT:
- Shot Creation Bug ← FIX THIS FIRST!
- Shot Editing
- Image Upload
- Audio Upload

📋 NACH BUG FIX:
- Shot Card UI verbessern
- Export (Basic PDF)
- Storyboard View (optional)
```

**TIMELINE:**
```
Tag 1: Shot Bug fixen (5 Min)
Tag 2-3: Shot UI verbessern
Tag 4-5: Export implementieren
Tag 6-7: Testing & Polish
→ FILM MVP FERTIG! ✅
```

---

### **PHASE 2: SERIE TEMPLATE** (POST-MVP)

```
1. SeriesTemplate.tsx erstellen
2. Labels anpassen (Staffel, Episode)
3. Multi-Episode Navigation
4. Story Arc Tracking (über Episoden)
5. Export (Serie-spezifisch)
```

**TIMELINE:** 1-2 Wochen

---

### **PHASE 3: BUCH TEMPLATE** (SPÄTER)

```
1. BookTemplate.tsx erstellen
2. KEINE Shots (Shots = optional/NULL)
3. POV Tracking
4. Timeline View (wann spielt was)
5. Export (DOCX, ePub)
```

**TIMELINE:** 1-2 Wochen

---

### **PHASE 4: THEATER TEMPLATE** (SPÄTER)

```
1. TheaterTemplate.tsx erstellen
2. Stage Directions statt Camera Details
3. Props Management
4. Export (Theatrical Script Format)
```

**TIMELINE:** 1 Woche

---

## 🚀 DEPLOYMENT STRATEGIE

### **JETZT (heute):**
```
1. Fix Shot Bug im Monolith (DASHBOARD-DEPLOY-READY.ts)
2. Deploy → Test → Done ✅
3. Film MVP weiter entwickeln
```

### **NÄCHSTE WOCHE:**
```
4. Multi-Function Architektur aufbauen
5. 4 Edge Functions erstellen (projects, timeline, worldbuilding, ai)
6. Frontend API Gateway integrieren
7. Schrittweise migrieren
8. Monolith deprecated
```

### **IN 2-3 WOCHEN:**
```
9. Serie Template implementieren
10. Template-Auswahl UI verbessern
11. Template-spezifische Exports
```

---

## 💡 WARUM DIESE ARCHITEKTUR?

### **✅ VORTEILE:**

1. **Template-Flexibilität:**
   - Neue Templates = neue Component + Registry Entry
   - Kein Backend-Change nötig!

2. **Shared Infrastructure:**
   - Acts/Sequences/Scenes/Shots Tabellen für ALLE Templates
   - Weniger Code, weniger Bugs

3. **Frontend-Driven:**
   - Template-Logic im Frontend (wo sie hingehört!)
   - Backend ist dump (speichert nur Daten)

4. **Skalierbar:**
   - Neue Template? → Neue Component!
   - Neue Feature? → Zu betroffener Edge Function hinzufügen

5. **Deployment-Isolation:**
   - Timeline Bug? → Deploy nur Timeline Function
   - AI Feature? → Deploy nur AI Function
   - Keine gegenseitigen Konflikte

---

## 🎬 ZUSAMMENFASSUNG

### **WAS DU HABEN WIRST:**

```
DATABASE:
- 1 projects Tabelle (type field)
- Shared acts/sequences/scenes/shots Tabellen
- Template-spezifische Felder optional

BACKEND:
- 4 Edge Functions (template-agnostic)
- Auto-Routing via API Gateway
- Clean Separation

FRONTEND:
- Template Components (FilmTemplate, SeriesTemplate, etc.)
- Shared Containers (ContainerAct, etc.)
- Template Registry (Auto-Load)

MVP:
- Film Template FIRST (99% fertig!)
- Serie NEXT (2-3 Wochen)
- Buch/Theater LATER
```

---

## ❓ NÄCHSTE SCHRITTE

**SOLL ICH:**

1. **JETZT Shot Bug fixen?** (5 Min)
   → Deploy Monolith → Film MVP weiter entwickeln

2. **DANN Multi-Function aufbauen?** (nächste Woche)
   → 4 Edge Functions + API Gateway

3. **DANN Serie Template?** (in 2-3 Wochen)
   → SeriesTemplate.tsx + Tests

**ODER:** Andere Prioritäten?

**SAG MIR WAS DU WILLST!** 🚀
