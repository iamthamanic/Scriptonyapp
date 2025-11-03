# 🔍 Failed to Fetch Errors - Diagnosis & Fix Guide

**Erstellt:** 2025-11-02  
**Problem:** `TypeError: Failed to fetch` und `AuthRetryableFetchError: Failed to fetch`

---

## 📋 DIAGNOSE-TOOL

Ich habe ein **Edge Function Debug Panel** erstellt:

### Zugriff:
1. Öffne die App
2. Gehe zu **API Test** Seite (über Navigation oder direkt `/api-test`)
3. Klicke **"Test All"** im Edge Function Debug Panel

Das Panel testet ALLE Edge Functions und zeigt:
- ✓ Welche Functions deployed sind
- ✗ Welche Functions fehlen oder Fehler haben
- ⏱️ Response-Zeiten
- 📊 Detaillierte Error-Meldungen

---

## 🔎 HÄUFIGSTE URSACHEN

### 1. Edge Functions nicht deployed ❌

**Problem:** Die Supabase Edge Functions existieren nur im Code, wurden aber nie ins Supabase Dashboard deployed.

**Symptome:**
```
TypeError: Failed to fetch
HTTP 404: Function not found
```

**Lösung:**
1. Öffne **Supabase Dashboard** → **Edge Functions**
2. Prüfe welche Functions deployed sind
3. Fehlende Functions deployen:
   - Kopiere Code aus `/supabase/functions/FUNCTION_NAME/index.ts`
   - Erstelle neue Function im Dashboard
   - Paste Code ein
   - Deploy

**Kritische Functions (MÜSSEN deployed sein):**
- ✅ `scriptony-auth` - Login/Signup
- ✅ `scriptony-projects` - Project Management
- ✅ `scriptony-project-nodes` - Timeline Nodes
- ✅ `scriptony-shots` - Shots & Filming
- ✅ `scriptony-characters` - Character Management

**Optional (je nach Features):**
- `scriptony-assistant` - AI Chat
- `scriptony-stats` - Statistics
- `scriptony-logs` - Activity Logs
- `scriptony-audio` - Audio Upload
- `scriptony-worldbuilding` - Worlds & Locations

---

### 2. CORS-Konfiguration fehlt ⚠️

**Problem:** Edge Function deployed, aber CORS nicht korrekt konfiguriert.

**Symptome:**
```
Failed to fetch
Access to fetch blocked by CORS policy
```

**Lösung:**

Jede Edge Function MUSS diese CORS-Config haben:

```typescript
import { cors } from "npm:hono/cors";

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));
```

**WICHTIG:** 
- Import von `npm:hono/cors` (NICHT `npm:hono/middleware`)
- MUSS VOR allen anderen Routes kommen
- `origin: "*"` erlaubt alle Origins (für Development OK)

---

### 3. Auth Token fehlt/abgelaufen 🔐

**Problem:** Request ohne gültigen Auth Token.

**Symptome:**
```
AuthRetryableFetchError: Failed to fetch
401 Unauthorized
```

**Lösung:**

Prüfe Auth-Status:
```typescript
import { getAuthToken } from './lib/auth/getAuthToken';

const token = await getAuthToken();
console.log('Auth token:', token ? 'EXISTS' : 'MISSING');
```

Falls Token fehlt:
1. User ist nicht eingeloggt → Login erforderlich
2. Session abgelaufen → Neu einloggen
3. Auth-System defekt → Auth Edge Function prüfen

---

### 4. Network/Firewall-Blockierung 🚧

**Problem:** Corporate Firewall oder Network blockiert Supabase-Requests.

**Symptome:**
```
Failed to fetch
Network request failed
ERR_CONNECTION_REFUSED
```

**Lösung:**

Test mit direktem curl:
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth/health
```

Falls blockiert:
- VPN/Proxy deaktivieren
- Andere Netzwerkverbindung testen
- IT-Admin kontaktieren (Supabase auf Whitelist)

---

### 5. Function crashed/timeout ⏱️

**Problem:** Edge Function antwortet nicht innerhalb Timeout (10s).

**Symptome:**
```
Failed to fetch
Request timeout
Function took too long
```

**Lösung:**

Prüfe Function Logs im Supabase Dashboard:
1. **Edge Functions** → Klicke auf Function
2. Scrolle zu **Logs**
3. Suche nach Errors/Crashes

Häufige Ursachen:
- Cold Start (erste Request dauert länger)
- Infinite Loop im Code
- Database Query hängt
- External API timeout

---

## 🛠️ SCHRITT-FÜR-SCHRITT FIX

### 1. Diagnose starten

```bash
# 1. Öffne App
# 2. Gehe zu /api-test
# 3. Klicke "Test All" im Edge Function Debug Panel
# 4. Warte auf Ergebnisse
```

### 2. Failed Functions identifizieren

Für jede ❌ Error Function:
- Klicke auf Chevron zum Expandieren
- Lies Error-Details
- Folge Anweisungen unten

### 3. Fix durchführen

**Falls "Not Deployed":**
```bash
# 1. Öffne Supabase Dashboard
# 2. Edge Functions → New Function
# 3. Name: scriptony-FUNCTION_NAME (exakt wie im Debug Panel)
# 4. Kopiere Code aus /supabase/functions/FUNCTION_NAME/index.ts
# 5. Deploy
```

**Falls "CORS Error":**
```bash
# 1. Öffne Function im Dashboard
# 2. Prüfe CORS-Config (siehe oben)
# 3. Füge hinzu falls fehlt
# 4. Redeploy
```

**Falls "401 Unauthorized":**
```bash
# 1. Logout aus App
# 2. Login erneut
# 3. Test wiederholen
```

### 4. Validierung

Nach jedem Fix:
1. Warte 30 Sekunden (Deployment braucht Zeit)
2. Im Debug Panel: "Test All" erneut klicken
3. Prüfe ob Function jetzt ✓ grün ist

---

## 🎯 QUICK FIXES

### Alle Functions auf einmal deployen

Falls VIELE Functions fehlen:

1. **Supabase Dashboard** → **Edge Functions**
2. Für jede Function in `/supabase/functions/`:
   - New Function erstellen
   - Code kopieren & pasten
   - Deploy

**Reihenfolge (wichtig → optional):**
1. ✅ `scriptony-auth`
2. ✅ `scriptony-projects`
3. ✅ `scriptony-project-nodes`
4. ✅ `scriptony-shots`
5. ✅ `scriptony-characters`
6. `scriptony-assistant` (AI)
7. `scriptony-stats` (Stats)
8. `scriptony-logs` (Logs)

---

## 🔬 ERWEITERTE DIAGNOSE

### Browser DevTools

```javascript
// Console öffnen (F12)
// Netzwerk-Tab öffnen
// Filtere nach "supabase.co"
// Suche nach Failed Requests (rot)
// Klicke drauf → Details ansehen
```

**Was zu suchen:**
- **Status Code:** 404 = nicht deployed, 401 = auth, 500 = crashed
- **Response:** Error-Message vom Server
- **Timing:** >10s = timeout

### Health Endpoint manuell testen

```bash
# Ersetze YOUR_PROJECT_ID
curl -v https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth/health

# Erwartete Response:
{
  "status": "ok",
  "function": "scriptony-auth",
  "version": "..."
}
```

---

## 📊 STATUS CODES

| Code | Bedeutung | Lösung |
|------|-----------|--------|
| 200 | ✅ OK | Alles gut |
| 401 | 🔐 Unauthorized | Login/Token prüfen |
| 404 | 📦 Not Found | Function deployen |
| 500 | 💥 Server Error | Function Logs prüfen |
| 0 | 🌐 Network Error | CORS/Network prüfen |

---

## ✅ ERFOLGREICHE KONFIGURATION

Nach erfolgreichem Fix sollte das Debug Panel zeigen:

```
✓ 11 OK
✗ 0 Error  
! 0 Not Deployed
```

Alle Functions grün ✓ mit Response-Zeiten < 1000ms.

---

## 🆘 SUPPORT

Falls Fehler weiterhin bestehen:

1. Screenshot vom Debug Panel machen
2. Browser Console Logs kopieren
3. Function Logs aus Supabase Dashboard kopieren
4. Issue erstellen mit allen Infos

---

**Erstellt:** 2025-11-02  
**Tool:** `/components/EdgeFunctionDebugPanel.tsx`  
**Test Page:** `/components/pages/ApiTestPage.tsx`
