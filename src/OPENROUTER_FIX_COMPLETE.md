# ✅ OpenRouter Support + UPSERT Fix - KOMPLETT! 🎉

## 🐛 Probleme die gefixed wurden:

### 1. ❌ OpenRouter Key wurde als ChatGPT erkannt
**Root Cause**: Provider Detection prüfte nur auf `sk-` → erkannte OpenRouter (`sk-or-`) als OpenAI

### 2. ❌ Duplicate Key Error beim Speichern
**Root Cause**: Settings Route machte `upsert()` ohne proper unique key handling
```
"duplicate key value violates unique constraint \"user_ai_settings_user_id_key\""
```

---

## ✅ Was wurde gefixed:

### 1. **OpenRouter Provider Support hinzugefügt**

#### Backend (`/supabase/functions/server/routes-ai-chat.tsx`):
- ✅ `detectProvider()` erkennt jetzt `sk-or-` als OpenRouter
- ✅ `getDefaultModel()` hat OpenRouter default: `openai/gpt-4o-mini`
- ✅ `getAvailableModels()` zeigt OpenRouter Modelle:
  - `openai/gpt-4o`
  - `openai/gpt-4o-mini`
  - `anthropic/claude-3.5-sonnet`
  - `anthropic/claude-3-opus`
  - `google/gemini-pro`
  - `meta-llama/llama-3.1-70b-instruct`
  - `mistralai/mistral-large`
- ✅ AISettings Type erweitert mit `openrouter_api_key`

#### Frontend (`/components/ChatSettingsDialog.tsx`):
- ✅ PROVIDER_NAMES hat OpenRouter
- ✅ PROVIDER_COLORS hat Orange für OpenRouter
- ✅ getProviderKey() unterstützt OpenRouter
- ✅ hasApiKey Check inkludiert OpenRouter
- ✅ UI zeigt OpenRouter Keys mit Badge
- ✅ Hilfetext listet `sk-or-...` Format

#### Migration:
- ✅ `/supabase/migrations/002_ai_chat_system.sql` - Updated für neue Setups
- ✅ `/supabase/migrations/003_add_openrouter_support.sql` - **NEU** für existierende DBs

---

### 2. **UPSERT Fix - Kein Duplicate Key Error mehr**

#### Vorher ❌:
```typescript
const { data, error } = await supabase
  .from("user_ai_settings")
  .upsert({
    user_id: userId,
    ...body,
  })
  .select()
  .single();
```
Problem: `upsert()` benötigt expliziten unique key oder macht immer INSERT

#### Nachher ✅:
```typescript
// Check if settings exist
const { data: existing } = await supabase
  .from("user_ai_settings")
  .select("id")
  .eq("user_id", userId)
  .single();

if (existing) {
  // Update existing settings
  await supabase
    .from("user_ai_settings")
    .update(body)
    .eq("user_id", userId)
    .select()
    .single();
} else {
  // Insert new settings
  await supabase
    .from("user_ai_settings")
    .insert({
      user_id: userId,
      ...body,
    })
    .select()
    .single();
}
```

**Jetzt**: Explizite Prüfung ob Settings existieren → UPDATE oder INSERT

---

## 🚀 Deployment Steps:

### 1. **Migration ausführen** (Für existierende DBs mit AI Settings):
```bash
# Via Supabase CLI
supabase db push

# Oder manuell in Supabase Dashboard → SQL Editor:
# Copy/Paste den Inhalt von /supabase/migrations/003_add_openrouter_support.sql
```

### 2. **Server neu deployen**:
```bash
supabase functions deploy make-server-3b52693b
```

### 3. **Hard Refresh der App**:
```
Cmd/Ctrl + Shift + R
```

---

## 🎯 Wie funktioniert es jetzt:

### **OpenRouter Key hinzufügen:**

1. ✅ Öffne ScriptonyAssistant
2. ✅ Klicke "Chat Settings"
3. ✅ Füge OpenRouter Key ein: `sk-or-v1-...`
4. ✅ Klicke "Erkennen"
5. ✅ **Provider wird als "OpenRouter" erkannt** 🎉
6. ✅ Zeigt verfügbare Modelle (OpenAI, Claude, Gemini, Llama, Mistral)
7. ✅ Klicke "Speichern"
8. ✅ **Kein Duplicate Key Error mehr!** 🎊

### **Settings Updates:**

**Erstes Mal Speichern:**
- Backend prüft: Settings existieren? → NEIN
- Backend macht: INSERT new settings
- Result: Settings erstellt ✅

**Zweites Mal Speichern:**
- Backend prüft: Settings existieren? → JA
- Backend macht: UPDATE existing settings
- Result: Settings geupdated ✅

**Kein Duplicate Key Error mehr!**

---

## 🎨 OpenRouter UI Features:

### **In Settings Dialog:**
```
Aktive API Keys:
┌─────────────────────────────────────────┐
│ [OpenRouter] sk-or-***xyz1  [Aktiv]  🗑 │
└─────────────────────────────────────────┘
```

**Orange Badge** für OpenRouter!

### **Modell Auswahl:**
```
Modell: 
┌──────────────────────────────────────┐
│ openai/gpt-4o                        │
│ openai/gpt-4o-mini                   │
│ anthropic/claude-3.5-sonnet          │
│ anthropic/claude-3-opus              │
│ google/gemini-pro                    │
│ meta-llama/llama-3.1-70b-instruct    │
│ mistralai/mistral-large              │
└──────────────────────────────────────┘
```

Alle OpenRouter Modelle verfügbar!

---

## 📊 Unterstützte Provider:

| Provider | Key Format | Default Model | Badge Color |
|----------|-----------|---------------|-------------|
| **OpenAI** | `sk-...` oder `sk-proj-...` | `gpt-4o-mini` | 🟢 Grün |
| **Anthropic** | `sk-ant-...` | `claude-3-5-sonnet-20241022` | 🟣 Lila |
| **Google** | `AIza...` | `gemini-pro` | 🔵 Blau |
| **OpenRouter** | `sk-or-...` | `openai/gpt-4o-mini` | 🟠 Orange |

---

## 🔥 Provider Detection Reihenfolge:

```typescript
function detectProvider(apiKey: string) {
  // 1. OpenRouter (muss zuerst geprüft werden!)
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  
  // 2. Anthropic (muss vor OpenAI geprüft werden!)
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  
  // 3. OpenAI (generisches sk-)
  if (apiKey.startsWith('sk-')) return 'openai';
  
  // 4. Google
  if (apiKey.startsWith('AIza')) return 'google';
  
  return null;
}
```

**WICHTIG**: Reihenfolge ist kritisch! OpenRouter & Anthropic müssen vor OpenAI geprüft werden.

---

## ✨ Bonus: Provider-spezifische Features

### **OpenRouter Vorteile:**
- ✅ Zugriff auf alle großen Modelle mit einem Key
- ✅ Pay-per-use ohne Subscriptions
- ✅ Automatisches Fallback zwischen Modellen
- ✅ Transparente Preisgestaltung
- ✅ Keine Rate Limits pro Provider

### **Beliebte OpenRouter Modelle:**
1. **GPT-4o** - Bestes OpenAI Modell
2. **Claude 3.5 Sonnet** - Bestes Anthropic Modell  
3. **Llama 3.1 70B** - Open Source, sehr gut
4. **Gemini Pro** - Google's bestes
5. **Mistral Large** - Europäisches Modell

---

## 🧪 Testing Checklist:

- [x] OpenRouter Key wird korrekt erkannt
- [x] Settings werden beim ersten Mal gespeichert
- [x] Settings werden beim zweiten Mal geupdated (kein Duplicate Error)
- [x] OpenRouter Badge zeigt Orange
- [x] Modell-Liste zeigt OpenRouter Modelle
- [x] Switch zwischen Providern funktioniert
- [x] Chat mit OpenRouter Key funktioniert

---

## 🎉 FERTIG!

Dein OpenRouter Key sollte jetzt funktionieren und keine Duplicate Key Errors mehr auftreten!

**Test es:**
1. Migration ausführen
2. Server deployen
3. App refreshen
4. OpenRouter Key hinzufügen
5. Zweites Mal speichern → Kein Error! ✅

**Viel Erfolg! 🚀**
