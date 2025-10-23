# 🎬 Timeline Migrationen - JETZT AUSFÜHREN!

## Problem
Die Timeline-Tabellen (`acts`, `sequences`, `scenes`, `shots`) existieren noch nicht in deiner Datenbank!

## Lösung: Migrations Copy & Paste

### Schritt 1: Gehe zu Supabase Dashboard
1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt aus
3. Gehe zu **SQL Editor** (linkes Menü)

### Schritt 2: Führe diese Migration aus

**Klicke auf "New Query"** und füge das komplette SQL ein:

```sql
-- =====================================================
-- TIMELINE COMPLETE MIGRATION
-- Acts + Sequences + Scenes + Shots
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS acts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  act_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  color TEXT DEFAULT '#00CCC0',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, act_number)
);

CREATE INDEX IF NOT EXISTS idx_acts_project ON acts(project_id);
CREATE INDEX IF NOT EXISTS idx_acts_order ON acts(project_id, order_index);

-- =====================================================
-- 2. SEQUENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  act_id UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  color TEXT DEFAULT '#98E5B4',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(act_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_sequences_act ON sequences(act_id);
CREATE INDEX IF NOT EXISTS idx_sequences_order ON sequences(act_id, order_index);

-- =====================================================
-- 3. UPDATE SCENES TABLE
-- =====================================================
-- Add sequence_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'sequence_id'
  ) THEN
    ALTER TABLE scenes ADD COLUMN sequence_id UUID REFERENCES sequences(id) ON DELETE SET NULL;
    CREATE INDEX idx_scenes_sequence ON scenes(sequence_id);
  END IF;
END $$;

-- =====================================================
-- 4. SHOTS TABLE (if not exists from Migration 008)
-- =====================================================
CREATE TABLE IF NOT EXISTS shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  shot_number TEXT NOT NULL,
  description TEXT,
  camera_angle TEXT,
  camera_movement TEXT,
  lens TEXT,
  duration INTEGER,
  composition TEXT,
  lighting_notes TEXT,
  sound_notes TEXT,
  storyboard_url TEXT,
  reference_image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shots_scene ON shots(scene_id);
CREATE INDEX IF NOT EXISTS idx_shots_order ON shots(scene_id, order_index);

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

-- Acts policies
DROP POLICY IF EXISTS "Users can view acts" ON acts;
CREATE POLICY "Users can view acts"
  ON acts FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Editors can manage acts" ON acts;
CREATE POLICY "Editors can manage acts"
  ON acts FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Sequences policies
DROP POLICY IF EXISTS "Users can view sequences" ON sequences;
CREATE POLICY "Users can view sequences"
  ON sequences FOR SELECT
  USING (
    act_id IN (
      SELECT id FROM acts 
      WHERE project_id IN (
        SELECT id FROM projects 
        WHERE organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Editors can manage sequences" ON sequences;
CREATE POLICY "Editors can manage sequences"
  ON sequences FOR ALL
  USING (
    act_id IN (
      SELECT id FROM acts 
      WHERE project_id IN (
        SELECT id FROM projects 
        WHERE organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin', 'editor')
        )
      )
    )
  );

-- Shots policies
DROP POLICY IF EXISTS "Users can view shots" ON shots;
CREATE POLICY "Users can view shots"
  ON shots FOR SELECT
  USING (
    scene_id IN (
      SELECT id FROM scenes
      WHERE sequence_id IN (
        SELECT id FROM sequences
        WHERE act_id IN (
          SELECT id FROM acts
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Editors can manage shots" ON shots;
CREATE POLICY "Editors can manage shots"
  ON shots FOR ALL
  USING (
    scene_id IN (
      SELECT id FROM scenes
      WHERE sequence_id IN (
        SELECT id FROM sequences
        WHERE act_id IN (
          SELECT id FROM acts
          WHERE project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
              SELECT organization_id FROM organization_members
              WHERE user_id = auth.uid()
              AND role IN ('owner', 'admin', 'editor')
            )
          )
        )
      )
    )
  );

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_acts_updated_at ON acts;
CREATE TRIGGER update_acts_updated_at BEFORE UPDATE ON acts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sequences_updated_at ON sequences;
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shots_updated_at ON shots;
CREATE TRIGGER update_shots_updated_at BEFORE UPDATE ON shots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FERTIG! 🎉
-- =====================================================

SELECT 'Timeline tables created successfully!' AS status;
```

### Schritt 3: Klicke auf "RUN"

Warte bis "Success" erscheint!

### Schritt 4: Teste im Browser

1. Gehe zu deinem Scriptony-Projekt
2. Öffne ein Film-Projekt
3. Klicke auf "Film Timeline"
4. Teste: "Akt hinzufügen" → "Sequenz hinzufügen"

## 🐛 Falls es noch Fehler gibt

Öffne die Browser Console (F12) und schau dir die Logs an:
- `[SEQUENCES] POST body:` zeigt was gesendet wird
- `[SEQUENCES] Error creating sequence:` zeigt den DB-Fehler

## ✅ Erfolgreich wenn:
- Du kannst Acts, Sequences, Scenes und Shots erstellen
- Die Timeline lädt ohne Fehler
- Keine "table does not exist" Fehler mehr

---

**Hinweis:** Diese Migration ist **idempotent** - du kannst sie mehrmals ausführen ohne Probleme!
