# 🏗️ SCRIPTONY ARCHITECTURE DISCOVERY

## 🎯 ZIEL
Richtige Architektur planen BEVOR wir weitermachen!

---

## 📺 TEIL 1: TEMPLATES & PROJECT TYPES

### **Frage 1: Welche Templates gibt es?**
```
Jetzt:
- [ ] Film (3-Akt-Struktur)

Später:
- [ ] Serie (Staffeln → Episoden → ?)
- [ ] Buch (Kapitel → Szenen → ?)
- [ ] Theaterstück (Akte → Szenen → ?)
- [ ] Andere: _____________
```

**WICHTIG:** Welche kommen im MVP, welche später?

---

### **Frage 2: Wie unterscheiden sich die Templates?**

#### **FILM (3-Akt):**
```
Project → Acts (3) → Sequences → Scenes → Shots
```
- Timeline View ✅
- Shots mit Kamera-Details ✅
- Storyboards ✅

#### **SERIE:**
```
Project → Staffeln → Episoden → ? → ? → ?

Frage:
- Hat Serie auch Acts/Sequences/Scenes/Shots?
- Oder komplett andere Struktur?
- Episoden = wie Film? (3-Akte pro Episode?)
- Oder linearer? (Szenen direkt in Episode?)
```

#### **BUCH:**
```
Project → ? → ? → ?

Frage:
- Bücher haben Kapitel, dann?
- Kapitel → Szenen → Absätze?
- Oder Kapitel → Szenen → Shots? (für Visualisierung?)
- Keine Kamera-Details, richtig?
- Was stattdessen? (POV, Zeitlinie, Orte?)
```

#### **THEATERSTÜCK:**
```
Project → Akte → Szenen → ?

Frage:
- Theaterstück = wie Film aber ohne Shots?
- Fokus auf Dialoge & Bühnenanweisungen?
- Bühnenbild statt Shots?
```

---

### **Frage 3: Gemeinsame Features vs Template-Spezifische Features**

#### **GEMEINSAM (alle Templates):**
- [ ] Characters (Charaktere)
- [ ] Worlds (Worldbuilding)
- [ ] Locations (Orte)
- [ ] Timeline View
- [ ] AI Assistant
- [ ] Export (PDF, etc.)
- [ ] Andere: _____________

#### **NUR FILM:**
- [ ] Shots mit Kamera-Details
- [ ] Storyboards
- [ ] Shot-Listen
- [ ] Andere: _____________

#### **NUR SERIE:**
- [ ] Staffeln Management
- [ ] Episoden-Tracking
- [ ] Story-Arcs über Staffeln
- [ ] Andere: _____________

#### **NUR BUCH:**
- [ ] Kapitel-Management
- [ ] POV-Tracking
- [ ] Zeitlinie (wann spielt was)
- [ ] Andere: _____________

#### **NUR THEATERSTÜCK:**
- [ ] Bühnenanweisungen
- [ ] Requisiten-Listen
- [ ] Szenen-Übergänge
- [ ] Andere: _____________

---

## 🗄️ TEIL 2: DATENBANK STRUKTUR

### **Frage 4: Wie speichern wir Templates?**

#### **Option A: Eine Tabelle für alles**
```sql
projects (
  id,
  title,
  template_type ENUM('film', 'series', 'book', 'theater'),
  ...
)

-- Problem: Acts für Serie = Staffeln? Oder separate Tabelle?
```

#### **Option B: Template-spezifische Tabellen**
```sql
-- FILM:
film_projects → acts → sequences → scenes → shots

-- SERIE:
series_projects → seasons → episodes → scenes → shots

-- BUCH:
book_projects → chapters → scenes

-- THEATER:
theater_projects → acts → scenes
```

**Welche Option bevorzugst du?**

---

### **Frage 5: Template-spezifische Felder**

#### **Shots Tabelle (FILM):**
```
✅ camera_angle
✅ camera_movement
✅ lens
✅ storyboard_url
```

#### **Scenes Tabelle:**
```
Frage: Welche Felder sind template-spezifisch?

FILM:
- location (Drehort)
- time_of_day (Tag/Nacht)
- weather

BUCH:
- pov_character (wessen Perspektive?)
- chapter_id (Kapitel-Referenz)
- timeline_timestamp (wann spielt das?)

SERIE:
- episode_id
- season_id
- cross_episode (geht über Episoden?)

THEATER:
- stage_setting (Bühnenbild)
- props (Requisiten)
- lighting (Beleuchtung)
```

**Sollen wir flexible JSON Felder nutzen? Oder separate Tabellen?**

---

## 🎬 TEIL 3: MVP SCOPE

### **Frage 6: Was MUSS ins MVP?**

**Film Template:**
- [ ] Project Creation (Film)
- [ ] 3-Act Structure Setup
- [ ] Sequences Management
- [ ] Scenes Management
- [ ] Shots Management (CREATE + EDIT)
- [ ] Characters Assignment to Shots
- [ ] Image Upload für Shots
- [ ] Audio Upload für Shots
- [ ] Timeline View
- [ ] Export (Basic PDF?)
- [ ] AI Assistant (ScriptonyAssistant)
- [ ] Worldbuilding Integration

**Welche davon sind CRITICAL für MVP?**
**Welche können NACH MVP kommen?**

---

### **Frage 7: Was kommt NACH MVP?**

**Post-MVP Features (Priorität?):**
1. Serie Template
2. Buch Template
3. Theaterstück Template
4. Advanced Export (Final Draft Format)
5. Collaboration (Multi-User)
6. Version Control
7. Storyboard Generator (AI)
8. Script Analysis (AI)
9. Character Arcs Visualization
10. Andere: _____________

**Bitte priorisieren: 1 (zuerst) → 10 (später)**

---

## 🏗️ TEIL 4: EDGE FUNCTIONS ARCHITEKTUR

### **Frage 8: Wie sollten wir Edge Functions aufteilen?**

#### **Option A: Template-basiert**
```
scriptony-projects        → Project CRUD (alle Templates)
scriptony-film-timeline   → Film-spezifische Timeline
scriptony-series-timeline → Serien-spezifische Timeline
scriptony-book-timeline   → Buch-spezifische Timeline
scriptony-theater-timeline → Theater-spezifische Timeline
scriptony-worldbuilding   → Worlds + Characters
scriptony-ai              → AI Chat
```

**Pro:** Template-Features isoliert
**Contra:** Viele Functions, mehr Komplexität

#### **Option B: Feature-basiert (wie vorgeschlagen)**
```
scriptony-projects      → Alle Projects (alle Templates)
scriptony-timeline      → Alle Timeline-Features (alle Templates)
scriptony-worldbuilding → Worlds + Characters
scriptony-ai            → AI Chat
```

**Pro:** Weniger Functions, einfacher
**Contra:** Timeline Function muss alle Templates kennen

#### **Option C: Hybrid**
```
scriptony-projects      → Project CRUD + Template Selection
scriptony-core-timeline → Shared Timeline Logic (Acts, Sequences, Scenes)
scriptony-film          → Film-spezifisch (Shots + Kamera)
scriptony-series        → Serien-spezifisch (Staffeln + Episoden)
scriptony-worldbuilding → Worlds + Characters
scriptony-ai            → AI Chat
```

**Welche Option macht am meisten Sinn für deine Vision?**

---

## 🎨 TEIL 5: FRONTEND STRUKTUR

### **Frage 9: Wie sollte die Timeline UI funktionieren?**

#### **Jetzt:**
```
/components/FilmTimeline.tsx → Monolithisch (1000+ LOC)
```

#### **Besser:**
```
/components/timeline/
  templates/
    FilmTemplate.tsx      → Film-spezifische Logic
    SeriesTemplate.tsx    → Serien-spezifische Logic
    BookTemplate.tsx      → Buch-spezifische Logic
    TheaterTemplate.tsx   → Theater-spezifische Logic
    TemplateRegistry.ts   → Auto-Load based on project.template_type
  
  containers/
    ContainerAct.tsx      → Shared (alle Templates?)
    ContainerSequence.tsx → Shared (Film + Serie?)
    ContainerScene.tsx    → Shared (alle Templates)
    ContainerShot.tsx     → NUR Film + Serie
    ContainerChapter.tsx  → NUR Buch
    ContainerSeason.tsx   → NUR Serie
```

**Ist diese Struktur gut? Änderungen?**

---

### **Frage 10: Template Selection Flow**

**Wann wählt User das Template?**

```
Flow A:
1. "Neues Projekt" → Template wählen (Film/Serie/Buch/Theater)
2. Project erstellen mit template_type
3. Template-spezifische UI laden

Flow B:
1. "Neues Projekt" → Erstmal ohne Template
2. Später Template zuweisen
3. Konvertieren zwischen Templates?

Flow C:
1. Separater Button pro Template ("Neuer Film", "Neue Serie", etc.)
2. Direkt zum Template-spezifischen Setup
```

**Welcher Flow?**

---

## 🔌 TEIL 6: INTEGRATION & EXPORT

### **Frage 11: Export Formate**

**Welche Export-Formate pro Template?**

**Film:**
- [ ] PDF (Simple)
- [ ] Final Draft (.fdx)
- [ ] Fountain (.fountain)
- [ ] Celtx
- [ ] Andere: _____________

**Serie:**
- [ ] Gleiche wie Film + Episoden-Übersicht?
- [ ] Andere: _____________

**Buch:**
- [ ] DOCX (Word)
- [ ] ePub
- [ ] PDF
- [ ] Markdown
- [ ] Andere: _____________

**Theaterstück:**
- [ ] PDF
- [ ] Theatrical Script Format
- [ ] Andere: _____________

---

### **Frage 12: AI Assistant Funktionen**

**Pro Template unterschiedlich?**

**Film:**
- Scene Suggestions
- Dialog Polishing
- Shot List Generation
- Continuity Check

**Serie:**
- Multi-Episode Story Arcs
- Character Development über Staffeln
- Cliffhanger Suggestions

**Buch:**
- Chapter Summaries
- POV Consistency Check
- Pacing Analysis

**Theater:**
- Stage Direction Suggestions
- Dialog Timing

**Sollen alle Templates die gleichen AI Tools nutzen? Oder Template-spezifisch?**

---

## 📊 TEIL 7: PERFORMANCE & SKALIERUNG

### **Frage 13: Wie viele Projects/Scenes/Shots erwartest du?**

**Pro User:**
```
- ___ Projects gleichzeitig
- ___ Scenes pro Project (Durchschnitt)
- ___ Shots pro Scene (Durchschnitt)
- ___ Characters pro Project
```

**Beispiel:**
```
Film: 1 Project, 100 Scenes, 5 Shots/Scene = 500 Shots
Serie: 1 Project, 10 Episoden, 50 Scenes/Episode = 500 Scenes, 2500 Shots
```

**Wichtig für Pagination & Caching!**

---

### **Frage 14: Collaboration Features?**

**MVP:**
- [ ] Single User (nur ich)
- [ ] Multi-User (Team Collaboration)

**Später:**
- [ ] Real-time Collaboration (Google Docs-style)
- [ ] Comments & Feedback
- [ ] Version History
- [ ] Permissions (Writer, Editor, Viewer)

---

## 🎯 TEIL 8: BUSINESS LOGIC

### **Frage 15: Template Switching**

**Kann man Templates nachträglich wechseln?**

```
Beispiel:
User erstellt Film → Merkt "ist eher Serie" → Zu Serie konvertieren?

Oder:
Template-Wahl ist permanent?
```

---

### **Frage 16: Template Inheritance**

**Nutzen Templates gemeinsame Base-Logic?**

```
BaseTemplate (Abstract)
  ├── hasCharacters: true
  ├── hasWorlds: true
  ├── hasTimeline: true
  ├── hasExport: true
  │
  ├─→ FilmTemplate
  │     ├── hasShots: true
  │     ├── hasCameraDetails: true
  │     └── structure: Acts → Sequences → Scenes → Shots
  │
  ├─→ SeriesTemplate
  │     ├── hasSeasons: true
  │     ├── hasEpisodes: true
  │     └── structure: Seasons → Episodes → Scenes → Shots
  │
  ├─→ BookTemplate
  │     ├── hasChapters: true
  │     ├── hasPOV: true
  │     └── structure: Chapters → Scenes
  │
  └─→ TheaterTemplate
        ├── hasStageDirections: true
        └── structure: Acts → Scenes
```

**Macht das Sinn?**

---

## 💡 TEIL 9: QUICK WINS

### **Frage 17: Was blockiert dich JETZT am meisten?**

**Priorisiere:**
- [ ] Shot Bug (nicht erstellen können)
- [ ] Deployment Chaos (404 Errors)
- [ ] Feature-Entwicklung (neue Sachen bauen)
- [ ] Architektur-Unsicherheit (wie weiter?)
- [ ] Performance (zu langsam?)
- [ ] Anderes: _____________

---

### **Frage 18: Was ist NACH Shot-Fix das Wichtigste?**

**Next Priority:**
1. _____________
2. _____________
3. _____________

---

## 🎬 ZUSAMMENFASSUNG

**Bitte beantworte:**

1. **Templates:** Welche kommen ins MVP? (Film only?)
2. **Struktur:** Serie = wie Film? Buch = anders?
3. **Edge Functions:** Template-basiert? Feature-basiert? Hybrid?
4. **MVP Scope:** Was MUSS fertig sein?
5. **Post-MVP:** Was kommt danach? (Priorität!)
6. **Blockiert:** Was nervt JETZT am meisten?

**Dann plane ich die PERFEKTE Architektur!** 🚀
