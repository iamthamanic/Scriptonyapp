# 🚀 DeepSeek Migration Anleitung

## ❌ **PROBLEM**
```
Could not find the 'deepseek_api_key' column of 'user_ai_settings' in the schema cache
```

Die Datenbank-Spalte `deepseek_api_key` fehlt noch, weil Migration `007` noch nicht ausgeführt wurde.

---

## ✅ **SOFORT-LÖSUNG: SQL in Supabase Dashboard ausführen**

### **Option 1: Supabase Dashboard SQL Editor** ⭐ **EMPFOHLEN**

1. **Öffne dein Supabase Dashboard**
   - https://supabase.com/dashboard
   - Wähle dein Projekt

2. **Gehe zum SQL Editor**
   - Sidebar: "SQL Editor" klicken
   - Oder direkt: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

3. **Kopiere & führe dieses SQL aus:**

```sql
-- =====================================================================
-- Migration 007: Add DeepSeek Provider Support
-- =====================================================================

-- Add deepseek_api_key column
ALTER TABLE user_ai_settings
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;

-- Drop old check constraint
ALTER TABLE user_ai_settings
DROP CONSTRAINT IF EXISTS user_ai_settings_active_provider_check;

-- Add new check constraint with deepseek
ALTER TABLE user_ai_settings
ADD CONSTRAINT user_ai_settings_active_provider_check 
CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_ai_settings_deepseek_key 
ON user_ai_settings(deepseek_api_key) 
WHERE deepseek_api_key IS NOT EXISTS;

-- Add comment
COMMENT ON COLUMN user_ai_settings.deepseek_api_key IS 'DeepSeek API key (OpenAI-compatible)';
```

4. **Klicke "Run"** (oder Strg+Enter)

5. **✅ Erfolg:** Du siehst "Success. No rows returned"

---

### **Option 2: Server Neu Deployen** (Migration läuft automatisch)

```bash
# Im Projekt-Verzeichnis:
deno task deploy
```

Die Migration `007_add_deepseek_provider` wird beim Server-Start automatisch ausgeführt.

---

## **🧪 TESTEN**

1. **App neu laden** (F5)
2. **Chat Settings öffnen**
3. **DeepSeek Key einfügen**
4. **"Erkennen" klicken**
5. **Expected:**
   - ✅ "DeepSeek erkannt"
   - ✅ "Standard-Modell: deepseek-chat"
6. **"Speichern" klicken**
7. **Expected:**
   - ✅ KEIN Fehler mehr!
   - ✅ Key wird gespeichert
   - ✅ DeepSeek Badge erscheint in "Aktive API Keys"

---

## **📊 WAS WURDE GEÄNDERT:**

### **Backend:**
- ✅ Migration `007_add_deepseek_provider.sql` erstellt
- ✅ In `sql-migration-runner.tsx` hinzugefügt
- ✅ `routes-ai-chat.tsx`: DeepSeek als eigener Provider
- ✅ Eigene Modell-Liste für DeepSeek
- ✅ Provider Detection returnt `'deepseek'` statt `'openai'`

### **Frontend:**
- ✅ `ChatSettingsDialog.tsx`: DeepSeek UI Support
- ✅ PROVIDER_NAMES: "DeepSeek" hinzugefügt
- ✅ PROVIDER_COLORS: cyan für DeepSeek
- ✅ "Unterstützte Provider" Liste entfernt
- ✅ Dynamische Provider-Namen-Anzeige

### **Datenbank Schema:**
```sql
-- user_ai_settings Tabelle
ALTER TABLE user_ai_settings
  ADD COLUMN deepseek_api_key TEXT;

-- Constraint aktualisiert
CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'));
```

---

## **🔍 DEBUGGING:**

### **Check ob Migration schon ausgeführt wurde:**

```sql
-- Im Supabase SQL Editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_ai_settings'
  AND column_name = 'deepseek_api_key';
```

**Expected:**
- ✅ Zeigt 1 Row: `deepseek_api_key | text`
- ❌ Zeigt 0 Rows: Migration fehlt → Option 1 ausführen!

---

### **Check Constraint:**

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'user_ai_settings'::regclass 
  AND conname = 'user_ai_settings_active_provider_check';
```

**Expected:**
```
CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'))
```

---

## **💡 WARUM PASSIERT DAS?**

1. **Migration-Datei wurde manuell erstellt** (`007_add_deepseek_provider.sql`)
2. **ABER:** Figma Make liest KEINE Dateien zur Runtime
3. **Lösung:** Migrations müssen in `sql-migration-runner.tsx` als Code embedded sein
4. **Status:** ✅ Bereits gefixt - Migration ist jetzt im Code

---

## **🚀 NACH DER MIGRATION:**

Der Chat sollte jetzt:
- ✅ "**DeepSeek erkannt**" anzeigen (nicht "OpenAI erkannt")
- ✅ Standard-Modell: **deepseek-chat**
- ✅ Im Dropdown: **NUR DeepSeek Modelle** (deepseek-chat, deepseek-coder, deepseek-v3)
- ✅ **KEINE OpenAI Modelle** wenn DeepSeek aktiv

---

**Führe jetzt Option 1 (SQL im Dashboard) aus → Problem sofort gelöst! 🎉**
