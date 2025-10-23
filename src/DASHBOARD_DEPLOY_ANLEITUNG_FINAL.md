# 📋 DASHBOARD DEPLOY - COPY & PASTE ANLEITUNG

## ✅ BEREIT ZUM DEPLOYEN!

Ich habe eine **komplette Single-File Version** erstellt mit:
- ✅ Neuen Tabellennamen (`ai_chat_settings`, `ai_conversations`, `ai_chat_messages`)
- ✅ RAG Sync auf `user_id` (statt `organization_id`)
- ✅ Kein Migration-Import (wurde entfernt)
- ✅ Alle wichtigen Features inline

---

## 🚀 DEPLOYMENT IN 3 SCHRITTEN

### SCHRITT 1: Code kopieren (in Figma Make)

Öffne die Datei:
```
/supabase/functions/deploy-ready/DASHBOARD-DEPLOY-READY.ts
```

**Dann:**
1. Öffne die Datei in Figma Make
2. Drücke `Cmd+A` (alles auswählen)
3. Drücke `Cmd+C` (kopieren)

---

### SCHRITT 2: Supabase Dashboard öffnen

1. Gehe zu: https://supabase.com/dashboard/project/ctkouztastyirjywiduc
2. Linke Sidebar → **Edge Functions**
3. Klicke auf **"Deploy a new function"** ODER wähle `make-server-3b52693b` aus (falls schon vorhanden)

---

### SCHRITT 3: Code einfügen & deployen

1. **Lösche den kompletten alten Code** im Editor (falls vorhanden)
2. Drücke `Cmd+V` (einfügen)
3. **Function Name:** `make-server-3b52693b` (WICHTIG: genau dieser Name!)
4. Klicke **"Deploy function"**

**Warte 30-60 Sekunden** bis Deployment abgeschlossen ist.

---

## ✅ SCHRITT 4: TESTEN

Öffne im Browser:
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "message": "Scriptony Server is running",
  "timestamp": "2025-01-17T...",
  "version": "1.0.0"
}
```

---

## 🔧 WICHTIG: ENVIRONMENT VARIABLES

Der Server braucht diese **Environment Variables**. Die sollten schon gesetzt sein, aber prüfe sicherheitshalber:

**Dashboard → Settings → Edge Functions → Environment Variables**

Stelle sicher, dass diese gesetzt sind:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Falls nicht gesetzt:**
1. Klicke "Add Variable"
2. Name: `SUPABASE_URL`, Value: `https://ctkouztastyirjywiduc.supabase.co`
3. Wiederhole für die anderen Keys

---

## ⚠️ WAS DIESE VERSION ENTHÄLT

### ✅ ENTHALTEN:
- Health Check
- Auth (Signup)
- AI Chat Settings (mit neuen Tabellen!)
- AI Conversations (mit neuen Tabellen!)
- AI Messages (mit neuen Tabellen!)
- RAG Context (user-based!)
- OpenAI Integration
- Token Counting
- Projects CRUD

### ❌ NICHT ENTHALTEN (zu groß für Dashboard):
- MCP Tools (13 Tools - zu viel Code)
- Anthropic/Google/DeepSeek Providers (nur OpenAI)
- Scenes/Characters/Episodes/Worlds CRUD
- RAG Sync Worker
- Advanced Tool Integration

**Für ALLE Features:** Nutze die CLI (siehe `/DEPLOY_JETZT_CLI.md`)

---

## 🎯 NACH DEM DEPLOY

### Test die AI Chat Settings:

```bash
# Hole dein Access Token aus der App
# Dann teste:

curl https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/ai-chat/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Erwartete Antwort:**
```json
{
  "user_id": "...",
  "active_provider": "openai",
  "active_model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 2000,
  "system_prompt": "Du bist ein hilfreicher KI-Assistent...",
  "use_rag": true
}
```

---

## 🐛 TROUBLESHOOTING

### "Function not found"
➡️ **Function Name falsch!** Muss exakt `make-server-3b52693b` heißen.

### "Syntax error"
➡️ **Code nicht vollständig kopiert!** Stelle sicher, dass ALLES kopiert wurde (inkl. erste & letzte Zeile).

### "Environment variable not found"
➡️ **Environment Variables fehlen!** Siehe Abschnitt "ENVIRONMENT VARIABLES" oben.

### "ai_chat_settings does not exist"
➡️ **Migration nicht ausgeführt!** Die Migration `/supabase/migrations/002_ai_chat_SIMPLE.sql` muss im Dashboard ausgeführt sein.

### "OpenAI API key not configured"
➡️ **API Key fehlt!** Setze `OPENAI_API_KEY` in den Environment Variables:
```
Name: OPENAI_API_KEY
Value: sk-...
```

---

## 📊 WAS IST DER UNTERSCHIED ZUR CLI VERSION?

| Feature | Dashboard Version | CLI Version |
|---------|------------------|-------------|
| **Dateien** | 1 große Datei (~700 Zeilen) | 20+ modulare Dateien |
| **AI Providers** | Nur OpenAI | Alle (OpenAI, Anthropic, Google, OpenRouter, DeepSeek) |
| **MCP Tools** | ❌ Nicht enthalten | ✅ 13 Tools |
| **CRUD Routes** | Nur Projects | Projects, Scenes, Characters, Episodes, Worlds |
| **Code Qualität** | Komprimiert | Sauber & modular |
| **Updates** | Alles neu kopieren | 1 Befehl |

**Empfehlung:** Nutze Dashboard für Quick-Tests, CLI für Production! 💪

---

## ✅ ZUSAMMENFASSUNG

```bash
# 1. Code kopieren
Öffne: /supabase/functions/deploy-ready/DASHBOARD-DEPLOY-READY.ts
Cmd+A → Cmd+C

# 2. Dashboard öffnen
https://supabase.com/dashboard/project/ctkouztastyirjywiduc
→ Edge Functions → Deploy new function

# 3. Code einfügen
Cmd+V → Function Name: make-server-3b52693b → Deploy

# 4. Testen
https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health
```

**LOS GEHT'S!** 🚀

---

## 💡 NÄCHSTE SCHRITTE NACH DEPLOY

1. **Teste Health Check** (siehe oben)
2. **Teste AI Settings** in der App
3. **Setze OpenAI API Key** (falls noch nicht)
4. **Erstelle Conversation** im Chat
5. **Sende erste Message**!

**Probleme?** Zeig mir die Fehlermeldung! 💪
