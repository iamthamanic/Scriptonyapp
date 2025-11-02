# ⚡ QUICK DEPLOY: Stats & Logs (5 Minuten)

**Feature:** Project Stats & Logs Dialog  
**Status:** ✅ READY  
**Deploy Zeit:** ~5-10 Minuten

---

## 📋 CHECKLIST (Copy-Paste in Browser)

### ✅ Step 1: Migration (2 min)

**Supabase Dashboard → SQL Editor → New Query**

```sql
-- Migration: Add time_lock and max_duration_seconds to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS time_lock BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS max_duration_seconds INTEGER;

COMMENT ON COLUMN projects.time_lock IS 'When enabled, total shot durations cannot exceed max_duration_seconds';
COMMENT ON COLUMN projects.max_duration_seconds IS 'Maximum allowed total duration in seconds (used with time_lock)';

CREATE INDEX IF NOT EXISTS idx_projects_time_lock ON projects(time_lock) WHERE time_lock = true;
```

**Run → Sollte "Success" zeigen**

---

### ✅ Step 2: scriptony-stats deployen (2 min)

**Dashboard → Edge Functions → Create New Function**

**Name:** `scriptony-stats`

**Code:** Öffne `/supabase/functions/scriptony-stats/index.ts` → **ALLES kopieren** → Paste in Editor → Deploy

**Test:**
```bash
curl https://[DEIN_PROJECT_ID].supabase.co/functions/v1/scriptony-stats/health
```

**Expected:**
```json
{"status":"ok","function":"scriptony-stats","version":"1.0.0-skeleton","phase":"1 (Skeleton)","timestamp":"..."}
```

---

### ✅ Step 3: scriptony-logs deployen (2 min)

**Dashboard → Edge Functions → Create New Function**

**Name:** `scriptony-logs`

**Code:** Öffne `/supabase/functions/scriptony-logs/index.ts` → **ALLES kopieren** → Paste in Editor → Deploy

**Test:**
```bash
curl https://[DEIN_PROJECT_ID].supabase.co/functions/v1/scriptony-logs/health
```

**Expected:**
```json
{"status":"ok","function":"scriptony-logs","version":"1.0.0-skeleton","phase":"1 (Skeleton)","timestamp":"..."}
```

---

## 🧪 FUNKTIONS-TEST (1 min)

1. ✅ App öffnen → ProjectsPage
2. ✅ Project Card → 3-Punkte-Menü (⋮) klicken
3. ✅ "Project Stats & Logs" klicken
4. ✅ Dialog öffnet → Statistics Tab zeigt Zahlen
5. ✅ Logs Tab zeigt "Coming Soon"

**Wenn alles klappt:** 🎉 **FERTIG!**

---

## 🐛 TROUBLESHOOTING

### Migration Error: "column already exists"
→ **OK!** Skip to Step 2 (bereits ausgeführt)

### Edge Function Deploy Error
→ Prüfe:
- Function Name exakt `scriptony-stats` / `scriptony-logs`
- Code vollständig kopiert (CTRL+A in Datei)
- Dashboard Console → Check Logs

### "Failed to fetch" im Frontend
→ Prüfe:
- Health Checks funktionieren? (curl-Tests oben)
- Browser Console → Network Tab → Request URL korrekt?
- Auth Token valid? (F5 Refresh)

### Stats Dialog zeigt keine Zahlen
→ Prüfe:
- `/projects/:id/stats` Route existiert? (Ja, bereits vorhanden)
- Browser Console → Check Error
- Network Tab → Response 500? → Check Edge Function Logs

---

## 📊 WAS FUNKTIONIERT JETZT?

✅ 3-Punkte-Menü in Project Cards  
✅ Duplicate Project  
✅ Stats Dialog mit Basic Stats  
✅ Logs Tab (Placeholder)  
✅ Time Lock Checkbox (UI only, noch keine Validation)

## ⏳ WAS KOMMT IN PHASE 2?

⏳ Shot Analytics (Durations, Camera Angles, etc.)  
⏳ Activity Logs (mit Database Triggers)  
⏳ Time Lock Enforcement (Backend Validation)  
⏳ Character Analytics  
⏳ Media Stats

**Siehe:** `/PHASE2_ADVANCED_ANALYTICS_PLAN.md`

---

## 🎉 DONE!

**Total Zeit:** 5-10 Minuten  
**Neues Feature:** ✅ Professional Stats Dashboard  
**Breaking Changes:** ❌ Keine  

**Viel Erfolg!** 🚀
