# 🚨 URGENT HOTFIX - Deploy JETZT!

## ❌ Problem
```
Error: record "old" has no field "name"
```

Act/Sequence/Scene Updates schlagen fehl!

---

## ✅ Lösung

Der Nuclear Fix v3 hatte einen **Copy-Paste-Fehler**:
- Verwendete `OLD.name` / `NEW.name`
- Aber timeline_nodes hat **`title`**, nicht `name`!

---

## 📋 DEPLOY STEPS

### 1️⃣ Öffne Supabase Dashboard
```
https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
```

### 2️⃣ Gehe zu SQL Editor
- Klicke auf **"SQL Editor"** im Sidebar
- Klicke auf **"New query"**

### 3️⃣ Kopiere & Paste diese SQL

```sql
-- ================================================================
-- HOTFIX: log_timeline_node_changes - name → title
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
  -- Skip DELETE logging to prevent FK violations
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  v_user_id := auth.uid();
  
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
  
  -- Build changes object (FIXED: use 'title' not 'name')
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
```

### 4️⃣ Run Query
- Klicke auf **"Run"** (oder drücke `Ctrl+Enter`)
- Warte auf **"Success"** Message

### 5️⃣ Test
- Gehe zurück zu Scriptony
- Versuche einen Act-Titel zu ändern
- Sollte jetzt funktionieren! ✅

---

## 🎉 Erfolgsmeldung

Nach dem Deploy solltest du sehen:
```
✅ Act gespeichert
```

Statt:
```
❌ Error: API Error: 500 - record "old" has no field "name"
```

---

## 📝 Was wurde gefixt?

| Vorher (❌) | Nachher (✅) |
|-------------|--------------|
| `'name', NEW.name` | `'title', NEW.title` |
| `'name', OLD.name` | `'title', OLD.title` |

---

**Deploy Time:** ~30 Sekunden  
**Downtime:** Keine  
**Impact:** Kritischer Bug-Fix

🚀 **LOS GEHT'S!**
