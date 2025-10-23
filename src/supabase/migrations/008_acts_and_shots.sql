-- =====================================================
-- Migration 008: Acts & Shots System
-- =====================================================
-- Fügt Acts und Shots zur Film-Hierarchie hinzu:
-- Project → Act → Scene → Shot
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ACTS TABLE
-- =====================================================
-- Acts sind die Hauptstruktur eines Films (z.B. 3-Akt-Struktur)

CREATE TABLE IF NOT EXISTS acts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Act Info
  act_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Visual/UI
  color TEXT DEFAULT '#00CCC0', -- Farbe für UI (türkis, grün, rosa, etc.)
  
  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, act_number)
);

CREATE INDEX idx_acts_project ON acts(project_id);
CREATE INDEX idx_acts_order ON acts(project_id, order_index);

COMMENT ON TABLE acts IS 'Acts in einem Film (z.B. 3-Akt-Struktur, Heldenreise)';
COMMENT ON COLUMN acts.color IS 'Hex-Farbe für UI-Darstellung (#00CCC0, #98E5B4, etc.)';
COMMENT ON COLUMN acts.order_index IS 'Sortierung der Acts (0, 1, 2, ...)';

-- =====================================================
-- SHOTS TABLE
-- =====================================================
-- Shots sind einzelne Einstellungen innerhalb einer Szene

CREATE TABLE IF NOT EXISTS shots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  
  -- Shot Info
  shot_number TEXT NOT NULL,
  description TEXT,
  
  -- Camera
  camera_angle TEXT, -- 'wide', 'medium', 'close-up', 'extreme close-up', 'overhead', etc.
  camera_movement TEXT, -- 'static', 'pan', 'tilt', 'dolly', 'tracking', 'handheld', etc.
  lens TEXT, -- '24mm', '50mm', '85mm', etc.
  
  -- Timing
  duration TEXT, -- '3s', '0:05', etc.
  
  -- Visual
  composition TEXT,
  lighting_notes TEXT,
  
  -- Audio
  sound_notes TEXT,
  
  -- Production
  storyboard_url TEXT,
  reference_image_url TEXT,
  
  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(scene_id, shot_number)
);

CREATE INDEX idx_shots_scene ON shots(scene_id);
CREATE INDEX idx_shots_order ON shots(scene_id, order_index);

COMMENT ON TABLE shots IS 'Einzelne Kamera-Einstellungen innerhalb einer Szene';
COMMENT ON COLUMN shots.camera_angle IS 'Kamerawinkel (wide, medium, close-up, etc.)';
COMMENT ON COLUMN shots.camera_movement IS 'Kamerabewegung (static, pan, dolly, etc.)';
COMMENT ON COLUMN shots.order_index IS 'Sortierung der Shots innerhalb der Szene';

-- =====================================================
-- UPDATE SCENES TABLE
-- =====================================================
-- Scenes bekommen act_id und order_index

DO $$
BEGIN
  -- Add act_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'act_id'
  ) THEN
    ALTER TABLE scenes ADD COLUMN act_id UUID REFERENCES acts(id) ON DELETE SET NULL;
    CREATE INDEX idx_scenes_act ON scenes(act_id);
  END IF;
  
  -- Add order_index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE scenes ADD COLUMN order_index INTEGER DEFAULT 0;
    CREATE INDEX idx_scenes_order ON scenes(act_id, order_index);
  END IF;
END $$;

COMMENT ON COLUMN scenes.act_id IS 'Optional: Zugehöriger Akt (für strukturierte Filme)';
COMMENT ON COLUMN scenes.order_index IS 'Sortierung der Szenen innerhalb eines Akts';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

-- Acts: Inherit permissions from project
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

-- Shots: Inherit permissions from scene → project
CREATE POLICY "Users can view shots"
  ON shots FOR SELECT
  USING (
    scene_id IN (
      SELECT id FROM scenes 
      WHERE project_id IN (
        SELECT id FROM projects 
        WHERE organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Editors can manage shots"
  ON shots FOR ALL
  USING (
    scene_id IN (
      SELECT id FROM scenes 
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp on acts
CREATE TRIGGER update_acts_updated_at BEFORE UPDATE ON acts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp on shots
CREATE TRIGGER update_shots_updated_at BEFORE UPDATE ON shots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to reorder acts within a project
CREATE OR REPLACE FUNCTION reorder_acts(
  p_project_id UUID,
  p_act_ids UUID[]
) RETURNS void AS $$
DECLARE
  act_id UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH act_id IN ARRAY p_act_ids
  LOOP
    UPDATE acts 
    SET order_index = idx 
    WHERE id = act_id AND project_id = p_project_id;
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_acts IS 'Ändert die Reihenfolge von Acts in einem Projekt';

-- Function to reorder scenes within an act
CREATE OR REPLACE FUNCTION reorder_scenes_in_act(
  p_act_id UUID,
  p_scene_ids UUID[]
) RETURNS void AS $$
DECLARE
  scene_id UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH scene_id IN ARRAY p_scene_ids
  LOOP
    UPDATE scenes 
    SET order_index = idx, act_id = p_act_id
    WHERE id = scene_id;
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_scenes_in_act IS 'Ändert die Reihenfolge von Scenes in einem Akt und weist sie zu';

-- Function to reorder shots within a scene
CREATE OR REPLACE FUNCTION reorder_shots_in_scene(
  p_scene_id UUID,
  p_shot_ids UUID[]
) RETURNS void AS $$
DECLARE
  shot_id UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH shot_id IN ARRAY p_shot_ids
  LOOP
    UPDATE shots 
    SET order_index = idx 
    WHERE id = shot_id AND scene_id = p_scene_id;
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_shots_in_scene IS 'Ändert die Reihenfolge von Shots in einer Szene';
