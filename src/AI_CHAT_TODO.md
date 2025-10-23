# ✅ AI CHAT - DEINE TO-DO LISTE

## 🎯 Was DU jetzt tun musst

---

## ☑️ SCHRITT 1: Server Deploy (5 Minuten)

### Option A: Supabase CLI (Empfohlen)
```bash
# 1. CLI installieren (falls noch nicht)
npm install -g supabase

# 2. Login
supabase login

# 3. Projekt linken
supabase link --project-ref DEIN_PROJECT_REF

# 4. Function deployen
supabase functions deploy make-server-3b52693b
```

### Option B: Supabase Dashboard
1. ✅ Gehe zu: https://supabase.com/dashboard
2. ✅ Wähle dein Projekt
3. ✅ Sidebar → **Functions**
4. ✅ Finde "make-server-3b52693b"
5. ✅ Klicke "Deploy new version"
6. ✅ Kopiere Code aus `/supabase/functions/server/index.tsx`
7. ✅ Paste in Editor
8. ✅ Klicke "Deploy"
9. ✅ Warte auf Success Message

### Verify Deploy
```bash
# Test ob Server läuft
curl https://DEIN_PROJECT_ID.supabase.co/functions/v1/make-server-3b52693b/health

# Erwartete Response:
# {"status":"ok","message":"Scriptony Server is running",...}
```

**Status**: ⬜ TODO → ✅ ERLEDIGT

---

## ☑️ SCHRITT 2: API Key holen (2 Minuten)

Wähle einen Provider:

### OpenAI (Empfohlen für Start)
1. ✅ Gehe zu: https://platform.openai.com/api-keys
2. ✅ Klicke "Create new secret key"
3. ✅ Name: "Scriptony AI Chat"
4. ✅ Kopiere Key (beginnt mit `sk-proj-...`)
5. ✅ **WICHTIG**: Speichere Key sicher (nicht wiederholt anzeigbar!)

### Anthropic (Claude)
1. ✅ Gehe zu: https://console.anthropic.com/settings/keys
2. ✅ Klicke "Create Key"
3. ✅ Kopiere Key (beginnt mit `sk-ant-...`)

### Google (Gemini) - KOSTENLOS!
1. ✅ Gehe zu: https://makersuite.google.com/app/apikey
2. ✅ Klicke "Create API Key"
3. ✅ Kopiere Key (beginnt mit `AIza...`)

**Dein API Key**: _______________________________________________

**Status**: ⬜ TODO → ✅ ERLEDIGT

---

## ☑️ SCHRITT 3: API Key in App eintragen (1 Minute)

1. ✅ App öffnen (localhost oder deployed)
2. ✅ Klicke **Settings** (Zahnrad Icon oben rechts)
3. ✅ Klicke Tab **"AI Chat"** (mit Sparkles Icon ✨)
4. ✅ Unter "Neuen API Key hinzufügen":
   - Paste deinen API Key
5. ✅ Klicke **"Erkennen"**
   - Provider wird automatisch erkannt (z.B. "OpenAI erkannt")
6. ✅ Klicke **"Speichern"**
   - Success Toast erscheint
7. ✅ Verify: Dein Key erscheint oben unter "Aktive API Keys"

**Status**: ⬜ TODO → ✅ ERLEDIGT

---

## ☑️ SCHRITT 4: RAG synchronisieren (30 Sekunden, Optional)

RAG = Retrieval-Augmented Generation  
→ AI kennt deine Projekte/Charaktere/Welten

1. ✅ In **Settings → AI Chat**
2. ✅ Scroll nach unten zu "RAG Datenbank"
3. ✅ Klicke **"RAG-Datenbank synchronisieren"**
4. ✅ Warte auf Success Toast
   - "X Einträge in RAG-Datenbank synchronisiert"
5. ✅ Fertig! AI hat jetzt Kontext

**Status**: ⬜ TODO (optional) → ✅ ERLEDIGT

---

## ☑️ SCHRITT 5: Ersten Chat starten! (30 Sekunden)

1. ✅ Navigation → Klicke **"AI Chat"** (Sparkles Icon ✨)
2. ✅ Klicke **"Neue Unterhaltung"**
3. ✅ Schreibe erste Nachricht:
   ```
   "Hallo! Hilf mir bei der Entwicklung meines Protagonisten."
   ```
4. ✅ Drücke **Enter**
5. ✅ 🎉 **Erste AI Response!**

**Status**: ⬜ TODO → ✅ ERLEDIGT

---

## 🎯 BONUS: Testing Checklist

Teste alle Features:

### Settings Tests
- ⬜ Multiple API Keys hinzufügen (OpenAI + Anthropic)
- ⬜ Provider wechseln (von OpenAI zu Anthropic)
- ⬜ Modell ändern (z.B. GPT-4o-mini → GPT-4o)
- ⬜ Temperature anpassen (Slider)
- ⬜ System Prompt ändern und speichern
- ⬜ RAG ein/aus schalten
- ⬜ API Key löschen (Mülleimer Icon)

### Chat Tests
- ⬜ Neue Conversation erstellen
- ⬜ Message senden
- ⬜ Mehrere Messages senden (History Test)
- ⬜ Conversation wechseln (Sidebar)
- ⬜ Conversation löschen
- ⬜ Token Count sichtbar
- ⬜ Model Name wird angezeigt
- ⬜ Timestamps korrekt

### RAG Tests
- ⬜ RAG synchronisieren
- ⬜ Chat mit RAG aktiviert
- ⬜ Frage zu spezifischem Projekt/Charakter
- ⬜ AI antwortet mit Kontext aus deinen Daten

### Mobile Tests
- ⬜ Chat UI funktioniert auf Mobile
- ⬜ Sidebar responsive
- ⬜ Input funktioniert auf Touch
- ⬜ Scroll funktioniert

---

## 🐛 Troubleshooting Quick Reference

### "Failed to fetch"
→ Server nicht deployed oder offline  
→ Check: `curl .../health` Endpoint  
→ Lösung: Deploy Server (Schritt 1)

### "No API key configured"
→ API Key nicht gespeichert  
→ Lösung: Schritt 3 wiederholen

### "Unauthorized"
→ Auth Token fehlt  
→ Lösung: Logout + Login erneut

### Provider wird nicht erkannt
→ API Key Format falsch  
→ Check:
  - OpenAI: `sk-...`
  - Anthropic: `sk-ant-...`
  - Google: `AIza...`

### RAG sync schlägt fehl
→ Keine Organization oder keine Daten  
→ Lösung: Erst Projekt/Charakter erstellen

### AI Response dauert ewig
→ Normal! Erste Response = Cold Start (~5s)  
→ Folgende Responses = Schneller (~2s)

---

## 📊 Quick Stats

**Was du bekommst**:
- ✅ 3 AI Provider (OpenAI, Anthropic, Google)
- ✅ 12+ AI Modelle zur Auswahl
- ✅ Unbegrenzte Conversations
- ✅ Unbegrenzte Messages
- ✅ RAG für Smart Context
- ✅ System Prompt Customization
- ✅ Token Usage Tracking
- ✅ Chat History in Supabase
- ✅ Multi-User Support
- ✅ Secure API Key Storage

**Kosten** (Beispiel mit OpenAI gpt-4o-mini):
- 100 Messages à 500 Tokens = ~$0.04
- 1000 Messages = ~$0.40
- Super günstig! 💰

---

## 🎉 Nach Completion

Wenn alle Checkboxen ✅ sind:

**Du hast jetzt**:
- 🤖 Vollständiges AI Chat System
- 💬 Chat History per User
- 🧠 RAG-Integration für kontextbewusste Antworten
- 🔒 Secure & Private
- 🚀 Production Ready

**Nächste Schritte**:
- Nutze AI für Story Development
- Nutze AI für Character Development
- Nutze AI für Worldbuilding
- Nutze AI für Scene Analysis
- Experimentiere mit verschiedenen Modellen
- Passe System Prompt an dein Genre an

---

## 📚 Hilfe & Dokumentation

Wenn du nicht weiterkommst:

1. **DEPLOY_AI_CHAT.md** - Ausführliche Deploy-Anleitung
2. **AI_CHAT_QUICKSTART.md** - 3-Min Quick Start
3. **AI_CHAT_ARCHITECTURE.md** - Technische Details
4. **AI_CHAT_COMPLETE.md** - Vollständige Zusammenfassung

Oder öffne Browser Console (F12) für Error Logs!

---

## ✅ COMPLETION CHECKLIST

Am Ende solltest du haben:

- ✅ Server deployed und läuft
- ✅ API Key konfiguriert
- ✅ RAG synchronisiert (optional)
- ✅ Ersten Chat gesendet
- ✅ AI Response erhalten
- ✅ Token Count gesehen
- ✅ Conversations erstellt/gelöscht getestet
- ✅ Keine Fehler in Console

**Wenn alle ✅ sind: 🎉 FERTIG!**

---

## 🚀 START JETZT!

**Geschätzte Zeit**: 10 Minuten  
**Schwierigkeit**: Einfach  
**Reward**: Voll funktionales AI Chat System! 🎁

**Los geht's!** → Starte mit **SCHRITT 1** 👆

---

**Viel Erfolg! 🚀✨**
