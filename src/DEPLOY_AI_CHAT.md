# 🤖 AI Chat System - Deploy Anleitung

## ✅ Was bereits erledigt ist:

1. ✅ **Database Migration** - `002_ai_chat_system.sql` ist ausgeführt
2. ✅ **Backend Routes** - `/supabase/functions/server/routes-ai-chat.tsx` erstellt
3. ✅ **Frontend Components** - AI Chat Page & Settings Tab erstellt
4. ✅ **Navigation** - AI Chat Button hinzugefügt

## 🚀 Nächster Schritt: Server Deploy

### Option 1: Supabase Dashboard (Empfohlen)

1. **Öffne Supabase Dashboard**
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt

2. **Öffne Edge Functions**
   - Sidebar → Functions
   - Finde "make-server-3b52693b"

3. **Deploy Server Code**
   - Klicke auf die Function
   - Klicke "Deploy new version"
   - Kopiere den kompletten Code aus `/supabase/functions/server/index.tsx`
   - Paste den Code
   - Klicke "Deploy"

4. **Überprüfe Environment Variables**
   - Stelle sicher, dass folgende Variablen gesetzt sind:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

### Option 2: Supabase CLI

```bash
# 1. Stelle sicher dass Supabase CLI installiert ist
npm install -g supabase

# 2. Login (falls noch nicht eingeloggt)
supabase login

# 3. Link das Projekt
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy die Function
supabase functions deploy make-server-3b52693b

# 5. Set Environment Variables (falls nicht schon gesetzt)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 Testing nach dem Deploy

### 1. Test Server Health

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3b52693b/health
```

Erwartete Response:
```json
{
  "status": "ok",
  "message": "Scriptony Server is running",
  "timestamp": "2025-10-13T...",
  "version": "1.0.0"
}
```

### 2. Test AI Settings Endpoint

Im Browser (muss eingeloggt sein):
1. Gehe zu **Settings → AI Chat**
2. Öffne Browser Console (F12)
3. Schau nach Fehlern beim Laden der Settings

Oder mit curl:
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3b52693b/ai/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Provider Detection

Im Browser:
1. Gehe zu **Settings → AI Chat**
2. Füge einen API Key ein (z.B. `sk-proj-test123`)
3. Klicke "Erkennen"
4. Sollte automatisch "OpenAI" erkennen

## 🎯 Nach erfolgreichem Deploy

### 1. API Key konfigurieren

1. Gehe zu **Settings → AI Chat**
2. Füge deinen API Key hinzu:
   - **OpenAI**: `sk-proj-...` oder `sk-...`
   - **Anthropic**: `sk-ant-...`
   - **Google**: `AIza...`
3. Klicke "Erkennen"
4. Klicke "Speichern"

### 2. RAG synchronisieren

1. In AI Chat Settings
2. Klicke "RAG-Datenbank synchronisieren"
3. Warte auf Success-Toast
4. ✅ Fertig!

### 3. Ersten Chat starten

1. Gehe zu **AI Chat** (Sparkles Icon in Navigation)
2. Klicke "Neue Unterhaltung"
3. Schreibe eine Nachricht
4. ✅ Erste AI Response!

## 🔧 Troubleshooting

### "Failed to fetch" Error

**Problem**: Server ist nicht erreichbar

**Lösung**:
1. Überprüfe ob Edge Function deployed ist
2. Check Environment Variables
3. Schaue in Supabase Dashboard → Functions → Logs

### "No API key configured" Error

**Problem**: API Key nicht gespeichert

**Lösung**:
1. Gehe zu Settings → AI Chat
2. Füge API Key hinzu
3. Klicke "Erkennen" und dann "Speichern"
4. Reload die Seite

### "Unauthorized" Error

**Problem**: Auth Token fehlt oder ungültig

**Lösung**:
1. Logout und Login erneut
2. Check ob User authentifiziert ist
3. Schaue in Browser Console nach Auth Errors

### Provider Detection schlägt fehl

**Problem**: API Key Format nicht erkannt

**Lösung**:
- OpenAI Keys müssen mit `sk-` beginnen
- Anthropic Keys müssen mit `sk-ant-` beginnen  
- Google Keys müssen mit `AIza` beginnen

### RAG Sync schlägt fehl

**Problem**: Keine Organization oder keine Daten

**Lösung**:
1. Stelle sicher dass User einer Organization zugeordnet ist
2. Erstelle mindestens ein Projekt/Charakter/Welt
3. Versuche erneut zu syncen

## 📊 API Keys bekommen

### OpenAI
1. Gehe zu: https://platform.openai.com/api-keys
2. Klicke "Create new secret key"
3. Kopiere den Key (beginnt mit `sk-proj-...`)
4. **Wichtig**: Speichere ihn sicher, du kannst ihn nicht nochmal sehen!

### Anthropic (Claude)
1. Gehe zu: https://console.anthropic.com/settings/keys
2. Klicke "Create Key"
3. Kopiere den Key (beginnt mit `sk-ant-...`)

### Google (Gemini)
1. Gehe zu: https://makersuite.google.com/app/apikey
2. Klicke "Create API Key"
3. Kopiere den Key (beginnt mit `AIza...`)

## 🎉 Fertig!

Nach dem Deploy hast du:
- ✅ Vollständiges AI Chat System
- ✅ Multi-Provider Support (OpenAI, Anthropic, Google)
- ✅ RAG-Integration für kontextbewusste Antworten
- ✅ Chat History per User in Supabase
- ✅ System Prompt Management
- ✅ Token Usage Tracking

**Viel Spaß mit deinem AI Chat System! 🚀**
