-- =====================================================
-- Migration 009: Sequences System
-- =====================================================
-- Fügt Sequences zwischen Acts und Scenes hinzu:
-- Project → Act → Sequence → Scene → Shot
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SEQUENCES TABLE
-- =====================================================
-- Sequences sind Gruppen von Szenen innerhalb eines Acts
-- (z.B. "Opening Chase", "Love Story", "Final Battle")

CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  act_id UUID NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
  
  -- Sequence Info
  sequence_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Visual/UI
  color TEXT DEFAULT '#98E5B4', -- Farbe für UI (grün, türkis, gelb, etc.)
  
  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(act_id, sequence_number)
);

CREATE INDEX idx_sequences_act ON sequences(act_id);
CREATE INDEX idx_sequences_order ON sequences(act_id, order_index);

COMMENT ON TABLE sequences IS 'Sequenzen innerhalb eines Acts (z.B. Opening Chase, Love Story)';
COMMENT ON COLUMN sequences.color IS 'Hex-Farbe für UI-Darstellung (#98E5B4, #FFE88D, etc.)';
COMMENT ON COLUMN sequences.order_index IS 'Sortierung der Sequences innerhalb eines Acts';

-- =====================================================
-- UPDATE SCENES TABLE
-- =====================================================
-- Scenes bekommen sequence_id (und act_id wird optional/deprecated)

DO $$
BEGIN
  -- Add sequence_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'sequence_id'
  ) THEN
    ALTER TABLE scenes ADD COLUMN sequence_id UUID REFERENCES sequences(id) ON DELETE SET NULL;
    CREATE INDEX idx_scenes_sequence ON scenes(sequence_id);
  END IF;
END $$;

COMMENT ON COLUMN scenes.sequence_id IS 'Zugehörige Sequenz (Hierarchie: Act → Sequence → Scene)';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Sequences: Inherit permissions from act → project
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp on sequences
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to reorder sequences within an act
CREATE OR REPLACE FUNCTION reorder_sequences_in_act(
  p_act_id UUID,
  p_sequence_ids UUID[]
) RETURNS void AS $$
DECLARE
  sequence_id UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH sequence_id IN ARRAY p_sequence_ids
  LOOP
    UPDATE sequences 
    SET order_index = idx 
    WHERE id = sequence_id AND act_id = p_act_id;
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_sequences_in_act IS 'Ändert die Reihenfolge von Sequences in einem Akt';

-- Function to reorder scenes within a sequence (UPDATE from 008)
CREATE OR REPLACE FUNCTION reorder_scenes_in_sequence(
  p_sequence_id UUID,
  p_scene_ids UUID[]
) RETURNS void AS $$
DECLARE
  scene_id UUID;
  idx INTEGER := 0;
BEGIN
  FOREACH scene_id IN ARRAY p_scene_ids
  LOOP
    UPDATE scenes 
    SET order_index = idx, sequence_id = p_sequence_id
    WHERE id = scene_id;
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_scenes_in_sequence IS 'Ändert die Reihenfolge von Scenes in einer Sequenz und weist sie zu';

-- =====================================================
-- DATA MIGRATION HELPER
-- =====================================================
-- Optional: Wenn bestehende Scenes einen act_id haben,
-- erstelle Default-Sequences pro Act und weise Scenes zu

CREATE OR REPLACE FUNCTION migrate_scenes_to_sequences() RETURNS void AS $$
DECLARE
  act_record RECORD;
  new_sequence_id UUID;
BEGIN
  -- Für jeden Act der Scenes mit act_id (aber ohne sequence_id) hat
  FOR act_record IN 
    SELECT DISTINCT act_id 
    FROM scenes 
    WHERE act_id IS NOT NULL 
    AND sequence_id IS NULL
  LOOP
    -- Erstelle eine Default-Sequence für diesen Act
    INSERT INTO sequences (
      act_id, 
      sequence_number, 
      title, 
      description,
      color,
      order_index
    ) VALUES (
      act_record.act_id,
      1,
      'Main Sequence',
      'Auto-migrated sequence from existing scenes',
      '#98E5B4',
      0
    )
    RETURNING id INTO new_sequence_id;
    
    -- Weise alle Scenes dieses Acts der neuen Sequence zu
    UPDATE scenes 
    SET sequence_id = new_sequence_id
    WHERE act_id = act_record.act_id
    AND sequence_id IS NULL;
    
    RAISE NOTICE 'Created sequence % for act %', new_sequence_id, act_record.act_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_scenes_to_sequences IS 'Migriert bestehende Scenes in Default-Sequences (einmalig ausführen)';

-- =====================================================
-- NOTES
-- =====================================================
-- Nach dem Ausführen dieser Migration:
-- 1. Optional: `SELECT migrate_scenes_to_sequences();` ausführen
--    um bestehende Scenes in Sequences zu migrieren
-- 2. Server neu deployen mit routes-sequences.tsx
-- 3. Frontend kann jetzt Sequences verwenden!
