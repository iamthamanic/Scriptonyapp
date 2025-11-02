# ⚡ QUICK DEPLOY: Stats & Logs Phase 2

**Estimated Time:** 10 Minuten  
**Files to Deploy:** 2 Edge Functions + 1 Migration  
**Breaking Changes:** Keine  
**Rollback:** Möglich (Phase 1 weiterhin kompatibel)

---

## ✅ CHECKLIST

- [ ] **1. Migration** (1 Min) - activity_logs Tabelle
- [ ] **2. scriptony-stats** (3 Min) - Edge Function Update
- [ ] **3. scriptony-logs** (3 Min) - Edge Function Update
- [ ] **4. Health Checks** (1 Min) - Verify Deployment
- [ ] **5. User Test** (2 Min) - Open Stats Dialog

---

## 🚀 STEP 1: MIGRATION (1 Min)

**Nur falls noch nicht geschehen!**

### Im Supabase Dashboard:

1. **SQL Editor** öffnen
2. **Neues Query**
3. **Copy-paste** kompletten Inhalt von `/supabase/migrations/021_activity_logs_system.sql`
4. **Run** klicken

**Was wird erstellt:**
- `activity_logs` Tabelle
- 3 Indexes (Performance)
- 2 RLS Policies
- 3 Trigger Functions (timeline_nodes, characters, projects)
- 3 Triggers (aktiviert)

**Execution:** < 1 Sekunde

---

## 🚀 STEP 2: SCRIPTONY-STATS (3 Min)

### Im Supabase Dashboard:

1. **Edge Functions** → **scriptony-stats**
2. **Editor öffnen**
3. **Kompletten Code ersetzen** mit `/supabase/functions/scriptony-stats/index.ts`
4. **Deploy** klicken

**Neue Funktionen:**
- Shot Analytics (durations, angles, framings)
- Character Analytics (appearances, top 10)
- Timeline Analytics (hierarchy)
- Media Analytics (audio, images)

**Deploy Time:** ~2 Minuten

---

## 🚀 STEP 3: SCRIPTONY-LOGS (3 Min)

### Im Supabase Dashboard:

1. **Edge Functions** → **scriptony-logs**
2. **Editor öffnen**
3. **Kompletten Code ersetzen** mit `/supabase/functions/scriptony-logs/index.ts`
4. **Deploy** klicken

**Neue Funktionen:**
- Project Logs (paginated)
- Entity Logs (entity-specific)
- User Logs (user activity)
- Recent Logs (last 10)

**Deploy Time:** ~2 Minuten

---

## 🧪 STEP 4: HEALTH CHECKS (1 Min)

### Test in Browser oder cURL:

```bash
# scriptony-stats
https://[PROJECT_ID].supabase.co/functions/v1/scriptony-stats/health

# Expected:
{
  "status": "ok",
  "function": "scriptony-stats",
  "version": "2.0.0",
  "phase": "2 (Complete Implementation)"
}

# scriptony-logs
https://[PROJECT_ID].supabase.co/functions/v1/scriptony-logs/health

# Expected:
{
  "status": "ok",
  "function": "scriptony-logs",
  "version": "2.0.0",
  "phase": "2 (Complete Implementation)"
}
```

**✅ Beide müssen 200 OK returnen!**

---

## 🧪 STEP 5: USER TEST (2 Min)

### Test Flow:

1. **ProjectsPage** öffnen
2. **Project Card** → **3-Punkte-Menü** (⋮)
3. **"Project Stats & Logs"** klicken
4. **Statistics Tab:**
   - ✅ Timeline Overview (Acts, Sequences, Scenes, Shots)
   - ✅ Shot Analytics Charts (wenn Shots vorhanden)
   - ✅ Character Analytics Chart (wenn Characters vorhanden)
   - ✅ Media Stats (Audio Files, Images Count)
5. **Logs Tab:**
   - ✅ Recent Activity wird geladen
   - ✅ Logs zeigen User, Action, Entity Type
   - ✅ Relative Timestamps ("vor X Min")

### Test Activity Logging:

6. **Neue Scene erstellen** (oder andere Action)
7. **Stats Dialog neu öffnen** → **Logs Tab**
8. ✅ **Neue Activity sollte sichtbar sein!**

---

## ✅ SUCCESS CRITERIA

**Phase 2 ist erfolgreich deployed wenn:**

- [x] Migration 021 ausgeführt (keine Errors)
- [x] scriptony-stats Health Check: `200 OK`
- [x] scriptony-logs Health Check: `200 OK`
- [x] Stats Dialog zeigt Charts
- [x] Logs Tab zeigt Activity Timeline
- [x] Neue Actions werden geloggt
- [x] Keine Console Errors

---

## 🐛 TROUBLESHOOTING

### Problem: "Unauthorized" Error

**Solution:**
- User eingeloggt?
- Token korrekt?
- RLS Policies aktiviert?

### Problem: Logs Tab leer

**Solution:**
- Migration 021 deployed?
- Triggers aktiviert? (Check SQL Editor)
- Action durchgeführt? (z.B. Scene erstellen)

### Problem: Charts zeigen keine Daten

**Solution:**
- Projekt hat Shots? (Level 4 Nodes)
- Shots haben Camera Angle/Framing gesetzt?
- Console Logs checken (F12)

---

## 📚 DETAILED DOCS

Für ausführliche Dokumentation siehe:

- `/DEPLOY_project_stats_logs_PHASE2.md` - Complete Guide
- `/PROJECT_STATS_LOGS_PHASE2_COMPLETE.md` - Feature Summary
- `/MICROSERVICES_OVERVIEW.md` - Architecture

---

## 🎉 DONE!

**Nach erfolgreichem Deployment hast du:**

- 📊 Production-Ready Analytics Dashboard
- 📝 Complete Activity Logging
- 🎬 Shot & Character Insights
- 👥 Team Activity Tracking
- 🚀 Professional Production Platform

**Total Time:** ~10 Minuten ⏱️

---

**Viel Erfolg! 🚀**
