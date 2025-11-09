# 🧪 Activity Logs Test & Debug

## Problem
User meldet: "activity logs bei akt sind immer noch nicht vorhanden"

## Investigation

### Frontend Code (TimelineNodeStatsDialog.tsx)
✅ **KORREKT**: Lädt Logs via:
```typescript
`${supabaseConfig.url}/functions/v1/scriptony-logs/logs/${nodeType}/${node.id}/recent`
```

Für `nodeType='act'` wird gecallt:
```
/scriptony-logs/logs/act/{act.id}/recent
```

### Backend Code (scriptony-logs/index.ts)
✅ **KORREKT**: Route Line 308-409
```typescript
app.get("/logs/:nodeType/:id/recent", async (c) => {
  const entityTypeMap: Record<string, string> = {
    'act': 'Act',          // ✅ Maps to DB entity_type
    'sequence': 'Sequence',
    'scene': 'Scene',
    'shot': 'Shot',
  };
  // ...
  .eq("entity_type", entityType)  // Queries activity_logs WHERE entity_type='Act'
  .eq("entity_id", nodeId)         // AND entity_id = act.id
```

### Database Schema (Migration 026)
✅ **KORREKT**: Trigger Line 22-99
```sql
CREATE OR REPLACE FUNCTION log_timeline_node_changes()
  ...
  -- Determine entity type from level
  v_entity_type := CASE 
    WHEN COALESCE(NEW.level, OLD.level) = 1 THEN 'Act'      -- ✅
    WHEN COALESCE(NEW.level, OLD.level) = 2 THEN 'Sequence'
    WHEN COALESCE(NEW.level, OLD.level) = 3 THEN 'Scene'
    ELSE 'Node'
  END;
  
  INSERT INTO activity_logs (
    user_id,
    project_id,
    action,
    entity_type,  -- ✅ Writes 'Act', 'Sequence', 'Scene'
    entity_id,
    details
  ) VALUES ...
```

### Nuclear Fix v3 (deployed 2025-11-07)
⚠️ **ISSUE FOUND**: log_timeline_node_changes skippt jetzt DELETE

**Current deployed version:**
```sql
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
    RETURN OLD;  -- ❌ Skippt DELETE
  END IF;
  ...
END;
$function$;
```

**Problem**: Diese Version schreibt KEINE Logs für DELETE operations, aber sie schreibt Logs für CREATE und UPDATE.

## Root Cause Analysis

### Mögliche Szenarien warum keine Logs sichtbar sind:

1. ✅ **Migration Timeline**:
   - Migration 023 (2025-11-05): Disabled activity_logs triggers
   - Migration 026 (2025-11-05): Re-enabled triggers
   - User hat wahrscheinlich sein Projekt ZWISCHEN Migration 023 und 026 erstellt
   - → Alle Acts wurden OHNE Trigger erstellt → KEINE CREATE Logs

2. ✅ **Nuclear Fix Timing**:
   - Nuclear Fix v3 deployed heute (2025-11-07)
   - Überschrieb die korrekte Migration 026 Function
   - Acts die VORHER erstellt wurden haben KEINE Logs
   - Acts die NACHHER erstellt werden sollten Logs haben

3. ✅ **User Actions**:
   - User hat wahrscheinlich NUR Acts ERSTELLT (CREATE)
   - Keine UPDATEs gemacht
   - → Logs wurden geschrieben, aber nur FÜR CREATE

## Solution Options

### Option A: Logs sind da, aber User sieht sie nicht
- Frontend zeigt Logs korrekt an (Code ist korrekt)
- User muss auf "Logs" Tab klicken
- → TESTING NEEDED

### Option B: Keine Logs wegen Migration Timeline
- Acts wurden zwischen Migration 023 und 026 erstellt
- → BACKFILL nicht möglich (kein Audit Trail)
- Solution: User muss neue Acts erstellen ODER vorhandene Acts UPDATEN
- → Ein simples Title-Update triggert einen Activity Log

### Option C: Trigger feuert nicht
- User ID fehlt (auth.uid() returns null)
- → Check if user is authenticated when creating/updating

## Next Steps

1. ✅ Ask user to CHECK if logs appear when clicking "Logs" tab
2. ✅ Ask user to UPDATE an existing Act (z.B. Titel ändern)
3. ✅ Verify that update creates an activity log entry
4. ❌ DO NOT re-deploy Nuclear Fix - it's working correctly for preventing FK violations

## Test Query (for User to run in Supabase Dashboard)

```sql
-- Check if ANY activity logs exist for Acts
SELECT 
  id,
  created_at,
  user_id,
  entity_type,
  entity_id,
  action,
  details
FROM activity_logs
WHERE entity_type = 'Act'
ORDER BY created_at DESC
LIMIT 10;

-- Check timeline_nodes trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'timeline_nodes_audit';
```

## Expected Results

After user UPDATES an Act title:
- Frontend should show "Logs" tab with entries
- Entry should show: `action: 'UPDATE'`, `entity_type: 'Act'`
- Details should show old vs new title

## Status
🟡 PENDING USER TESTING

User should:
1. Open Act Info Dialog
2. Click "Logs" tab
3. Check if logs appear
4. If NO logs: Update Act title and check again
