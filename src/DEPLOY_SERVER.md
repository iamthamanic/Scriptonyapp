# 🚀 Server Deployment - Scriptony Edge Function

## ❌ Problem: "Failed to fetch" Fehler

Du siehst Fehler wie:
```
[API FETCH ERROR] GET /worlds/.../items: TypeError: Failed to fetch
Cannot connect to server. Please check:
1. Is your internet working?
2. Is the Supabase Edge Function deployed?
3. Check browser console for CORS errors
```

**Grund:** Die Supabase Edge Function `make-server-3b52693b` ist nicht deployed!

---

## ✅ Lösung: Edge Function deployen

### Option 1: Supabase Dashboard (Empfohlen)

1. **Öffne das Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions
   ```

2. **Create a new function**
   - Name: `make-server-3b52693b`
   - Click "Create function"

3. **Deploy den Code**
   - Kopiere den kompletten Code aus `/supabase/functions/server/index.tsx`
   - Paste ihn in den Editor im Dashboard
   - Click "Deploy"

4. **Warte auf Deployment**
   - Status sollte "Active" werden
   - Die URL wird sein: `https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b`

5. **Teste die Verbindung**
   - Öffne die App
   - Gehe zur API Test Page: In Console: `setCurrentPage("api-test")`
   - Click "Run All Tests"

---

### Option 2: Supabase CLI (Für Entwickler)

**Voraussetzungen:**
```bash
# Installiere Supabase CLI
npm install -g supabase

# Login
supabase login
```

**Deployment:**
```bash
# 1. Link zum Projekt
supabase link --project-ref ctkouztastyirjywiduc

# 2. Deploy die Function
supabase functions deploy make-server-3b52693b --project-ref ctkouztastyirjywiduc

# 3. Check Status
supabase functions list --project-ref ctkouztastyirjywiduc
```

**Bei Problemen:**
```bash
# Alle Dependencies installieren
cd supabase/functions/server
# (Keine package.json nötig - Deno nutzt npm: imports)

# Function lokal testen
supabase functions serve make-server-3b52693b
```

---

## 🔍 Deployment überprüfen

### Test 1: Health Check

```bash
curl https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health
```

**Erwartete Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-12T..."
}
```

### Test 2: In der App

1. **Öffne Browser Console** (F12)
2. **Führe aus:**
   ```javascript
   // Health Check
   fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error);
   ```

3. **Wenn erfolgreich:**
   ```
   {status: "ok", database: "connected", ...}
   ```

4. **Wenn Fehler:**
   - `Failed to fetch` = Server nicht deployed
   - `404` = Falsche URL oder Function existiert nicht
   - `CORS error` = CORS nicht konfiguriert (sollte bereits im Code sein)

---

## 📋 Deployment Checklist

- [ ] Supabase Dashboard geöffnet
- [ ] Edge Function erstellt: `make-server-3b52693b`
- [ ] Code aus `/supabase/functions/server/index.tsx` kopiert
- [ ] Function deployed
- [ ] Status ist "Active"
- [ ] Health Check erfolgreich
- [ ] API Test Page zeigt ✅ Success

---

## 🐛 Häufige Probleme

### Problem: "Function not found"

**Lösung:**
- Name muss EXAKT `make-server-3b52693b` sein
- Keine Leerzeichen, keine Groß-/Kleinschreibung-Fehler

### Problem: "Deployment failed"

**Mögliche Gründe:**
1. **Syntax-Fehler im Code**
   - Check Logs im Dashboard
   - Stelle sicher, dass alle Imports korrekt sind

2. **Missing Dependencies**
   - Deno lädt Dependencies automatisch von `npm:`
   - Sollte kein Problem sein

3. **Environment Variables fehlen**
   - `SUPABASE_URL` - wird automatisch gesetzt ✅
   - `SUPABASE_SERVICE_ROLE_KEY` - wird automatisch gesetzt ✅
   - `SUPABASE_ANON_KEY` - wird automatisch gesetzt ✅

### Problem: "CORS Error"

Der Server hat bereits CORS konfiguriert:
```typescript
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
```

Wenn trotzdem CORS-Fehler auftreten:
- Prüfe ob Pre-flight (OPTIONS) Requests funktionieren
- Check Browser Console für genaue Fehlermeldung

---

## 🎯 Nach erfolgreichem Deployment

1. **Lade die App neu**
   ```
   Ctrl+Shift+R (Hard Reload)
   ```

2. **Auto-Migration läuft**
   - App zeigt "Migration läuft..."
   - ~30 Sekunden warten
   - Console (F12) zeigt Fortschritt

3. **App ist bereit!**
   - Login mit Test-User (auto)
   - Alle Features funktionieren

---

## 🆘 Hilfe

Wenn nichts funktioniert:

1. **Check Supabase Function Logs**
   - Dashboard → Functions → make-server-3b52693b → Logs
   - Zeigt alle Errors und Requests

2. **Browser Console öffnen** (F12)
   - Network Tab → Filter: "make-server"
   - Zeigt alle API Calls

3. **Run API Test Page**
   ```javascript
   setCurrentPage("api-test")
   ```

4. **Contact Support**
   - Screenshot von Logs
   - Screenshot von Network Tab
   - Error Messages aus Console
