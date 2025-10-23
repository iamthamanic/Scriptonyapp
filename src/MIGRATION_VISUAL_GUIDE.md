# 📊 VISUAL GUIDE: DATABASE HIERARCHIE

## 🎬 VORHER (Ohne Migration 008+009):

```
Database:
├─ projects ✅
├─ scenes ✅
├─ characters ✅
├─ episodes ✅
└─ worlds ✅

❌ KEINE Acts
❌ KEINE Sequences  
❌ KEINE Shots
```

**PROBLEM:** Scenes haben keine richtige Film-Struktur!

---

## 🎬 NACHHER (Mit Migration 008+009):

```
Database:
├─ projects ✅
│
├─ acts ✨ NEU!
│   └─ Felder: act_number, title, color, order_index
│
├─ sequences ✨ NEU!
│   └─ Felder: sequence_number, title, color, order_index
│   └─ Referenz: act_id → acts
│
├─ scenes ✅ (erweitert)
│   └─ NEU: act_id (optional/legacy)
│   └─ NEU: sequence_id (neue Hierarchie!)
│   └─ NEU: order_index
│
├─ shots ✨ NEU!
│   └─ Felder: shot_number, camera_angle, lens, duration, etc.
│   └─ Referenz: scene_id → scenes
│
├─ characters ✅
├─ episodes ✅
└─ worlds ✅
```

**ERGEBNIS:** Komplette 4-Level Film-Hierarchie! 🎉

---

## 🔗 HIERARCHIE-BEZIEHUNGEN:

```
┌─────────────┐
│  PROJECT    │ (Dein Film)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    ACT      │ (z.B. "Setup", "Confrontation", "Resolution")
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  SEQUENCE   │ (z.B. "Opening Chase", "Love Story", "Final Battle")
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SCENE     │ (z.B. "City Skyline", "Market District")
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    SHOT     │ (z.B. "Wide dolly shot", "Close-up")
└─────────────┘
```

**FOREIGN KEYS:**
```sql
acts.project_id → projects.id
sequences.act_id → acts.id
scenes.sequence_id → sequences.id (NEU!)
scenes.act_id → acts.id (Legacy/Optional)
shots.scene_id → scenes.id
```

---

## 📋 BEISPIEL-DATEN:

### **PROJECT:**
```
id: "abc123"
title: "Mein Film"
```

### **ACT 1:**
```
id: "act-1"
project_id: "abc123"
act_number: 1
title: "Setup"
color: "#00CCC0" (Türkis)
order_index: 0
```

### **SEQUENCE 1:**
```
id: "seq-1"
act_id: "act-1"
sequence_number: 1
title: "Opening Sequence"
color: "#98E5B4" (Grün)
order_index: 0
```

### **SCENE 1:**
```
id: "scene-1"
project_id: "abc123"
sequence_id: "seq-1"  ← NEU!
act_id: "act-1"       ← Legacy (optional)
number: 1
title: "City Skyline"
location: "City Center"
time_of_day: "dawn"
order_index: 0
```

### **SHOT 1:**
```
id: "shot-1"
scene_id: "scene-1"
shot_number: "1A"
description: "Wide dolly shot across skyline"
camera_angle: "wide"
camera_movement: "dolly"
lens: "24mm"
duration: "10s"
composition: "Rule of thirds"
lighting_notes: "Golden hour"
sound_notes: "Ambient city sounds"
order_index: 0
```

---

## 🎨 UI FARBEN (WIE IM TIMELINE):

```
┌─────────────────────────────────────┐
│ ACT (Blau/Türkis)                   │ #00CCC0 oder #6E59A5
│ ┌─────────────────────────────────┐ │
│ │ SEQUENCE (Grün/Gelb)            │ │ #98E5B4 oder #FFE88D
│ │ ┌─────────────────────────────┐ │ │
│ │ │ SCENE (Rosa/Pink)           │ │ │ bg-pink-100
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ SHOT (Weiß/Grau)        │ │ │ │ bg-white
│ │ │ │ [Image] Details...      │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔐 ROW LEVEL SECURITY (RLS):

**ALLE Tabellen haben RLS aktiviert:**

```sql
-- User kann nur Daten seiner Organization sehen
SELECT * FROM acts 
WHERE project_id IN (
  SELECT id FROM projects 
  WHERE organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
  )
)

-- Editor/Admin/Owner kann bearbeiten
UPDATE acts ... 
WHERE user_role IN ('owner', 'admin', 'editor')
```

**GILT FÜR:**
- ✅ Acts
- ✅ Sequences
- ✅ Scenes (schon vorher)
- ✅ Shots

---

## 🔄 REORDER FUNKTIONEN:

**ACTS NEU ORDNEN:**
```sql
SELECT reorder_acts_in_project(
  'project-id',
  ARRAY['act-2', 'act-1', 'act-3']::uuid[]
);

-- Ergebnis:
-- act-2: order_index = 0
-- act-1: order_index = 1
-- act-3: order_index = 2
```

**SEQUENCES NEU ORDNEN:**
```sql
SELECT reorder_sequences_in_act(
  'act-1',
  ARRAY['seq-2', 'seq-1']::uuid[]
);
```

**SCENES NEU ORDNEN:**
```sql
SELECT reorder_scenes_in_sequence(
  'seq-1',
  ARRAY['scene-3', 'scene-1', 'scene-2']::uuid[]
);
```

**SHOTS NEU ORDNEN:**
```sql
SELECT reorder_shots_in_scene(
  'scene-1',
  ARRAY['shot-2', 'shot-1']::uuid[]
);
```

---

## 📊 CASCADE DELETES:

**WAS PASSIERT WENN ICH LÖSCHE?**

```
DELETE project
  ↓
  ├─ Löscht alle Acts (CASCADE)
  │   ↓
  │   ├─ Löscht alle Sequences (CASCADE)
  │   │   ↓
  │   │   └─ Setzt scenes.sequence_id = NULL (SET NULL)
  │   │
  │   └─ Setzt scenes.act_id = NULL (SET NULL)
  │
  └─ Löscht alle Scenes (existiert schon)
      ↓
      └─ Löscht alle Shots (CASCADE)
```

**WARUM SET NULL statt CASCADE bei Scenes?**
→ Scenes können DIREKT zum Project gehören (ohne Act/Sequence)
→ Flexibilität für verschiedene Workflows!

---

## 🔍 BEISPIEL-QUERIES:

### **ALLE ACTS EINES PROJEKTS:**
```sql
SELECT * FROM acts 
WHERE project_id = 'abc123'
ORDER BY order_index;
```

### **ALLE SEQUENCES EINES ACTS:**
```sql
SELECT * FROM sequences 
WHERE act_id = 'act-1'
ORDER BY order_index;
```

### **ALLE SCENES EINER SEQUENCE:**
```sql
SELECT * FROM scenes 
WHERE sequence_id = 'seq-1'
ORDER BY order_index;
```

### **ALLE SHOTS EINER SCENE:**
```sql
SELECT * FROM shots 
WHERE scene_id = 'scene-1'
ORDER BY order_index;
```

### **KOMPLETTE HIERARCHIE (JOIN):**
```sql
SELECT 
  a.act_number,
  a.title AS act_title,
  seq.sequence_number,
  seq.title AS sequence_title,
  sc.number AS scene_number,
  sc.title AS scene_title,
  sh.shot_number,
  sh.description AS shot_description
FROM acts a
LEFT JOIN sequences seq ON seq.act_id = a.id
LEFT JOIN scenes sc ON sc.sequence_id = seq.id
LEFT JOIN shots sh ON sh.scene_id = sc.id
WHERE a.project_id = 'abc123'
ORDER BY 
  a.order_index, 
  seq.order_index, 
  sc.order_index, 
  sh.order_index;
```

---

## ✅ MIGRATION CHECKLIST:

Nach erfolgreicher Migration:

```
✅ Tabelle "acts" existiert
✅ Tabelle "sequences" existiert
✅ Tabelle "shots" existiert
✅ Scenes haben "sequence_id" Spalte
✅ Scenes haben "act_id" Spalte
✅ Scenes haben "order_index" Spalte
✅ RLS Policies sind aktiv
✅ Reorder Funktionen existieren
✅ Triggers für updated_at sind aktiv
✅ Foreign Keys sind gesetzt
✅ Indexes sind erstellt
```

**CHECK IT:**
```sql
-- Check Tabellen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acts', 'sequences', 'shots');

-- Check Funktionen
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'reorder_%';

-- Check RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('acts', 'sequences', 'shots');
```

---

## 🎉 READY TO ROCK!

Nachdem die Migration durch ist, hast du die **perfekte Film-Datenbank-Struktur**! 🚀
