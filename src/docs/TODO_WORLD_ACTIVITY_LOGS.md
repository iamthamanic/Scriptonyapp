# 📝 TODO: World Activity Logs Backend Implementation

**Status:** ⏳ Optional - Für spätere Implementation vorbereitet  
**Priority:** Low (Frontend bereits vorbereitet)  
**Effort:** ~2-3 Stunden  

---

## 🎯 Ziel

Activity Logs für Welten im Backend implementieren, analog zu Projects.

---

## 📋 Was fehlt noch

### 1. **Database Schema Änderung**

**Problem:** `activity_logs` Tabelle hat nur `project_id`, kein `world_id`

**Lösung:** Migration erstellen

```sql
-- /supabase/migrations/031_add_world_activity_logs.sql

-- Add world_id column (nullable, because existing logs are project-based)
ALTER TABLE activity_logs 
ADD COLUMN world_id UUID REFERENCES worlds(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_world 
ON activity_logs(world_id, created_at DESC);

-- Modify constraint: project_id OR world_id must be set (not both)
-- This allows logs for either projects OR worlds

COMMENT ON COLUMN activity_logs.world_id IS 'References world if this is a world-related activity';
```

**Wichtig:** 
- `project_id` und `world_id` sind beide nullable
- Ein Log gehört entweder zu einem Project ODER einer World
- Nicht beide gleichzeitig

---

### 2. **Trigger Functions für Worlds**

**Worlds Trigger:**
```sql
-- Function to log worlds changes
CREATE OR REPLACE FUNCTION log_world_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      NEW.id, 
      COALESCE(auth.uid(), NEW.user_id),
      'world', 
      NEW.id, 
      'created', 
      jsonb_build_object('name', NEW.name, 'description', NEW.description)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name OR OLD.description != NEW.description THEN
      INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
      VALUES (
        NEW.id, 
        COALESCE(auth.uid(), NEW.user_id),
        'world', 
        NEW.id, 
        'updated', 
        jsonb_build_object(
          'name', CASE WHEN OLD.name != NEW.name 
            THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) 
            ELSE NULL END,
          'description', CASE WHEN OLD.description != NEW.description 
            THEN jsonb_build_object('old', OLD.description, 'new', NEW.description) 
            ELSE NULL END
        )
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      OLD.id, 
      COALESCE(auth.uid(), OLD.user_id),
      'world', 
      OLD.id, 
      'deleted', 
      jsonb_build_object('name', OLD.name)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS worlds_audit ON worlds;
CREATE TRIGGER worlds_audit
AFTER INSERT OR UPDATE OR DELETE ON worlds
FOR EACH ROW EXECUTE FUNCTION log_world_changes();
```

**World Categories Trigger:**
```sql
CREATE OR REPLACE FUNCTION log_world_category_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_world_id UUID;
BEGIN
  -- Get world_id from category or OLD record
  v_world_id := COALESCE(NEW.world_id, OLD.world_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      v_world_id,
      auth.uid(),
      'category', 
      NEW.id, 
      'created', 
      jsonb_build_object('name', NEW.name, 'type', NEW.type)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
      VALUES (
        v_world_id,
        auth.uid(),
        'category', 
        NEW.id, 
        'updated', 
        jsonb_build_object(
          'name', jsonb_build_object('old', OLD.name, 'new', NEW.name)
        )
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      v_world_id,
      auth.uid(),
      'category', 
      OLD.id, 
      'deleted', 
      jsonb_build_object('name', OLD.name)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS world_categories_audit ON world_categories;
CREATE TRIGGER world_categories_audit
AFTER INSERT OR UPDATE OR DELETE ON world_categories
FOR EACH ROW EXECUTE FUNCTION log_world_category_changes();
```

**World Items (Assets) Trigger:**
```sql
CREATE OR REPLACE FUNCTION log_world_item_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_world_id UUID;
BEGIN
  v_world_id := COALESCE(NEW.world_id, OLD.world_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      v_world_id,
      auth.uid(),
      'asset', 
      NEW.id, 
      'created', 
      jsonb_build_object('name', NEW.name, 'category', NEW.category)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name OR OLD.description != NEW.description THEN
      INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
      VALUES (
        v_world_id,
        auth.uid(),
        'asset', 
        NEW.id, 
        'updated', 
        jsonb_build_object(
          'name', CASE WHEN OLD.name != NEW.name 
            THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) 
            ELSE NULL END
        )
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (world_id, user_id, entity_type, entity_id, action, details)
    VALUES (
      v_world_id,
      auth.uid(),
      'asset', 
      OLD.id, 
      'deleted', 
      jsonb_build_object('name', OLD.name)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS world_items_audit ON world_items;
CREATE TRIGGER world_items_audit
AFTER INSERT OR UPDATE OR DELETE ON world_items
FOR EACH ROW EXECUTE FUNCTION log_world_item_changes();
```

---

### 3. **Edge Function Endpoint**

**File:** `/supabase/functions/scriptony-logs/index.ts`

**Neuer Endpoint hinzufügen:**

```typescript
/**
 * GET /worlds/:worldId
 * Get activity logs for a specific world
 */
app.get("/worlds/:worldId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const worldId = c.req.param("worldId");
    
    // Verify user has access to this world
    const { data: world, error: worldError } = await supabase
      .from("worlds")
      .select("id")
      .eq("id", worldId)
      .single();
      
    if (worldError || !world) {
      return c.json({ error: "World not found" }, 404);
    }

    // Get logs for this world
    const { data: logs, error } = await supabase
      .from("activity_logs")
      .select(`
        id,
        entity_type,
        entity_id,
        action,
        details,
        created_at,
        user:users(email)
      `)
      .eq("world_id", worldId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching world logs:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ logs: logs || [] });
  } catch (error: any) {
    console.error("World logs GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});
```

---

### 4. **RLS Policy Update**

```sql
-- Update existing RLS policy to also allow world-based access
DROP POLICY IF EXISTS activity_logs_read_own ON activity_logs;

CREATE POLICY activity_logs_read_own ON activity_logs
  FOR SELECT
  USING (
    -- Can read if user owns the project
    (project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    ))
    OR
    -- OR if user owns the world
    (world_id IN (
      SELECT id FROM worlds 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    ))
  );
```

---

## 🧪 Testing nach Implementation

1. **Welt erstellen** → Log mit action='created' erscheint
2. **Welt umbenennen** → Log mit action='updated' und name change erscheint
3. **Kategorie hinzufügen** → Log mit entity_type='category' erscheint
4. **Asset hinzufügen** → Log mit entity_type='asset' erscheint
5. **Welt löschen** → Log mit action='deleted' erscheint

6. **Frontend Dialog öffnen** → Logs Tab zeigt alle Activities
7. **Filter testen** → Entity Type & Action Filter funktionieren
8. **Log Details** → Expandable Details zeigen JSON korrekt

---

## 📊 Deployment Checklist

- [ ] Migration 031 erstellen und deployen
- [ ] Trigger Functions deployen
- [ ] Edge Function Route hinzufügen
- [ ] RLS Policy updaten
- [ ] Frontend testen
- [ ] Dokumentation updaten

---

## 💡 Alternative: Shared Entity Logs Table

**Wenn mehr Entities (Gym, etc.) auch Logs brauchen:**

Statt `project_id` und `world_id` könnte man ein generisches System verwenden:

```sql
ALTER TABLE activity_logs
DROP COLUMN project_id,
ADD COLUMN entity_parent_type TEXT, -- 'project', 'world', 'gym_exercise', etc.
ADD COLUMN entity_parent_id UUID;   -- ID of parent entity

CREATE INDEX idx_activity_logs_parent 
ON activity_logs(entity_parent_type, entity_parent_id, created_at DESC);
```

**Vorteil:** Flexibler, skaliert besser  
**Nachteil:** Keine Foreign Key Constraints, komplexere Queries  

---

**Erstellt:** 09.11.2025  
**Status:** Optional TODO  
**Frontend:** ✅ Bereits vorbereitet  
**Backend:** ⏳ Wartet auf Implementation
