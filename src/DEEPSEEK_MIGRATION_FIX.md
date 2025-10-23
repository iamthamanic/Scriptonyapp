# 🔧 DEEPSEEK MIGRATION FIX

## ❌ Problem

```
Could not find the 'deepseek_api_key' column of 'user_ai_settings' in the schema cache
```

Die Migration `007_add_deepseek_provider.sql` wurde erstellt, aber **nicht ausgeführt**.

---

## ✅ LÖSUNG: Migration manuell ausführen

### **Option 1: Über Migration Page (EMPFOHLEN)**

1. **Öffne die App** im Browser
2. **Gehe zur Migration Page:**
   - Öffne Browser Console (F12)
   - Tippe: `window.location.hash = '#migration'`
   - ODER navigiere manuell zur `/migration` Route
3. **Klicke "Run SQL Migrations"**
4. **Warte bis "✅ Migration 007 applied successfully"**
5. **Reload die App** (F5)

---

### **Option 2: Über API (Fortgeschritten)**

```javascript
// Im Browser Console (F12):

// 1. Auth Token holen
const { data } = await window.supabase.auth.getSession();
const token = data.session?.access_token;

// 2. Migration ausführen
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/make-server-3b52693b/migrate-sql',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log('Migration Result:', result);
```

Ersetze `YOUR_PROJECT` mit deiner Supabase Project URL.

---

### **Option 3: Direkt in Supabase SQL Editor**

1. Gehe zu [Supabase Dashboard](https://app.supabase.com)
2. Öffne **SQL Editor**
3. Kopiere und führe folgendes SQL aus:

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

4. **Klicke "Run"**
5. **Reload die App** (F5)

---

## 🎯 VERIFIZIERUNG

Nach der Migration sollte:

1. ✅ Kein Fehler mehr beim Öffnen des Chats
2. ✅ DeepSeek Key hinzufügen funktioniert
3. ✅ "DeepSeek erkannt" wird angezeigt
4. ✅ Nur DeepSeek Modelle im Dropdown

---

## 📝 WAS WURDE GEFIXT

### **Backend (`sql-migration-runner.tsx`)**

```typescript
const MIGRATIONS = [
  {
    id: '005_mcp_tool_system',
    description: 'MCP Tool System & RAG Auto-Sync',
    sql: `...`
  },
  {
    id: '007_add_deepseek_provider', // ✅ NEU HINZUGEFÜGT!
    description: 'Add DeepSeek Provider Support',
    sql: `
      ALTER TABLE user_ai_settings
      ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;
      
      ALTER TABLE user_ai_settings
      DROP CONSTRAINT IF EXISTS user_ai_settings_active_provider_check;
      
      ALTER TABLE user_ai_settings
      ADD CONSTRAINT user_ai_settings_active_provider_check 
      CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'));
      ...
    `
  }
];
```

---

## 🚨 WICHTIG

- Die Migration ist **idempotent** - kann mehrmals ausgeführt werden ohne Fehler
- Alle `IF NOT EXISTS` Checks sind vorhanden
- Keine Datenverluste

---

## 🔄 NÄCHSTE SCHRITTE NACH MIGRATION

1. **Reload App** (F5)
2. **Öffne Chat Settings**
3. **Füge DeepSeek Key hinzu:**
   - Key: `sk-...` (dein DeepSeek API Key)
   - Klick "Erkennen"
   - Expected: "**DeepSeek erkannt**" (nicht OpenAI!)
   - Klick "Speichern"
4. **Öffne Modell-Dropdown:**
   - Expected: Nur DeepSeek Modelle (deepseek-chat, deepseek-coder, deepseek-v3)
   - **KEINE** OpenAI Modelle!

---

## 📊 MIGRATION STATUS

Prüfe ob Migration erfolgreich war:

```sql
-- Im Supabase SQL Editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_ai_settings' 
AND column_name = 'deepseek_api_key';
```

**Expected Output:**
```
column_name      | data_type
-----------------|-----------
deepseek_api_key | text
```

Wenn diese Zeile erscheint: ✅ Migration erfolgreich!

---

## 🐛 TROUBLESHOOTING

### Problem: "Migration already applied"
**Lösung:** Alles ok! Migration war bereits erfolgreich.

### Problem: "RPC exec_sql not available"
**Lösung:** Nutze Option 3 (Supabase SQL Editor)

### Problem: "Constraint already exists"
**Lösung:** Ignorieren - Migration ist idempotent

---

## ✅ FINAL CHECK

```bash
# App sollte jetzt funktionieren:
✅ Chat öffnet ohne Fehler
✅ DeepSeek Key kann hinzugefügt werden
✅ "DeepSeek erkannt" wird angezeigt
✅ Nur DeepSeek Modelle sichtbar
✅ Chat funktioniert mit DeepSeek
```

---

**Migration ist bereit! Wähle Option 1, 2 oder 3 und führe sie aus.** 🚀
