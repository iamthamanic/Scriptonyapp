# 🎯 MODELL AUSWAHL - Kompletter Guide

## 📍 Wo ist die Modell-Auswahl?

Die Modellauswahl ist **im Chat Settings Dialog** unter dem **"Modell & Prompt"** Tab!

---

## 🎨 UI Flow - Schritt für Schritt:

### **1️⃣ ScriptonyAssistant öffnen**
```
Klicke auf den violetten Floating Chat Button (unten rechts)
```

### **2️⃣ Chat Settings öffnen**
```
Klicke auf "Chat Settings" Button
→ Dialog öffnet sich mit 3 Tabs
```

### **3️⃣ Tabs im Dialog:**

```
┌─────────────────────────────────────────────────┐
│  Chat Settings                             [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [API Keys]  [Modell & Prompt]  [RAG Database] │
│   ^^^^^^^^    ^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^ │
│   Tab 1         Tab 2 ⭐          Tab 3         │
└─────────────────────────────────────────────────┘
```

---

## ⭐ Tab 2: "Modell & Prompt" - HIER IST DIE MODELLAUSWAHL!

### **Wenn du einen API Key hast:**

```
┌─────────────────────────────────────────────────┐
│  Aktiver Provider                               │
│  ┌─────────────┐                                │
│  │ [OpenRouter] │ ← Orange Badge                │
│  └─────────────┘                                │
│                                                 │
│  Modell ⭐                                      │
│  ┌──────────────────────────────────────────┐  │
│  │  openai/gpt-4o-mini               [▼]   │  │ ← DROPDOWN!
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Klick drauf → Alle verfügbaren Modelle!       │
│                                                 │
│  Temperature: 0.70                              │
│  ├──────────●────────────────────────┤         │
│                                                 │
│  Max Tokens: 2000                               │
│  ├──────────────●──────────────────┤           │
│                                                 │
│  System Prompt                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Du bist Scriptony AI...              │  │
│  │                                          │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│  [Prompt speichern]                             │
└─────────────────────────────────────────────────┘
```

---

## 🔥 Wie funktioniert die Modellauswahl?

### **OpenRouter - Alle Modelle verfügbar:**
```
Klick auf Modell Dropdown:

┌────────────────────────────────────────┐
│ openai/gpt-4o                      ✓  │ ← GPT-4 Flagship
│ openai/gpt-4o-mini                    │ ← Schnell & günstig
│ anthropic/claude-3.5-sonnet           │ ← Claude 3.5
│ anthropic/claude-3-opus               │ ← Claude 3 Opus
│ google/gemini-pro                     │ ← Gemini
│ meta-llama/llama-3.1-70b-instruct     │ ← Llama 3.1
│ mistralai/mistral-large              │ ← Mistral
└────────────────────────────────────────┘
```

**Das Schöne an OpenRouter:**
- ✅ Ein Key, alle Modelle!
- ✅ Einfach im Dropdown umschalten
- ✅ Keine separate Konfiguration nötig

### **OpenAI - Nur OpenAI Modelle:**
```
┌────────────────────────────────────────┐
│ gpt-4o                             ✓  │
│ gpt-4o-mini                           │
│ gpt-4-turbo                           │
│ gpt-4                                 │
│ gpt-3.5-turbo                         │
└────────────────────────────────────────┘
```

### **Anthropic - Nur Claude Modelle:**
```
┌────────────────────────────────────────┐
│ claude-3-5-sonnet-20241022         ✓  │
│ claude-3-5-haiku-20241022             │
│ claude-3-opus-20240229                │
│ claude-3-sonnet-20240229              │
│ claude-3-haiku-20240307               │
└────────────────────────────────────────┘
```

### **Google - Nur Gemini Modelle:**
```
┌────────────────────────────────────────┐
│ gemini-pro                         ✓  │
│ gemini-pro-vision                     │
└────────────────────────────────────────┘
```

---

## 🎯 Workflow: Modell wechseln

### **Szenario 1: Zwischen OpenRouter Modellen wechseln**

1. ✅ Chat Settings öffnen
2. ✅ Tab "Modell & Prompt" wählen
3. ✅ Dropdown "Modell" öffnen
4. ✅ Neues Modell auswählen (z.B. `anthropic/claude-3.5-sonnet`)
5. ✅ **AUTOMATISCH GESPEICHERT!** 🎉
6. ✅ Nächster Chat verwendet das neue Modell

**Kein "Speichern" Button nötig!** Das Modell wird sofort beim Auswählen gespeichert.

### **Szenario 2: Zwischen Providern wechseln**

Du hast mehrere API Keys (z.B. OpenRouter + OpenAI)?

1. ✅ Chat Settings öffnen
2. ✅ Tab "API Keys" wählen
3. ✅ Siehe deine gespeicherten Keys:
   ```
   [OpenRouter] sk-or-***xyz1  [Aktiv]  🗑
   [OpenAI]     sk-***abc2     [Aktivieren] 🗑
   ```
4. ✅ Klicke auf **"Aktivieren"** Button beim Provider den du verwenden willst
5. ✅ Provider wird gewechselt + Modelle neu geladen
6. ✅ Tab "Modell & Prompt" zeigt jetzt die neuen verfügbaren Modelle
7. ✅ **FERTIG!** ✨

**Jetzt implementiert!** Du kannst nahtlos zwischen Providern wechseln!

---

## 🔧 Backend: Wie werden Modelle geladen?

### **1. Provider Detection:**
```typescript
// User fügt Key ein → Backend erkennt Provider
POST /ai/detect-provider
Body: { api_key: "sk-or-v1-..." }

Response: {
  provider: "openrouter",
  default_model: "openai/gpt-4o-mini",
  available_models: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-sonnet",
    // ...
  ]
}
```

### **2. Settings Laden:**
```typescript
// Beim Öffnen der Settings
GET /ai/settings

Response: {
  settings: {
    active_provider: "openrouter",
    active_model: "openai/gpt-4o-mini",
    openrouter_api_key: "sk-or-***",
    // ...
  }
}

// Frontend macht dann:
POST /ai/detect-provider mit dem aktuellen Key
→ Lädt available_models
```

### **3. Modell Wechseln:**
```typescript
// User wählt neues Modell im Dropdown
PUT /ai/settings
Body: { active_model: "anthropic/claude-3.5-sonnet" }

Response: {
  settings: { /* updated settings */ },
  available_models: [ /* same models */ ]
}
```

---

## 🎨 UI Details

### **Modell Dropdown Design:**
```typescript
<Select
  value={settings.active_model}
  onValueChange={(value) => updateSettings({ active_model: value })}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {availableModels.map((model) => (
      <SelectItem key={model} value={model}>
        {model}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Features:**
- ✅ Zeigt aktuell gewähltes Modell
- ✅ Dropdown mit allen verfügbaren Modellen
- ✅ Auto-Save beim Auswählen
- ✅ Lädt neue Modelle wenn Provider gewechselt wird

### **Provider Badge Design:**
```typescript
<Badge className={PROVIDER_COLORS[settings.active_provider]}>
  {PROVIDER_NAMES[settings.active_provider]}
</Badge>
```

**Colors:**
- 🟢 OpenAI = Grün
- 🟣 Anthropic = Lila
- 🔵 Google = Blau
- 🟠 OpenRouter = Orange

---

## 💡 Häufige Fragen

### ❓ "Ich sehe keine Modelle im Dropdown?"

**Problem:** `availableModels` Array ist leer

**Lösung:**
1. Stelle sicher du hast einen API Key gespeichert
2. Gehe zu Tab "API Keys" und prüfe ob ein Key aktiv ist
3. Hard Refresh: `Cmd/Ctrl + Shift + R`
4. Console öffnen und schauen nach Fehlern

### ❓ "Warum kann ich nur OpenAI Modelle sehen wenn ich OpenRouter habe?"

**Problem:** Backend erkennt `sk-or-` nicht korrekt

**Lösung:**
1. Migration `003_add_openrouter_support.sql` ausführen
2. Server neu deployen
3. Hard Refresh

### ❓ "Wie füge ich ein neues Modell hinzu?"

**Backend erweitern:**
```typescript
// /supabase/functions/server/routes-ai-chat.tsx

function getAvailableModels(provider: string): string[] {
  const models: Record<string, string[]> = {
    openrouter: [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'mein-neues-modell', // ← Hier hinzufügen!
    ],
  };
  return models[provider] || [];
}
```

**Server neu deployen:**
```bash
supabase functions deploy make-server-3b52693b
```

**Hard Refresh** und neues Modell sollte sichtbar sein!

---

## 🚀 Quick Test

### **Test 1: Modell wechseln**
1. ✅ Chat Settings öffnen
2. ✅ Tab "Modell & Prompt"
3. ✅ Dropdown öffnen
4. ✅ Anderes Modell wählen
5. ✅ Console: sollte `PUT /ai/settings` Request sehen
6. ✅ Toast: "Einstellungen gespeichert"
7. ✅ Neue Chat Nachricht senden
8. ✅ Sollte neues Modell verwenden (in Response sichtbar)

### **Test 2: OpenRouter Multi-Model**
1. ✅ OpenRouter Key hinzufügen
2. ✅ Tab "Modell & Prompt"
3. ✅ Dropdown sollte 7+ Modelle zeigen
4. ✅ Wähle GPT-4o → Sende Chat
5. ✅ Wähle Claude 3.5 → Sende Chat
6. ✅ Beide sollten funktionieren!

---

## 🎯 Zusammenfassung

### **Wo ist die Modellauswahl?**
```
ScriptonyAssistant 
  → Chat Settings 
    → Tab "Modell & Prompt" 
      → Dropdown "Modell" ⭐
```

### **Was passiert beim Auswählen?**
```
User wählt Modell 
  → Frontend: PUT /ai/settings { active_model: "..." }
  → Backend: Speichert in user_ai_settings Tabelle
  → Frontend: Toast "Gespeichert" ✅
  → Nächster Chat: Verwendet neues Modell
```

### **OpenRouter = Best of All Worlds:**
```
Ein Key = 7+ Modelle
  → GPT-4o (OpenAI)
  → Claude 3.5 (Anthropic)
  → Gemini Pro (Google)
  → Llama 3.1 (Meta)
  → Mistral Large (Mistral)
  
Einfach im Dropdown wechseln! 🎉
```

---

## ✅ Was du jetzt wissen musst:

1. **Modellauswahl ist FERTIG** - sie ist im Dialog unter "Modell & Prompt"
2. **Auto-Save** - Modell wird sofort gespeichert beim Auswählen
3. **OpenRouter** - Zugriff auf alle Top-Modelle mit einem Key
4. **Direkte Provider** - Nur die Modelle des jeweiligen Providers
5. **Dropdown UI** - Zeigt alle verfügbaren Modelle für deinen Provider

**Du musst nichts extra machen - es funktioniert bereits!** 🎉

---

## 🔜 Nächste Verbesserung (Optional):

**Provider Switcher UI:**
- Aktuell: Letzter hinzugefügter Key ist aktiv
- Besser: Button zum Wechseln zwischen gespeicherten Keys
- UI Idee: Klickbare Badges in Tab "API Keys"

**Soll ich das implementieren?** 🤔
