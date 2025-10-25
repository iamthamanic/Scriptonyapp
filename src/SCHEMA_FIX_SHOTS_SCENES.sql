-- =====================================================
-- 🚨 CRITICAL SCHEMA FIX - SHOTS & SCENES
-- =====================================================
-- Behebt 404 Errors beim Erstellen von Shots und Scenes
-- 
-- ❌ FEHLER:
-- - shots: "Could not find the 'project_id' column"
-- - scenes: "Could not find the 'color' column"
--
-- ✅ LÖSUNG:
-- - Fügt project_id zu shots hinzu
-- - Fügt color zu scenes hinzu
--
-- 📋 DEPLOY:
-- 1. Kopiere diese GANZE Datei (Cmd+A, Cmd+C)
-- 2. Supabase Dashboard → SQL Editor → New Query
-- 3. Einfügen (Cmd+V) → Run
-- =====================================================

-- =====================================================
-- 1. FÜGE project_id ZU SHOTS HINZU
-- =====================================================

DO $$
BEGIN
  -- Add project_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shots' AND column_name = 'project_id'
  ) THEN
    -- Füge die Spalte hinzu
    ALTER TABLE shots ADD COLUMN project_id UUID;
    
    -- Erstelle Index für Performance
    CREATE INDEX idx_shots_project ON shots(project_id);
    
    -- Füge Foreign Key Constraint hinzu
    ALTER TABLE shots 
      ADD CONSTRAINT fk_shots_project 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE CASCADE;
    
    -- Setze project_id für existierende Shots
    -- (hole project_id von der Scene)
    UPDATE shots 
    SET project_id = scenes.project_id
    FROM scenes
    WHERE shots.scene_id = scenes.id
    AND shots.project_id IS NULL;
    
    -- Mache project_id NOT NULL (nachdem alle Werte gesetzt wurden)
    ALTER TABLE shots ALTER COLUMN project_id SET NOT NULL;
    
    RAISE NOTICE '✅ Added project_id to shots table';
  ELSE
    RAISE NOTICE 'ℹ️ project_id already exists in shots table';
  END IF;
END $$;

COMMENT ON COLUMN shots.project_id IS 'Direkter Link zum Projekt (denormalisiert für Performance)';

-- =====================================================
-- 2. FÜGE color ZU SCENES HINZU
-- =====================================================

DO $$
BEGIN
  -- Add color if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'color'
  ) THEN
    -- Füge die Spalte hinzu
    ALTER TABLE scenes ADD COLUMN color TEXT DEFAULT '#6E59A5';
    
    -- Setze Default-Farbe für existierende Scenes
    UPDATE scenes 
    SET color = '#6E59A5'
    WHERE color IS NULL;
    
    RAISE NOTICE '✅ Added color to scenes table';
  ELSE
    RAISE NOTICE 'ℹ️ color already exists in scenes table';
  END IF;
END $$;

COMMENT ON COLUMN scenes.color IS 'Hex-Farbe für UI-Darstellung (#6E59A5, #00CCC0, etc.)';

-- =====================================================
-- 3. VERIFY FIX
-- =====================================================

DO $$
DECLARE
  shots_has_project_id BOOLEAN;
  scenes_has_color BOOLEAN;
BEGIN
  -- Check shots.project_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shots' AND column_name = 'project_id'
  ) INTO shots_has_project_id;
  
  -- Check scenes.color
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scenes' AND column_name = 'color'
  ) INTO scenes_has_color;
  
  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 SCHEMA FIX VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'shots.project_id: %', CASE WHEN shots_has_project_id THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'scenes.color: %', CASE WHEN scenes_has_color THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '========================================';
  
  IF shots_has_project_id AND scenes_has_color THEN
    RAISE NOTICE '✅ ALL COLUMNS EXIST - FIX COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Du kannst jetzt Shots und Scenes erstellen!';
  ELSE
    RAISE WARNING '❌ SOME COLUMNS MISSING - CHECK ERRORS ABOVE';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 4. OPTIONAL: REFRESH SCHEMA CACHE
-- =====================================================
-- Falls Supabase den Cache nicht automatisch aktualisiert,
-- führe dies aus (normalerweise nicht nötig):

-- NOTIFY pgrst, 'reload schema';

-- =====================================================
-- DONE! 
-- =====================================================
-- Nach dem Ausführen sollten die Fehler verschwunden sein.
-- Teste es, indem du versuchst einen Shot oder eine Scene zu erstellen.
-- =====================================================
