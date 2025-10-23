# 🤖 AI Chat - Quick Start Guide

## 🎯 3 Schritte zum ersten Chat

### 1️⃣ Server deployen (5 Min)

```bash
# Option A: Supabase CLI
supabase functions deploy make-server-3b52693b

# Option B: Supabase Dashboard
# → Functions → make-server-3b52693b → Deploy new version
# → Kopiere Code aus /supabase/functions/server/index.tsx
```

### 2️⃣ API Key hinzufügen (2 Min)

1. **App öffnen** → Klicke auf **Settings** (Zahnrad oben rechts)
2. **Gehe zu Tab "AI Chat"** (Sparkles Icon ✨)
3. **API Key eingeben**:
   ```
   OpenAI:     sk-proj-...
   Anthropic:  sk-ant-...
   Google:     AIza...
   ```
4. **Klicke "Erkennen"** → Provider wird automatisch erkannt
5. **Klicke "Speichern"**

### 3️⃣ RAG synchronisieren (Optional, 30 Sek)

1. In **AI Chat Settings**
2. Klicke **"RAG-Datenbank synchronisieren"**
3. ✅ Fertig! AI kennt jetzt deine Projekte/Charaktere/Welten

---

## 🚀 Erster Chat

1. **Navigation** → Klicke auf **"AI Chat"** (Sparkles Icon ✨)
2. **Klicke "Neue Unterhaltung"**
3. **Schreibe Nachricht** → Enter drücken
4. ✅ **Erste AI Response!**

---

## 💡 Tipps für bessere Ergebnisse

### System Prompt anpassen
Settings → AI Chat → System Prompt bearbeiten

**Standard**:
```
Du bist Scriptony AI, ein spezialisierter Assistent für Drehbuchautoren...
```

**Eigener Prompt**:
```
Du bist ein Experte für [DEIN GENRE]. 
Gib mir konkrete, umsetzbare Tipps für...
```

### RAG nutzen
- ✅ **RAG aktiviert** = AI nutzt Kontext aus deinen Projekten
- ❌ **RAG aus** = AI kennt nur deine aktuelle Nachricht

**Beispiel mit RAG**:
```
User: "Wie passt Charakter X in meine Geschichte?"
AI: "Basierend auf deinem Projekt 'Mein Film' und dem 
     Charakter 'Max Mustermann' (Motivation: Rache)..."
```

### Model Selection

| Provider | Empfohlenes Modell | Use Case |
|----------|-------------------|----------|
| **OpenAI** | `gpt-4o-mini` | Schnell & günstig |
| | `gpt-4o` | Beste Qualität |
| **Anthropic** | `claude-3-5-sonnet` | Lange Texte |
| | `claude-3-5-haiku` | Schnell |
| **Google** | `gemini-pro` | Kostenlos (Limits) |

### Temperature einstellen

- **0.0 - 0.3**: Präzise, faktisch (z.B. Plot-Struktur)
- **0.7 - 1.0**: Balanced (Standard)
- **1.5 - 2.0**: Sehr kreativ (z.B. Brainstorming)

---

## 🎨 UI Features

### Chat Navigation
- **Conversations Sidebar**: Alle deine Chats
- **Hover → Mülleimer**: Conversation löschen
- **Klick auf Conversation**: Wechselt zur Unterhaltung

### Message Display
- **User Messages**: Rechts, Primärfarbe
- **AI Messages**: Links, Muted Background
- **Timestamps**: Unten bei jeder Message
- **Token Count**: Zeigt Verbrauch an

### Keyboard Shortcuts
- **Enter**: Nachricht senden
- **Shift + Enter**: Neue Zeile

---

## 🔐 Security & Privacy

### API Keys
- ✅ Verschlüsselt in Supabase gespeichert
- ✅ Nie im Frontend exposed
- ✅ Nur für deinen User zugänglich

### Chat History
- ✅ Row Level Security (RLS)
- ✅ Nur eigene Chats sichtbar
- ✅ Andere User können nicht mitlesen

### RAG Database
- ✅ Pro-User isoliert
- ✅ Synct nur eigene Daten
- ✅ Kein Zugriff auf fremde Projekte

---

## 📊 Kosten & Limits

### OpenAI (Pay-as-you-go)
```
gpt-4o-mini:   $0.15 / 1M input tokens
               $0.60 / 1M output tokens

gpt-4o:        $2.50 / 1M input tokens
               $10.00 / 1M output tokens
```

**Beispiel**: 100 Nachrichten à 500 Tokens
- gpt-4o-mini: ~$0.04
- gpt-4o: ~$0.50

### Anthropic
```
claude-3-5-haiku:   $0.25 / 1M input tokens
                    $1.25 / 1M output tokens

claude-3-5-sonnet:  $3.00 / 1M input tokens
                    $15.00 / 1M output tokens
```

### Google Gemini
```
gemini-pro: KOSTENLOS (bis 60 Requests/Min)
```

---

## 🐛 Häufige Probleme

### "API Key erforderlich"
→ Gehe zu Settings → AI Chat → Füge Key hinzu

### "Failed to fetch"
→ Server noch nicht deployed oder offline

### "Unauthorized"
→ Logout + Login erneut

### Provider wird nicht erkannt
→ Check API Key Format:
- OpenAI: `sk-...`
- Anthropic: `sk-ant-...`
- Google: `AIza...`

### RAG findet nichts
→ Erst Projekte/Charaktere erstellen, dann syncen

---

## 🎯 Use Cases

### Story Development
```
"Ich schreibe eine Sci-Fi Story über [X]. 
 Welche Plot-Twists würdest du vorschlagen?"
```

### Character Development
```
"Mein Protagonist ist [Beschreibung].
 Wie kann ich seine Motivation glaubwürdiger machen?"
```

### World Building
```
"Ich habe eine Welt mit [Details].
 Hilf mir, die politische Struktur auszuarbeiten."
```

### Scene Optimization
```
"Hier ist meine Szene: [Text]
 Wie kann ich mehr Spannung aufbauen?"
```

### Dialog Polishing
```
"Dieser Dialog wirkt flach: [Dialog]
 Wie kann ich ihn authentischer machen?"
```

---

## 💎 Pro-Tipps

1. **Nutze RAG für Konsistenz**
   - Synce regelmäßig nach großen Änderungen
   - AI erinnert sich an deine Charaktere/Welten

2. **System Prompt = Dein Experte**
   - Passe ihn an dein Genre an
   - Definiere den Ton der AI

3. **Conversations organisieren**
   - Eine Conversation pro Projekt
   - Oder: Pro Feature (Character, Plot, World)

4. **Modell wechseln je nach Task**
   - Brainstorming → High Temperature + Claude
   - Struktur → Low Temperature + GPT-4o
   - Quick Checks → GPT-4o-mini

5. **Token sparen**
   - Kurze, präzise Prompts
   - RAG nur wenn nötig
   - gpt-4o-mini für einfache Tasks

---

## 📚 Weiterführende Links

- **OpenAI Docs**: https://platform.openai.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **Google AI Studio**: https://ai.google.dev

---

## ✅ Checkliste

- [ ] Server deployed
- [ ] API Key hinzugefügt
- [ ] Provider erkannt
- [ ] RAG synchronisiert (optional)
- [ ] Erste Nachricht geschickt
- [ ] Token Usage gesehen
- [ ] System Prompt angepasst (optional)

**Fertig! Viel Spaß mit deinem AI Chat! 🎉**
