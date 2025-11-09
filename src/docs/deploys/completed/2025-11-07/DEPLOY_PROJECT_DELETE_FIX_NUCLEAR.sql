-- ================================================================
-- NUCLEAR FIX v3: Skip DELETE in ALL audit triggers
-- ================================================================
-- DEPLOYED: 2025-11-07 07:45 UTC
-- STATUS: ✅ SUCCESS

-- Problem: FK constraint violation when deleting projects
-- Root Cause: CASCADE DELETE triggered audit logs on child tables
--             (characters, shots, timeline_nodes) which tried to write
--             activity_logs with already deleted project_id
-- Solution: Make all 3 audit functions skip DELETE operations

-- Fix 1: log_character_changes
CREATE OR REPLACE FUNCTION public.log_character_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_action VARCHAR(10);
  v_changes JSONB;
BEGIN
  -- ⚠️ CRITICAL: Skip DELETE logging!
  -- Reason: Project might be deleted, causing FK constraint violation
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  v_user_id := auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_changes := jsonb_build_object(
      'name', NEW.name,
      'type', NEW.type
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object('name', OLD.name),
      'new', jsonb_build_object('name', NEW.name)
    );
  END IF;
  
  INSERT INTO activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_id,
    NEW.project_id,
    v_action,
    'Character',
    NEW.id,
    v_changes
  );
  
  RETURN NEW;
END;
$function$;

-- Fix 2: log_shot_changes
CREATE OR REPLACE FUNCTION public.log_shot_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_action VARCHAR(10);
  v_changes JSONB;
BEGIN
  -- ⚠️ CRITICAL: Skip DELETE logging!
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  v_user_id := auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_changes := jsonb_build_object(
      'name', NEW.name,
      'scene_id', NEW.scene_id
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object('name', OLD.name),
      'new', jsonb_build_object('name', NEW.name)
    );
  END IF;
  
  INSERT INTO activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_id,
    NEW.project_id,
    v_action,
    'Shot',
    NEW.id,
    v_changes
  );
  
  RETURN NEW;
END;
$function$;

-- Fix 3: log_timeline_node_changes
CREATE OR REPLACE FUNCTION public.log_timeline_node_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_action VARCHAR(10);
  v_changes JSONB;
BEGIN
  -- ⚠️ CRITICAL: Skip DELETE logging!
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  v_user_id := auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'CREATE';
    v_changes := jsonb_build_object(
      'name', NEW.name,
      'level', NEW.level
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'UPDATE';
    v_changes := jsonb_build_object(
      'old', jsonb_build_object('name', OLD.name),
      'new', jsonb_build_object('name', NEW.name)
    );
  END IF;
  
  INSERT INTO activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_id,
    NEW.project_id,
    v_action,
    'TimelineNode',
    NEW.id,
    v_changes
  );
  
  RETURN NEW;
END;
$function$;

-- Verification
SELECT 'FIXED: All 3 audit functions now skip DELETE operations' as status;
