# ✅ TIMELINE DEPLOY CHECKLIST

## 🎯 STATUS: READY TO DEPLOY!

---

## ✅ WAS FERTIG IST:

### **BACKEND:**
- [x] Migration 008: Acts & Shots Tabellen
- [x] Migration 009: Sequences Tabelle
- [x] Migration 008_009_COMBINED.sql ausgeführt ✨
- [x] RLS Policies aktiv
- [x] Reorder Functions erstellt
- [x] routes-acts.tsx (GET, POST, PUT, DELETE, Reorder)
- [x] routes-sequences.tsx (GET, POST, PUT, DELETE, Reorder)
- [x] routes-shots.tsx (GET, POST, PUT, DELETE, Reorder)
- [x] Routes im index.tsx importiert ✨

### **FRONTEND:**
- [x] FilmTimeline.tsx Component
- [x] 4-Level Hierarchie (Act → Sequence → Scene → Shot)
- [x] 3D-Layer-Effekt mit transform3d
- [x] Collapse/Expand auf allen Levels
- [x] Zoom Controls (5 Stufen)
- [x] Shot Cards mit 4-Spalten Layout
- [x] Mobile Responsive (vertikal!)
- [x] Mock-Daten für sofortigen Test
- [x] ProjectsPage umgebaut (Timeline statt Liste)

---

## 🚀 WAS JETZT PASSIERT:

### **SCHRITT 1: SERVER DEPLOYEN**
```bash
supabase functions deploy server
```

**DEPLOYED:**
- ✅ Acts Routes → `/make-server-3b52693b/acts`
- ✅ Sequences Routes → `/make-server-3b52693b/sequences`
- ✅ Shots Routes → `/make-server-3b52693b/shots`

### **SCHRITT 2: APP TESTEN**
1. App öffnen
2. Projects wählen
3. Projekt auswählen
4. #Storyboard Timeline Section
5. **🎬 TIMELINE LÄUFT!**

---

## 🎮 WAS FUNKTIONIERT (Nach Deploy):

### **MIT MOCK-DATEN:**
✅ Timeline wird angezeigt
✅ Acts/Sequences/Scenes/Shots sind sichtbar
✅ Collapse/Expand funktioniert
✅ Zoom Controls funktionieren
✅ Shot Details sind vollständig
✅ Mobile View funktioniert

### **NOCH NICHT (Braucht echte Daten):**
❌ Create New Act/Sequence/Scene/Shot
❌ Edit vorhandene Items
❌ Delete Items
❌ Drag & Drop Reorder
❌ Laden von echten DB-Daten

---

## 🔄 NÄCHSTE SCHRITTE (Nach Deploy):

### **PHASE 1: CREATE FUNCTIONS** (1-2h)
Aktiviere die "Add" Buttons:
- POST /acts → Neuen Act erstellen
- POST /sequences → Neue Sequence erstellen
- POST /scenes → Neue Scene erstellen
- POST /shots → Neuen Shot erstellen

**Frontend Changes:**
- Add Dialogs mit Forms
- API Integration
- Optimistic UI Updates

### **PHASE 2: EDIT & DELETE** (1-2h)
Bearbeiten & Löschen ermöglichen:
- PUT /acts/:id, PUT /sequences/:id, etc.
- DELETE /acts/:id, DELETE /sequences/:id, etc.

**Frontend Changes:**
- Edit Dialogs
- Delete Confirmations
- Optimistic Updates

### **PHASE 3: DRAG & DROP** (2-3h)
Reorder via Drag & Drop:
- react-dnd Integration
- Drag Handles
- Drop Zones
- Reorder API Calls

**Frontend Changes:**
- DragPreview Components
- DropTarget Components
- Optimistic Reordering

### **PHASE 4: DETAIL VIEWS** (1-2h)
Vollständige Detail-Ansichten:
- Act Detail Dialog
- Sequence Detail Dialog
- Scene Detail Dialog (mit Characters, etc.)
- Shot Detail Dialog (mit Camera Settings, etc.)

### **PHASE 5: ADVANCED FEATURES** (Optional)
- Timeline Export (PDF/JSON)
- Scene Preview Images
- Character Avatars in Scenes
- Collaborative Editing (Real-time Updates)
- Version History
- Templates (3-Act, 5-Act, Hero's Journey, etc.)

---

## 📊 AKTUELLE ARCHITEKTUR:

```
┌─────────────────────────────────────────┐
│ FRONTEND (React + TypeScript)          │
│                                         │
│  ProjectsPage.tsx                       │
│    └─ FilmTimeline.tsx                  │
│         ├─ Act Cards (Collapse)         │
│         ├─ Sequence Cards (Collapse)    │
│         ├─ Scene Cards (Collapse)       │
│         └─ Shot Cards (4-Column)        │
│                                         │
│  API Calls:                             │
│    - GET /acts?project_id=xxx           │
│    - GET /sequences/:actId              │
│    - GET /scenes?project_id=xxx         │
│    - GET /shots/:sceneId                │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│ BACKEND (Supabase Edge Functions)      │
│                                         │
│  index.tsx                              │
│    ├─ routes-acts.tsx                   │
│    ├─ routes-sequences.tsx              │
│    ├─ routes-shots.tsx                  │
│    └─ routes-scenes.tsx (existiert)     │
│                                         │
│  Endpoints:                             │
│    ✅ GET /acts?project_id=xxx          │
│    ✅ POST /acts                        │
│    ✅ PUT /acts/:id                     │
│    ✅ DELETE /acts/:id                  │
│    ✅ POST /acts/reorder                │
│    ✅ (gleiches für sequences/shots)    │
└─────────────────────────────────────────┘
                    ↕️
┌─────────────────────────────────────────┐
│ DATABASE (PostgreSQL + RLS)             │
│                                         │
│  Tables:                                │
│    ✅ acts                              │
│    ✅ sequences                         │
│    ✅ scenes (erweitert)                │
│    ✅ shots                             │
│                                         │
│  Functions:                             │
│    ✅ reorder_acts_in_project()         │
│    ✅ reorder_sequences_in_act()        │
│    ✅ reorder_scenes_in_sequence()      │
│    ✅ reorder_shots_in_scene()          │
│                                         │
│  RLS Policies:                          │
│    ✅ View (alle User der Org)          │
│    ✅ Manage (Editor/Admin/Owner)       │
└─────────────────────────────────────────┘
```

---

## 🎯 DEPLOY COMMAND:

```bash
supabase functions deploy server
```

**WARTE AUF:**
```
✅ Deployed function server (version xxx)
```

**DANN:**
```
App öffnen → Projects → Timeline → 🎬 FERTIG!
```

---

## ✅ READY! 🚀

Alles ist vorbereitet!

**NÄCHSTER BEFEHL:**
```bash
supabase functions deploy server
```

**GO! GO! GO!** 💪
