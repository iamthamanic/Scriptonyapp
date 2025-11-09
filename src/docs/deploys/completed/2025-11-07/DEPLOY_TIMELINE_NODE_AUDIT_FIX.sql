-- ================================================================
-- CRITICAL FIX: log_timeline_node_changes - name → title
-- ================================================================
-- DEPLOYED: 2025-11-07 (HOTFIX)
-- STATUS: ⚠️ URGENT FIX NEEDED

-- Problem: Nuclear Fix v3 used 'name' field instead of 'title'
-- timeline_nodes table has 'title', not 'name'!
-- Error: "record "old" has no field "name""

-- Impact: Act/Sequence/Scene UPDATE operations fail
-- Solution: Fix function to use 'title' instead of 'name'

-- ================================================================
-- CORRECTED FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION public.log_timeline_node_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_action VARCHAR(10);
  v_entity_type VARCHAR(50);
  v_changes JSONB;
BEGIN
  -- ⚠️ CRITICAL: Skip DELETE logging to prevent FK violations
  -- (When project is deleted, CASCADE triggers this but project_id is already gone)
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  -- Get user from RLS auth context
  v_user_id := auth.uid();
  
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
  END IF;
  
  -- Determine entity type from level
  v_entity_type := CASE 
    WHEN COALESCE(NEW.level, OLD.level) = 1 THEN 'Act'
    WHEN COALESCE(NEW.level, OLD.level) = 2 THEN 'Sequence'
    WHEN COALESCE(NEW.level, OLD.level) = 3 THEN 'Scene'
    ELSE 'Node'
  END;
  
  -- Build changes object (✅ FIXED: use 'title' not 'name')
  IF (TG_OP = 'INSERT') THEN
    v_changes := jsonb_build_object(
      'title', NEW.title,
      'level', NEW.level
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    v_changes := jsonb_build_object(
      'old', jsonb_build_object(
        'title', OLD.title,
        'description', OLD.description
      ),
      'new', jsonb_build_object(
        'title', NEW.title,
        'description', NEW.description
      )
    );
  END IF;
  
  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_id,
    COALESCE(NEW.project_id, OLD.project_id),
    v_action,
    v_entity_type,
    COALESCE(NEW.id, OLD.id),
    v_changes
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Verification
SELECT 'FIXED: log_timeline_node_changes now uses title instead of name' as status;

-- ================================================================
-- TESTING
-- ================================================================

-- Test UPDATE trigger (should work now):
-- UPDATE timeline_nodes SET title = 'Test Act Updated' WHERE level = 1 LIMIT 1;

-- Verify log was created:
-- SELECT * FROM activity_logs WHERE entity_type = 'Act' ORDER BY created_at DESC LIMIT 1;
