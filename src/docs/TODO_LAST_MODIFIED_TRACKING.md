# 🕐 TODO: Last Modified Tracking mit User ID

**Status:** ⚠️ Frontend implementiert, Backend noch ausstehend  
**Datum:** 2025-11-01  
**Priority:** 🟡 Medium (Enhancement)

## 📋 Was bereits fertig ist

### ✅ Frontend (Komplett):
1. **TypeScript Interface erweitert** (`/lib/types/index.ts`)
   - `Shot` Interface hat jetzt `updatedBy?: string` field
   
2. **RichTextEditorModal erweitert** (`/components/RichTextEditorModal.tsx`)
   - Akzeptiert `lastModified` prop mit `timestamp` und `userName`
   - Zeigt im Footer: "🕐 01.11.2025, 15:45 • Max Mustermann"
   - Falls kein User: nur Timestamp
   
3. **ShotCard integriert** (`/components/ShotCard.tsx`)
   - Nutzt `useAuth()` um aktuellen User zu holen
   - Übergibt `shot.updatedAt` und `user.name` an Modal
   - Beide Modals (Dialog & Notes) zeigen Last Modified an

## ⚠️ Was noch fehlt (Backend)

### 🔴 Supabase Migration needed:

```sql
-- /supabase/migrations/XXX_add_updated_by_tracking.sql

-- Add updated_by column to timeline_nodes (shots)
ALTER TABLE timeline_nodes 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_timeline_nodes_updated_by 
ON timeline_nodes(updated_by);

-- Trigger to auto-update updated_by on change
CREATE OR REPLACE FUNCTION update_timeline_node_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid(); -- Supabase auth helper
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
DROP TRIGGER IF EXISTS set_timeline_node_updated_by ON timeline_nodes;
CREATE TRIGGER set_timeline_node_updated_by
  BEFORE UPDATE ON timeline_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_node_modified();
```

### 🔴 Edge Function Update:

**File:** `/supabase/functions/scriptony-timeline-v2/index.ts`

1. **SELECT Query erweitern:**
```typescript
// In allen SELECT queries updated_by hinzufügen
SELECT 
  n.*,
  u.email as updated_by_email,
  u.raw_user_meta_data->>'name' as updated_by_name
FROM timeline_nodes n
LEFT JOIN auth.users u ON n.updated_by = u.id
WHERE ...
```

2. **Response Type erweitern:**
```typescript
interface TimelineNode {
  // ... existing fields
  updated_by?: string;
  updated_by_name?: string; // For display
}
```

## 🎯 Aktuelles Workaround (Frontend-Only)

Momentan zeigt das Frontend:
- ✅ **Timestamp:** Korrekt von `shot.updatedAt` (Backend tracked)
- ⚠️ **Username:** Aktuell eingeloggter User (nicht der wirkliche Editor!)

Das funktioniert für Single-User oder lokales Testing, aber für Multi-User Teams brauchen wir das Backend Update.

## 🚀 Deploy Reihenfolge (wenn Backend ready)

1. **Migration ausführen** im Supabase Dashboard
2. **Edge Function deployen** mit erweiterten Queries
3. **Frontend testen** - sollte automatisch funktionieren!

## 💡 Alternative: Simplified Approach

Falls wir erstmal ohne User-Tracking leben können:
- ✅ Nur Timestamp anzeigen (funktioniert jetzt schon!)
- Remove `userName` aus Modal display:

```tsx
<span>
  Zuletzt geändert: {formatDate(lastModified.timestamp)}
</span>
```

## 📝 Notes

- `updated_at` wird automatisch von Supabase getriggert
- `updated_by` braucht custom trigger mit `auth.uid()`
- Für historische Daten: Backfill mit `current_user_id()` nicht möglich
- Alternative: `created_by` falls wir auch Creator tracken wollen

---

**Zusammenfassung:** Frontend ist ready, Backend braucht Migration + Edge Function Update. Momentan zeigt es den **aktuell eingeloggten User** statt dem wirklichen Editor.
