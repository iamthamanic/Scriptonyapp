# 🔧 SCHEMA CACHE FIX - PostgREST Cache Problem

**Datum:** 25. Oktober 2025  
**Problem:** PostgREST Schema Cache kennt neue Spalten nicht

---

## 🚨 **FEHLER:**

```
❌ Could not find the 'color' column of 'scenes' in the schema cache
❌ Could not find the 'project_id' column of 'shots' in the schema cache
❌ null value in column "scene_number" of relation "scenes" violates not-null constraint
```

---

## 🔍 **URSACHE:**

**PostgREST** cached das alte Schema und kennt die neuen Spalten nicht, die durch Migrations hinzugefügt wurden:

1. `scenes.color` (hinzugefügt in Migration 010)
2. `shots.project_id` (hinzugefügt in Migration 010)
3. `scenes.scene_number` (NOT NULL Constraint)

---

## ✅ **LÖSUNG:**

### **Option 1: PostgREST Cache über Supabase Dashboard neu laden**

1. **Gehe zu Supabase Dashboard** → `https://supabase.com/dashboard/project/ctkouztastyirjywiduc`
2. **Settings** → **API** → Scroll nach unten
3. **Klick auf "Reload schema cache"** Button
4. Warte 10-30 Sekunden
5. **Teste** ob die Fehler weg sind

### **Option 2: PostgREST über SQL neu starten**

```sql
-- Führe diesen SQL Query im Supabase SQL Editor aus
NOTIFY pgrst, 'reload schema';
```

### **Option 3: Supabase CLI (wenn installiert)**

```bash
supabase db reset
```

---

## 🔍 **SCHEMA PRÜFEN:**

Prüfe, ob die Spalten existieren:

```sql
-- Prüfe scenes Tabelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scenes'
ORDER BY ordinal_position;

-- Prüfe shots Tabelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shots'
ORDER BY ordinal_position;
```

**Erwartete Spalten:**

**scenes:**
- `color` (TEXT, nullable)
- `scene_number` (INTEGER, NOT NULL)
- `project_id` (UUID, NOT NULL)
- etc.

**shots:**
- `project_id` (UUID, NOT NULL)
- `shot_number` (INTEGER, NOT NULL)
- etc.

---

## 🛠️ **WENN SPALTEN FEHLEN:**

Falls die Spalten wirklich fehlen, führe die Migrations manuell aus:

```sql
-- Migration 010: Add missing columns

-- Add color to scenes
ALTER TABLE scenes 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6E59A5';

-- Add project_id to shots
ALTER TABLE shots 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Ensure scene_number has default
ALTER TABLE scenes 
ALTER COLUMN scene_number SET NOT NULL,
ALTER COLUMN scene_number SET DEFAULT 1;

-- Ensure shot_number has default
ALTER TABLE shots 
ALTER COLUMN shot_number SET NOT NULL,
ALTER COLUMN shot_number SET DEFAULT 1;
```

---

## ⚠️ **NOT NULL CONSTRAINT FIX:**

Der Fehler `scene_number violates not-null constraint` bedeutet, dass der Code `null` für `scene_number` sendet.

**FIX im Frontend:** Stelle sicher, dass `scene_number` immer gesetzt wird:

```typescript
// ❌ FALSCH
const newScene = {
  title: "Scene 4",
  sequence_id: sequenceId,
  // scene_number fehlt!
};

// ✅ RICHTIG
const newScene = {
  title: "Scene 4",
  sequence_id: sequenceId,
  scene_number: existingScenes.length + 1,  // ← Wichtig!
};
```

---

## 🎯 **NÄCHSTE SCHRITTE:**

1. ✅ **Reload PostgREST Cache** (Option 1)
2. ✅ **Prüfe ob Fehler weg sind**
3. ⚠️ **Falls nicht:** Führe SQL aus (Option 2/3)
4. ⚠️ **Falls immer noch nicht:** Prüfe ob Spalten existieren
5. ⚠️ **Falls Spalten fehlen:** Führe Migration 010 manuell aus

---

**Nach dem Fix sollten alle "schema cache" Fehler verschwinden!** 🎉
