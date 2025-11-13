# 🕐 DEPLOY: Auto-Update last_edited Trigger

**Status:** ✅ Ready to Deploy  
**Created:** 2025-11-10  
**Priority:** 🔥 HIGH - Fixes "Zuletzt bearbeitet" Badge  

---

## 🎯 Problem

Wenn du eine Logline, Titel oder andere Projekt-Daten änderst und speicherst, wird das `last_edited` Feld **NICHT automatisch aktualisiert**. 

Das bedeutet: **Das "Zuletzt bearbeitet" Badge zeigt falsche/veraltete Informationen!** 😱

### Was passiert aktuell:
```typescript
// User ändert Logline in ProjectsPage
await projectsApi.update(project.id, {
  logline: "Neue Logline..."
});

// ❌ last_edited bleibt UNVERÄNDERT!
// ❌ Badge zeigt weiterhin altes Datum!
```

---

## ✅ Lösung

Ein **Database Trigger**, der bei **jedem UPDATE** auf der `projects` Tabelle automatisch `last_edited = NOW()` setzt.

### Wie es funktioniert:
1. User ändert **IRGENDEIN** Feld (logline, title, genre, duration, etc.)
2. Trigger feuert **BEFORE UPDATE**
3. `last_edited` wird automatisch auf aktuellen Timestamp gesetzt
4. ✅ "Zuletzt bearbeitet" Badge ist immer korrekt!

---

## 📋 Deploy Schritte

### 1️⃣ Öffne Supabase Dashboard
- Gehe zu **SQL Editor**

### 2️⃣ Kopiere & Führe folgende SQL aus:

```sql
-- =====================================================
-- 🕐 AUTO UPDATE last_edited ON PROJECTS
-- 📅 Created: 2025-11-10
-- 🎯 Purpose: Automatically update last_edited timestamp on any project change
-- =====================================================

-- Function to update last_edited timestamp
CREATE OR REPLACE FUNCTION update_projects_last_edited()
RETURNS TRIGGER AS $$
BEGIN
  -- Always update last_edited to current timestamp on UPDATE
  NEW.last_edited = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS projects_auto_update_last_edited ON projects;
CREATE TRIGGER projects_auto_update_last_edited
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_last_edited();

-- Add comment for documentation
COMMENT ON FUNCTION update_projects_last_edited() IS 'Automatically updates last_edited timestamp on any project update';

-- =====================================================
-- ✅ VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 032 completed! last_edited will now auto-update on project changes.';
END $$;
```

### 3️⃣ Klicke **RUN** ▶️

Du solltest sehen:
```
✅ Migration 032 completed! last_edited will now auto-update on project changes.
```

---

## 🧪 Testing

### Nach dem Deploy:

1. **Öffne ein Projekt** in Scriptony
2. **Ändere die Logline** und klicke **Speichern**
3. **Gehe zur HomePage** zurück
4. ✅ **Das Projekt sollte JETZT als "Zuletzt bearbeitet" markiert sein!**

### SQL Test (optional):
```sql
-- 1. Finde ein Projekt
SELECT id, title, last_edited FROM projects LIMIT 1;

-- 2. Update es
UPDATE projects 
SET logline = 'Test - Trigger sollte last_edited updaten'
WHERE id = 'xxx-deine-projekt-id-xxx';

-- 3. Check last_edited
SELECT id, title, last_edited FROM projects WHERE id = 'xxx-deine-projekt-id-xxx';

-- ✅ last_edited sollte jetzt auf die aktuelle Zeit gesetzt sein!
```

---

## 🎨 UI Änderungen (bereits deployed)

✅ "Zuletzt bearbeitet" Badge wurde bereits in **obere rechte Ecke** verschoben  
✅ Badge ist absolut positioniert mit `shadow-md`  
✅ Erscheint nur beim **ersten Item** (neuestes)

---

## 📦 Dateien

- **Migration:** `/supabase/migrations/032_auto_update_last_edited.sql`
- **Deploy Guide:** `/DEPLOY_AUTO_UPDATE_LAST_EDITED.md` (diese Datei)

---

## 🔄 Rollback (falls nötig)

```sql
-- Trigger entfernen
DROP TRIGGER IF EXISTS projects_auto_update_last_edited ON projects;

-- Function entfernen
DROP FUNCTION IF EXISTS update_projects_last_edited();
```

---

## ✅ Checklist

- [ ] SQL im Supabase Dashboard ausgeführt
- [ ] Success-Meldung erhalten
- [ ] Projekt bearbeitet (Logline geändert)
- [ ] "Zuletzt bearbeitet" Badge erscheint korrekt
- [ ] Badge ist oben rechts positioniert

---

**Nach dem Deploy:** Jede Änderung an einem Projekt (egal welches Feld!) wird automatisch das `last_edited` Feld aktualisieren. Das "Zuletzt bearbeitet" Badge funktioniert jetzt perfekt! 🎉💜
