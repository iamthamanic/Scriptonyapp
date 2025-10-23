-- =====================================================================
-- DEEPSEEK PROVIDER MIGRATION
-- =====================================================================
-- 
-- Diese Migration fügt DeepSeek als neuen AI Provider hinzu.
-- 
-- ANLEITUNG:
-- 1. Öffne Supabase Dashboard → SQL Editor
-- 2. Cmd+A um alles zu markieren
-- 3. Cmd+C um zu kopieren
-- 4. Im SQL Editor einfügen
-- 5. "Run" klicken (oder Cmd+Enter)
-- 
-- =====================================================================

-- Schritt 1: deepseek_api_key Spalte hinzufügen
ALTER TABLE user_ai_settings
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;

-- Schritt 2: Alten Check Constraint entfernen
ALTER TABLE user_ai_settings
DROP CONSTRAINT IF EXISTS user_ai_settings_active_provider_check;

-- Schritt 3: Neuen Check Constraint mit DeepSeek hinzufügen
ALTER TABLE user_ai_settings
ADD CONSTRAINT user_ai_settings_active_provider_check 
CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'));

-- Schritt 4: Index für schnellere Queries erstellen
CREATE INDEX IF NOT EXISTS idx_user_ai_settings_deepseek_key 
ON user_ai_settings(deepseek_api_key) 
WHERE deepseek_api_key IS NOT NULL;

-- Schritt 5: Spalten-Kommentar hinzufügen
COMMENT ON COLUMN user_ai_settings.deepseek_api_key IS 'DeepSeek API key (OpenAI-compatible)';

-- =====================================================================
-- ERFOLGREICH!
-- 
-- Du solltest jetzt sehen: "Success. No rows returned"
-- 
-- NÄCHSTER SCHRITT:
-- 1. App neu laden (F5)
-- 2. Chat Settings öffnen
-- 3. DeepSeek Key einfügen
-- 4. "Erkennen" klicken
-- 5. "Speichern" klicken
-- 
-- EXPECTED: ✅ Kein Fehler mehr, Key wird gespeichert!
-- =====================================================================
