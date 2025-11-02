# 🚀 DEPLOY: Project Stats & Logs - Phase 1

**Feature:** Project Stats & Logs Dialog mit 3-Punkte-Menü  
**Datum:** 2025-11-02  
**Phase:** 1 von 2 (Basic UI + Foundation)  
**Status:** ✅ READY TO DEPLOY

---

## 📦 DELIVERABLES

### ✅ Frontend
- **ProjectStatsLogsDialog.tsx** - Modal mit 2 Tabs (Statistics + Logs)
- **ProjectsPage.tsx** - 3-Punkte-Menü (Grid & List View)
- **Funktionen:** Duplicate Project, Delete Project, Stats & Logs

### ✅ Backend
- **Migration 020** - `time_lock`, `max_duration_seconds` Felder
- **scriptony-stats** - Skeleton Edge Function (Phase 2 vorbereitet)
- **scriptony-logs** - Skeleton Edge Function (Phase 2 vorbereitet)

---

## 🎯 PHASE 1 vs PHASE 2

### PHASE 1 (Jetzt deployed):
✅ UI komplett functional  
✅ Basic Stats anzeigen (Acts, Sequences, Scenes, Shots, Characters, Worlds)  
✅ Time Lock Checkbox (UI only, keine Validation)  
✅ Logs Tab zeigt "Coming Soon"  
✅ Edge Functions deployt als Skeleton (Health Checks funktionieren)

### PHASE 2 (Später):
⏳ Shot Analytics (Durations, Camera Angles, Framings, Lenses, Movements)  
⏳ Character Analytics (Appearances, Frequency)  
⏳ Time Lock Enforcement (Backend Validation in scriptony-shots)  
⏳ Activity Logs System (Database Triggers + activity_logs Tabelle)  
⏳ Media Analytics (Audio Files, Images)  
⏳ User Activity Tracking (Edit History pro User)

---

## 📋 DEPLOYMENT STEPS

### 1️⃣ MIGRATION (Supabase Dashboard → SQL Editor)

**Datei:** `/supabase/migrations/020_add_time_lock_to_projects.sql`

```sql
-- Migration: Add time_lock and max_duration_seconds to projects table
-- Phase 1: UI Support (Enforcement kommt in Phase 2)

-- Add time_lock boolean column (default: false)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS time_lock BOOLEAN NOT NULL DEFAULT false;

-- Add max_duration_seconds integer column for time budget tracking
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS max_duration_seconds INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN projects.time_lock IS 'When enabled, total shot durations cannot exceed max_duration_seconds';
COMMENT ON COLUMN projects.max_duration_seconds IS 'Maximum allowed total duration in seconds (used with time_lock)';

-- Index for performance (optional, für spätere Queries)
CREATE INDEX IF NOT EXISTS idx_projects_time_lock ON projects(time_lock) WHERE time_lock = true;
```

**Ausführen:**
1. Supabase Dashboard öffnen
2. SQL Editor → New Query
3. SQL kopieren + pasten
4. Run ausführen
5. ✅ Erfolgreich wenn keine Errors

---

### 2️⃣ EDGE FUNCTION: scriptony-stats

**Location:** Supabase Dashboard → Edge Functions → Create New Function  
**Name:** `scriptony-stats`

**Code kopieren aus:** `/supabase/functions/scriptony-stats/index.ts`

**Deploy-Anleitung:**
1. Dashboard → Edge Functions → "+ Create Function"
2. Name: `scriptony-stats`
3. Code aus Datei kopieren
4. Deploy klicken
5. Testen: `curl https://[PROJECT_ID].supabase.co/functions/v1/scriptony-stats/health`
6. ✅ Erwartete Response:
```json
{
  "status": "ok",
  "function": "scriptony-stats",
  "version": "1.0.0-skeleton",
  "phase": "1 (Skeleton)",
  "timestamp": "2025-11-02T..."
}
```

---

### 3️⃣ EDGE FUNCTION: scriptony-logs

**Location:** Supabase Dashboard → Edge Functions → Create New Function  
**Name:** `scriptony-logs`

**Code kopieren aus:** `/supabase/functions/scriptony-logs/index.ts`

**Deploy-Anleitung:**
1. Dashboard → Edge Functions → "+ Create Function"
2. Name: `scriptony-logs`
3. Code aus Datei kopieren
4. Deploy klicken
5. Testen: `curl https://[PROJECT_ID].supabase.co/functions/v1/scriptony-logs/health`
6. ✅ Erwartete Response:
```json
{
  "status": "ok",
  "function": "scriptony-logs",
  "version": "1.0.0-skeleton",
  "phase": "1 (Skeleton)",
  "timestamp": "2025-11-02T..."
}
```

---

## 🧪 TESTING CHECKLIST

### Frontend Tests:
- [ ] ProjectsPage öffnen
- [ ] 3-Punkte-Menü (⋮) sichtbar in Grid View
- [ ] 3-Punkte-Menü (⋮) sichtbar in List View
- [ ] Menü öffnen → 4 Optionen sichtbar:
  - Edit Project
  - Duplicate Project
  - **Project Stats & Logs** ← NEUE FEATURE!
  - Delete Project

### Stats Dialog Tests:
- [ ] "Project Stats & Logs" klicken
- [ ] Dialog öffnet sich
- [ ] 2 Tabs: "Statistics" + "Logs"
- [ ] Statistics Tab zeigt:
  - ✅ Timeline Overview (Acts, Sequences, Scenes, Shots)
  - ✅ Content (Characters, Worlds)
  - ✅ Metadata (Type, Genre, Duration, Dates)
  - ⚠️ "Advanced Analytics Coming Soon" Placeholder
- [ ] Logs Tab zeigt:
  - ⚠️ "Coming Soon" Message mit Feature-Liste

### Duplicate Project Test:
- [ ] 3-Punkte-Menü → Duplicate Project
- [ ] Toast: "Projekt erfolgreich dupliziert!"
- [ ] Neues Projekt erscheint mit "(Kopie)" im Titel

### Delete Project Test:
- [ ] 3-Punkte-Menü → Delete Project
- [ ] AlertDialog öffnet sich
- [ ] Löschen funktioniert wie vorher

---

## 🔧 TROUBLESHOOTING

### Migration Error: "column already exists"
**Lösung:** Migration wurde bereits ausgeführt → Skip zu Step 2

### Edge Function Deploy Error
**Häufigste Ursachen:**
1. Function Name falsch (muss exakt `scriptony-stats` / `scriptony-logs` sein)
2. Code nicht vollständig kopiert
3. Syntax Error → Check Console Logs im Dashboard

### "Failed to fetch" Error im Frontend
**Prüfen:**
1. Edge Functions deployed? (Dashboard → Edge Functions)
2. Health Check funktioniert? (curl-Test oben)
3. Browser Console → Network Tab → Check Request URL
4. CORS enabled? (Sollte automatisch sein)

### Stats Dialog lädt nicht
**Prüfen:**
1. `/projects/:id/stats` Route existiert in scriptony-projects? (Ja, bereits vorhanden)
2. Browser Console → Check Error Messages
3. Network Tab → Response 401? → Auth Token expired
4. Network Tab → Response 500? → Check Edge Function Logs

---

## 📊 EXPECTED BEHAVIOR (Phase 1)

### ✅ Was funktioniert:
- 3-Punkte-Menü in allen Project Cards
- Stats Dialog öffnet & zeigt Basic Stats
- Duplicate Project funktioniert
- Delete Project funktioniert (wie vorher)
- Time Lock Checkbox (UI only, noch keine Validation)

### ⚠️ Was NOCH NICHT funktioniert:
- Advanced Analytics (Shot Durations, Camera Angles, etc.)
- Activity Logs (Logs Tab ist Placeholder)
- Time Lock Enforcement (keine Backend-Validation)
- Media Stats (Audio/Image Counts)

**Das ist OKAY für Phase 1!** 🎉  
User sehen sofort die neue UI und wir haben Foundation für Phase 2.

---

## 🚀 DEPLOYMENT REIHENFOLGE

**WICHTIG: In dieser Reihenfolge deployen!**

1. ✅ Migration 020 ausführen (SQL Editor)
2. ✅ scriptony-stats deployen (Edge Functions)
3. ✅ scriptony-logs deployen (Edge Functions)
4. ✅ Frontend läuft automatisch (Make Desktop App)

**Total Deploy Time:** ~5-10 Minuten

---

## 📝 NEXT STEPS (Nach Deploy)

### Sofort testen:
1. ProjectsPage öffnen
2. 3-Punkte-Menü klicken
3. "Project Stats & Logs" öffnen
4. Prüfen ob Basic Stats korrekt angezeigt werden

### Phase 2 Planung:
- Shot Analytics implementieren
- Activity Logs System (Trigger + Tabelle)
- Time Lock Enforcement
- Advanced Camera Stats
- User Activity Tracking

**Phase 2 kann iterativ entwickelt werden!** Keine Abhängigkeiten zu Phase 1.

---

## ✅ ERFOLGS-KRITERIEN

**Phase 1 ist erfolgreich deployed wenn:**
- [x] Migration 020 erfolgreich
- [x] scriptony-stats Health Check: 200 OK
- [x] scriptony-logs Health Check: 200 OK
- [x] 3-Punkte-Menü erscheint in ProjectsPage
- [x] Stats Dialog zeigt Basic Stats
- [x] Logs Tab zeigt "Coming Soon"
- [x] Duplicate Project funktioniert
- [x] Keine Console Errors

---

## 🎉 FERTIG!

Nach erfolgreichem Deploy hast du:
- ✅ Professionelles Stats & Logs System (Foundation)
- ✅ Project Duplicate Funktion
- ✅ Modernisierte Project Cards mit 3-Punkte-Menü
- ✅ Skalierbare Architektur für Phase 2

**Phase 2 kann unabhängig entwickelt werden ohne Downtime!** 🚀

---

**Erstellt:** 2025-11-02  
**Version:** 1.0.0  
**Author:** AI Assistant
