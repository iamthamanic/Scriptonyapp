# 🚨 DEEPSEEK FIX - JETZT AUSFÜHREN!

## Das Problem:
```
Could not find the 'deepseek_api_key' column
```

Die Datenbank-Spalte fehlt noch!

---

## ✅ SCHNELLSTE LÖSUNG (30 Sekunden):

### **1. Öffne Supabase SQL Editor**
https://app.supabase.com/project/YOUR_PROJECT/sql/new

### **2. Kopiere & Führe aus:**

```sql
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
WHERE deepseek_api_key IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_ai_settings.deepseek_api_key IS 'DeepSeek API key (OpenAI-compatible)';
```

### **3. Klick "Run"**

### **4. Reload die App (F5)**

---

## 🎯 Fertig!

Jetzt sollte:
- ✅ Chat ohne Fehler öffnen
- ✅ DeepSeek Key hinzufügen funktionieren
- ✅ "DeepSeek erkannt" angezeigt werden
- ✅ Nur DeepSeek Modelle im Dropdown erscheinen

---

## 🔄 Alternative: Migration Page

Wenn du die SQL nicht manuell ausführen willst:

1. **Navigiere in der App zu:** Navigation → "Migration" (falls vorhanden)
2. **Klick "Run SQL Migrations"**
3. **Warte auf "✅ Migration 007 applied successfully"**
4. **Reload App (F5)**

---

**Nach dem Fix kannst du DeepSeek Keys normal hinzufügen!** 🚀
