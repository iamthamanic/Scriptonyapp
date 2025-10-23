# 🔧 Troubleshooting Guide - Scriptony

## Häufige Fehler und Lösungen

### ❌ Error: "Failed to fetch" oder "Request timeout after 30000ms"

**Symptome:**
- API-Calls schlagen mit "Failed to fetch" fehl
- Requests laufen 30 Sekunden und timeout dann
- Console zeigt: `[API EXCEPTION] GET /projects: { "message": "Failed to fetch" }`

**Mögliche Ursachen:**

#### 1. Edge Function Server ist nicht deployed oder offline

**Lösung:**
```bash
# Prüfe ob der Server deployed ist
# Öffne: https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions

# Stelle sicher, dass "make-server-3b52693b" deployed ist
# Falls nicht, deploye ihn manuell
```

#### 2. CORS-Problem

**Check in Browser Console (F12):**
- Gibt es CORS-Fehler? (Access-Control-Allow-Origin)
- Wenn ja: Der Server muss CORS Headers senden

**Lösung im Server (`/supabase/functions/server/index.tsx`):**
```typescript
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'

const app = new Hono()

// WICHTIG: CORS MUSS aktiviert sein!
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))
```

#### 3. Falsche URL

**Check:**
```typescript
// In Browser Console:
console.log('API Base URL:', 'https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b')

// Teste manuell:
fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
}).then(r => r.json()).then(console.log)
```

#### 4. Auth Token fehlt oder ungültig

**Check in Console:**
```
[API Client] No auth token available
```

**Lösung:**
- Stelle sicher, dass der User eingeloggt ist
- Prüfe ob `supabase.auth.getSession()` einen Token liefert
- Teste mit: `const { data } = await supabase.auth.getSession(); console.log(data.session?.access_token)`

#### 5. Network/Firewall Problem

**Check:**
- Funktioniert das Internet?
- Blockiert ein Ad-Blocker oder Firewall die Requests?
- Teste in einem Inkognito-Fenster ohne Extensions

---

## 🐛 Debug-Checklist

### Step 1: Server Status prüfen

```bash
# 1. Öffne Supabase Dashboard
# 2. Gehe zu Functions
# 3. Prüfe ob "make-server-3b52693b" existiert und deployed ist
# 4. Schaue in die Logs ob Fehler da sind
```

### Step 2: Manuelle API-Tests

**Im Browser Console (F12):**
```javascript
// 1. Auth Token holen
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;
console.log('Token:', token ? 'EXISTS' : 'MISSING');

// 2. Health Check
fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 3. Projects Test (mit Auth)
fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Step 3: Verbose Logging aktivieren

**In `/lib/env.ts`:**
```typescript
export const appConfig = {
  isDevelopment: true, // Force development mode
  isProduction: false,
};
```

**Browser Console öffnen (F12) und schauen:**
```
✅ Environment Validation Complete
[API Client] Initializing GET request to ...
[API] Starting GET ...
[API] Request headers: ...
[API] Fetching with 30000ms timeout...
```

---

## 🔍 Häufige Error Messages

### "Unauthorized - please log in"
**Ursache:** Kein Auth Token verfügbar  
**Lösung:** 
1. Prüfe ob User eingeloggt ist
2. Schaue in Application > Local Storage ob Session da ist
3. Neu einloggen

### "Request timed out after 30000ms"
**Ursache:** Server antwortet nicht  
**Lösung:**
1. Prüfe ob Edge Function deployed ist
2. Schaue in Supabase Logs nach Errors
3. Erhöhe Timeout (nur für Tests): In `/lib/config.ts`: `REQUEST_TIMEOUT: 60000`

### "Network error or server unreachable"
**Ursache:** Fetch schlägt komplett fehl  
**Lösung:**
1. Prüfe Internet-Verbindung
2. Teste URL manuell im Browser
3. Disable Browser Extensions (Ad-Blocker)
4. Prüfe CORS Settings im Server

---

## 🚑 Quick Fixes

### Fix 1: Server neu deployen

```bash
# In Supabase Dashboard:
# Functions > make-server-3b52693b > Deploy

# ODER via CLI:
supabase functions deploy make-server-3b52693b
```

### Fix 2: Cache löschen

```javascript
// In Browser Console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 3: Neu einloggen

```javascript
// In Browser Console:
await supabase.auth.signOut();
// Dann: Manuell neu einloggen über UI
```

### Fix 4: Migration erneut ausführen

```javascript
// In Browser Console:
localStorage.removeItem('scriptony_has_migrated_postgres');
location.reload();
```

---

## 📞 Support

Wenn nichts hilft:

1. **Browser Console Logs speichern** (F12 > Console > Rechtsklick > Save as...)
2. **Network Tab checken** (F12 > Network > Filter: "make-server")
3. **Supabase Logs checken** (Dashboard > Functions > Logs)
4. **Screenshot machen** vom Fehler

Dann Issue erstellen mit allen gesammelten Infos!
