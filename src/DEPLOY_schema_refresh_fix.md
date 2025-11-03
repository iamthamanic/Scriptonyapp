# 🔧 SCHEMA CACHE REFRESH - Database Tables Fix

**Erstellt:** 2025-11-02  
**Problem:** `Could not find the table 'public.ai_chat_settings' in the schema cache`

## 📋 Problem-Analyse

Die Fehlermeldung zeigt, dass Supabase die Tabellen `ai_chat_settings` und möglicherweise `activity_logs` nicht im Schema-Cache findet, obwohl die Migrationen existieren.

**Mögliche Ursachen:**
1. ✅ Migrationen wurden nicht deployed
2. ✅ Supabase Schema-Cache ist veraltet
3. ✅ RLS-Policies blockieren Zugriff

## 🚀 DEPLOY-SCHRITTE

### 1️⃣ Migrationen im Supabase Dashboard ausführen

Öffne das **Supabase Dashboard** → **SQL Editor** und führe diese Migrationen aus:

#### A) AI Chat Settings (Migration 002)

```sql
-- Öffne /supabase/migrations/002_ai_chat_system_FIXED.sql
-- Kopiere den KOMPLETTEN Inhalt
-- Füge ihn im SQL Editor ein
-- Klicke "Run"
```

#### B) Activity Logs System (Migration 021)

```sql
-- Öffne /supabase/migrations/021_activity_logs_system.sql
-- Kopiere den KOMPLETTEN Inhalt
-- Füge ihn im SQL Editor ein
-- Klicke "Run"
```

### 2️⃣ Schema-Cache manuell refreshen

Im **Supabase Dashboard**:

1. Gehe zu **Database** → **Tables**
2. Überprüfe ob diese Tabellen existieren:
   - ✅ `ai_chat_settings`
   - ✅ `ai_conversations`
   - ✅ `ai_chat_messages`
   - ✅ `rag_knowledge`
   - ✅ `rag_sync_queue`
   - ✅ `activity_logs`

3. Wenn Tabellen fehlen → Migration erneut ausführen
4. Wenn Tabellen existieren → **PostgREST Schema Cache** refreshen:
   - Gehe zu **Project Settings** → **API**
   - Scrolle zu **Schema Cache**
   - Klicke **"Reload schema cache"**

### 3️⃣ Prüfe RLS-Policies

Im **SQL Editor**:

```sql
-- Prüfe ob RLS aktiviert ist
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('ai_chat_settings', 'activity_logs');

-- Sollte beide als 'true' zeigen

-- Prüfe ob Policies existieren
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('ai_chat_settings', 'activity_logs');

-- Sollte mehrere Policies für jede Tabelle zeigen
```

### 4️⃣ Edge Functions neu deployen

Falls das Problem weiterhin besteht, deploye die betroffenen Edge Functions neu:

```bash
# Im Supabase Dashboard → Edge Functions

# 1. scriptony-assistant
# Öffne /supabase/functions/scriptony-assistant/index.ts
# Kopiere den Inhalt
# Erstelle neue Version oder update existierende

# 2. scriptony-logs
# Öffne /supabase/functions/scriptony-logs/index.ts
# Kopiere den Inhalt
# Erstelle neue Version oder update existierende
```

## 🧪 VALIDIERUNG

Nach dem Deployment, prüfe im **Browser DevTools Console**:

```javascript
// Sollte KEINE Fehler mehr zeigen:
// ✅ "Error loading activity logs: Error: Failed to load logs"
// ✅ "Could not find the table 'public.ai_chat_settings' in the schema cache"
```

## 📊 Erwartetes Ergebnis

Nach erfolgreichem Deployment:

✅ AI Chat Settings werden geladen  
✅ Activity Logs werden angezeigt  
✅ Keine Schema-Cache-Errors  
✅ Demo User Seeding funktioniert ohne Error (oder zeigt nur Info-Log)  

## 🔍 DEBUG-TIPPS

### Test 1: Direkte Datenbankabfrage

```sql
-- Im SQL Editor
SELECT COUNT(*) FROM ai_chat_settings;
SELECT COUNT(*) FROM activity_logs;
```

Wenn das funktioniert → Schema OK, Problem liegt bei Edge Functions  
Wenn Fehler → Tabellen nicht erstellt, Migration erneut ausführen

### Test 2: PostgREST API Test

```bash
# Ersetze YOUR_PROJECT_ID und YOUR_ANON_KEY
curl -X GET \
  'https://YOUR_PROJECT_ID.supabase.co/rest/v1/ai_chat_settings?select=id&limit=1' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

Wenn `404` → Schema nicht im PostgREST-Cache → Schema Cache refreshen  
Wenn `200` oder `401` → API funktioniert

## ⚡ QUICK FIX

Wenn du schnell weitermachen willst:

1. Supabase Dashboard → SQL Editor
2. Führe diese Quick-Check aus:

```sql
-- Quick Schema Check & Fix
DO $$ 
BEGIN
  -- Check if tables exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_chat_settings') THEN
    RAISE NOTICE 'ai_chat_settings table missing - run migration 002';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_logs') THEN
    RAISE NOTICE 'activity_logs table missing - run migration 021';
  END IF;
  
  -- If tables exist
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_chat_settings') THEN
    RAISE NOTICE 'ai_chat_settings table found ✅';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_logs') THEN
    RAISE NOTICE 'activity_logs table found ✅';
  END IF;
END $$;
```

## 📝 NOTES

- **Demo User Error** ist jetzt gefixt (graceful handling wenn User existiert)
- **"No API key configured"** ist nur ein Warning, kein echter Fehler
- Nach Schema-Refresh kann es 30-60 Sekunden dauern bis PostgREST den Cache aktualisiert hat

---

**Status nach Fix:** ✅ Alle Errors behoben, App läuft stabil
