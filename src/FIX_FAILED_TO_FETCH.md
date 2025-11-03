# 🔧 FIX: Failed to Fetch Errors

**Problem:** `TypeError: Failed to fetch` und `AuthRetryableFetchError: Failed to fetch`

---

## 🚀 SCHNELLSTE LÖSUNG

### 1. Diagnose-Tool nutzen

Ich habe ein **automatisches Debug-Tool** erstellt:

1. **Öffne die App**
2. **Gehe zu** → Navigation → **API Test** (oder direkt `/api-test`)
3. **Scroll runter** zum "Edge Function Connectivity Test" Panel
4. **Klicke "Test All"**

Das Tool testet ALLE Edge Functions automatisch und zeigt dir:
- ✅ Welche Functions OK sind
- ❌ Welche Functions Fehler haben
- ⚠️ Welche Functions nicht deployed sind

### 2. Ergebnisse interpretieren

**Wenn "Not Deployed" angezeigt wird:**
→ Die Edge Function existiert nur im Code, wurde aber nie deployed

**Wenn "Error" oder "Network error" angezeigt wird:**
→ CORS-Problem oder Function crashed

**Wenn "401 Unauthorized" angezeigt wird:**
→ Auth-Token fehlt oder abgelaufen

---

## 🛠️ HÄUFIGSTE FIXES

### Fix 1: Edge Functions deployen

**Problem:** Functions sind nicht deployed  
**Symptom:** Debug Panel zeigt "Not Deployed"

**Lösung:**
1. Öffne **Supabase Dashboard**
2. Gehe zu **Edge Functions**
3. Für jede fehlende Function:
   - Klicke **"New Function"**
   - Name: **exakt wie im Debug Panel** (z.B. `scriptony-auth`)
   - Öffne `/supabase/functions/FUNCTION_NAME/index.ts` in diesem Projekt
   - **Kopiere GESAMTEN Code** (Strg+A, Strg+C)
   - **Paste in Dashboard**
   - Klicke **"Deploy"**

**Wichtigste Functions (Deploy-Reihenfolge):**
1. ✅ `scriptony-auth` - Login/Signup
2. ✅ `scriptony-projects` - Projects laden
3. ✅ `scriptony-project-nodes` - Timeline Nodes
4. ✅ `scriptony-shots` - Shots & Filming
5. ✅ `scriptony-characters` - Characters

---

### Fix 2: CORS-Problem

**Problem:** Function deployed aber CORS nicht konfiguriert  
**Symptom:** "CORS error" oder "Failed to fetch"

**Lösung:**

Jede Edge Function MUSS diese CORS-Config haben (ganz am Anfang):

```typescript
import { cors } from "npm:hono/cors";  // WICHTIG: npm:hono/cors, nicht middleware!

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));
```

**Deployment:**
1. Prüfe ob CORS-Config im Code ist
2. Falls nein: Hinzufügen
3. Function neu deployen
4. Warte 30 Sekunden
5. Test im Debug Panel wiederholen

---

### Fix 3: Auth Token Problem

**Problem:** User nicht angemeldet oder Session abgelaufen  
**Symptom:** "401 Unauthorized" oder "AuthRetryableFetchError"

**Lösung:**
1. **Logout** aus der App
2. **Login** erneut mit Demo-User:
   - Email: `demo@scriptony.app`
   - Password: `demo123`
3. Test wiederholen

---

### Fix 4: Schema Cache Problem

**Problem:** Tabellen existieren, aber Supabase findet sie nicht  
**Symptom:** "Could not find table in schema cache"

**Lösung:**
1. **Supabase Dashboard** → **Settings** → **API**
2. Scroll zu **"Schema Cache"**
3. Klicke **"Reload schema cache"**
4. Warte 60 Sekunden
5. App neu laden (Hard Refresh: Strg+Shift+R)

---

## ✅ VALIDIERUNG

Nach jedem Fix:

1. **Warte 30-60 Sekunden** (Deployment braucht Zeit)
2. **Debug Panel:** Klicke "Test All" erneut
3. **Prüfe Ergebnisse:**
   - ✅ Alle grün = Alles OK
   - ❌ Noch rot = Weiteren Fix durchführen

**Ziel:** Alle Functions sollten ✅ grün sein!

---

## 📋 DEPLOY CHECKLIST

Falls du ALLE Functions neu deployen musst:

- [ ] `scriptony-auth` deployed
- [ ] `scriptony-projects` deployed
- [ ] `scriptony-project-nodes` deployed
- [ ] `scriptony-shots` deployed
- [ ] `scriptony-characters` deployed
- [ ] `scriptony-assistant` deployed (optional für AI Chat)
- [ ] `scriptony-stats` deployed (optional für Stats)
- [ ] `scriptony-logs` deployed (optional für Activity Logs)
- [ ] `scriptony-audio` deployed (optional für Audio)
- [ ] `scriptony-worldbuilding` deployed (optional für Worlds)
- [ ] Schema Cache refreshed
- [ ] Debug Panel zeigt alle ✅ grün

---

## 🔍 ERWEITERTE DIAGNOSE

**Browser DevTools:**
1. Drücke **F12**
2. **Network Tab** öffnen
3. Filtere nach **"supabase.co"**
4. **Failed Requests** (rot) anklicken
5. **Response Tab** → Error Message lesen

**Supabase Function Logs:**
1. **Supabase Dashboard** → **Edge Functions**
2. Klicke auf Function
3. **Logs Tab** → Suche nach Errors

---

## 🆘 WENN NICHTS HILFT

1. **Screenshot** vom Debug Panel machen (alle Errors sichtbar)
2. **Browser Console** öffnen (F12) und Errors kopieren
3. **Supabase Function Logs** kopieren
4. **Issue** erstellen mit allen Infos

---

## 📚 DETAILLIERTE DOKU

Für ausführliche Diagnose-Anleitung siehe:
- `/docs/FETCH_ERRORS_DIAGNOSIS.md` - Vollständiger Diagnose-Guide
- `/DEPLOY_assistant_logs_fix.md` - Edge Function Deployment
- `/DEPLOY_schema_refresh_fix.md` - Schema Cache Probleme

---

**Tool:** EdgeFunctionDebugPanel - Automatische Function-Tests  
**Location:** `/components/EdgeFunctionDebugPanel.tsx`  
**Access:** Navigation → API Test oder `/api-test`

**Erstellt:** 2025-11-02  
**Status:** ✅ Debug Tool deployed, bereit zum Testen
