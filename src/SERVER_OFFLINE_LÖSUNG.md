# ❌ SERVER OFFLINE - SCHNELLE LÖSUNG

## **🔴 DAS PROBLEM**

Du bekommst diese Fehlermeldungen:
```
TypeError: Failed to fetch
AuthRetryableFetchError: Failed to fetch
```

**URSACHE:** Die Supabase Edge Function ist **nicht deployed** oder **offline**.

---

## **✅ LÖSUNG IN 5 MINUTEN**

### **Option 1: Supabase CLI Deploy (Empfohlen)**

#### **1. Supabase CLI installieren**
```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### **2. Login**
```bash
supabase login
```

#### **3. Link zu deinem Projekt**
```bash
supabase link --project-ref ctkouztastyirjywiduc
```

#### **4. Deploy die Edge Function**
```bash
# Erstelle die Function Struktur
mkdir -p supabase/functions/make-server-3b52693b

# Kopiere den Server Code
cp supabase/functions/server/index.tsx supabase/functions/make-server-3b52693b/index.ts

# Deploye
supabase functions deploy make-server-3b52693b
```

#### **5. Setze Environment Variables**
```bash
supabase secrets set SUPABASE_URL=https://ctkouztastyirjywiduc.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<DEIN_SERVICE_ROLE_KEY>
```

**SERVICE_ROLE_KEY findest du:**
- Supabase Dashboard → Settings → API → `service_role` (secret)

---

### **Option 2: Manuelles Deploy über Dashboard**

#### **1. Öffne Supabase Dashboard**
👉 [https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions](https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions)

#### **2. Neue Function erstellen**
- Klick **"Create a new Function"**
- Name: `make-server-3b52693b`
- Template: **"Basic"**

#### **3. Code einfügen**
- Kopiere **KOMPLETT** den Code aus: `/supabase/functions/server/index.tsx`
- Füge ihn ein in den Editor
- **WICHTIG:** Entferne alle TypeScript `.tsx` Imports und ändere sie zu `.ts`

**Beispiel:**
```typescript
// VORHER:
import { createScenesRoutes } from "./routes-scenes.tsx";

// NACHHER:
import { createScenesRoutes } from "./routes-scenes.ts";
```

#### **4. Setze Environment Variables**
Im Dashboard unter **"Settings"** → **"Edge Functions"** → **"Environment Variables"**:

```
SUPABASE_URL=https://ctkouztastyirjywiduc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=<DEIN_SERVICE_ROLE_KEY>
```

#### **5. Deploy**
- Klick **"Deploy Function"**
- Warte 10-30 Sekunden
- ✅ Fertig!

---

## **🧪 TESTEN**

### **1. Health Check im Browser**
Öffne diese URL:
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health
```

**EXPECTED:**
```json
{
  "status": "ok",
  "message": "Scriptony Server is running",
  "timestamp": "2025-01-15T12:34:56.789Z",
  "version": "1.0.0"
}
```

### **2. In der App**
- **F5** drücken (Seite neu laden)
- Du solltest sehen: **"✅ Server ist online und bereit!"**
- Kein **"❌ Server nicht erreichbar"** mehr

---

## **🐛 TROUBLESHOOTING**

### **Problem: "Function not found"**
**Lösung:**
- Warte 30 Sekunden nach dem Deploy
- Leere den Browser Cache (Cmd+Shift+R / Ctrl+Shift+R)
- Prüfe, ob der Function Name **exakt** `make-server-3b52693b` ist

### **Problem: "Internal Server Error 500"**
**Lösung:**
- Prüfe die **Function Logs** im Supabase Dashboard
- Häufigste Ursache: **Environment Variables fehlen**
- Stelle sicher, dass `SUPABASE_SERVICE_ROLE_KEY` gesetzt ist

### **Problem: "CORS Error"**
**Lösung:**
- Der Server hat bereits CORS aktiviert (`origin: "*"`)
- Wenn es trotzdem auftritt: Prüfe Browser Extensions (AdBlocker, etc.)
- Teste im **Inkognito-Modus**

### **Problem: "Unauthorized"**
**Lösung:**
- Logge dich aus und wieder ein
- Prüfe, ob der Test User existiert:
  - Email: `iamthamanic@gmail.com`
  - Password: `123456`

---

## **📚 WEITERFÜHREND**

### **Alle Function Routes im Code:**
Siehe: `/supabase/functions/server/index.tsx`

**Wichtige Endpoints:**
- `/health` - Server Status (NO AUTH)
- `/migration-status` - Migration Check (NO AUTH)
- `/migrate` - PostgreSQL Migration (AUTH)
- `/migrate-sql` - SQL Migrations (AUTH)
- `/projects` - Projekte CRUD (AUTH)
- `/scenes` - Szenen CRUD (AUTH)
- `/characters` - Charaktere CRUD (AUTH)
- `/worlds` - Welten CRUD (AUTH)
- `/ai-chat/*` - AI Chat & RAG (AUTH)

### **Logs anschauen:**
```bash
# Real-time Logs
supabase functions logs make-server-3b52693b --tail

# Oder im Dashboard:
# Functions → make-server-3b52693b → Logs
```

---

## **🎯 ZUSAMMENFASSUNG**

1. ✅ **Deploy die Function** (CLI oder Dashboard)
2. ✅ **Setze Environment Variables**
3. ✅ **Teste Health Check**
4. ✅ **Lade App neu** (F5)
5. ✅ **Kein Fehler mehr!**

**EXPECTED TIME:** 5-10 Minuten

**WENN ALLES LÄUFT:**
- Grüner Banner: "✅ Server ist online und bereit!"
- Chat funktioniert
- Projekte können erstellt werden
- Keine "Failed to fetch" Fehler

---

## **💬 SUPPORT**

**Noch Probleme?**
1. Check Function Logs
2. Check Browser Console (F12)
3. Check Network Tab (F12 → Network)
4. Schick mir die Fehlermeldung!

---

**JETZT LOS! 🚀**
