# 🚀 SUPABASE DASHBOARD DEPLOYMENT - EINFACHE ANLEITUNG

## ⚠️ WICHTIG: Du bist in Figma Make!

Da du in **Figma Make** arbeitest (Browser-Umgebung):
- ❌ Kein lokales Terminal
- ❌ Keine CLI verfügbar  
- ✅ **Einzige Option:** Supabase Dashboard

---

## 📋 SCHRITT-FÜR-SCHRITT

### **Schritt 1: Supabase Dashboard öffnen**

Öffne diesen Link in einem neuen Tab:

```
https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions
```

### **Schritt 2: Function finden oder erstellen**

**Option A:** Function existiert bereits
- Klicke auf **"make-server-3b52693b"**
- Klicke auf **"Edit Function"**

**Option B:** Function existiert nicht
- Klicke auf **"New Function"**
- Name: `make-server-3b52693b`
- Klicke auf **"Create Function"**

### **Schritt 3: Code kopieren**

In Figma Make:
1. Öffne die Datei: `/supabase/functions/server/index.tsx`
2. **Klicke in die Datei** (nicht auf den File Explorer)
3. Drücke **Cmd+A** (Mac) oder **Ctrl+A** (Windows)
4. Drücke **Cmd+C** oder **Ctrl+C**

### **Schritt 4: Code einfügen**

Im Supabase Dashboard:
1. **Lösche den gesamten bisherigen Code** im Editor
2. Drücke **Cmd+V** oder **Ctrl+V**
3. Der Code sollte jetzt eingefügt sein

### **Schritt 5: Imports anpassen** ⚠️ WICHTIG

Das Dashboard unterstützt **keine separaten Dateien**!

Du musst alle Zeilen mit `import ... from "./..."` **löschen oder auskommentieren**:

**ENTFERNE DIESE ZEILEN:**
```typescript
import aiChatRoutes from "./routes-ai-minimal.tsx";
import shotsRoutes from "./routes-shots.tsx";
import { createProjectsInitRoutes } from "./routes-projects-init.tsx";
import { createActsRoutes } from "./routes-acts.tsx";
import { createSequencesRoutes } from "./routes-sequences.tsx";
import { createScenesRoutes } from "./routes-scenes.tsx";
import { createDebugRoutes } from "./routes-debug.tsx";
```

**UND DIESE ZEILEN (weiter unten):**
```typescript
app.route("/make-server-3b52693b/acts", createActsRoutes(...));
app.route("/make-server-3b52693b/sequences", createSequencesRoutes(...));
app.route("/make-server-3b52693b/scenes", createScenesRoutes(...));
app.route("/make-server-3b52693b/shots", shotsRoutes);
app.route("/make-server-3b52693b/projects", createProjectsInitRoutes(...));
app.route("/make-server-3b52693b/debug", createDebugRoutes());
app.route("/make-server-3b52693b", aiChatRoutes);
```

**Das ist okay!** Die Basic-Funktionen (Projects, Worlds, Health Check) funktionieren trotzdem.

### **Schritt 6: Deploy klicken**

1. Klicke auf **"Save"** oder **"Deploy"**
2. Warte 30-60 Sekunden
3. Die Function wird deployed!

### **Schritt 7: Testen**

1. **Lade deine Figma Make App neu** (F5 oder Reload-Button)
2. Der **grüne Server-Status Banner** sollte erscheinen ✅
3. **Projects sollten funktionieren** ✅

---

## ⚠️ EINSCHRÄNKUNG

Diese Minimal-Version unterstützt:
- ✅ Health Check
- ✅ Projects (GET, POST, PATCH, DELETE)
- ✅ Worlds (GET, POST)
- ✅ Storage Usage

**NICHT unterstützt** (wegen fehlenden Imports):
- ❌ Acts, Sequences, Scenes, Shots (Timeline)
- ❌ AI Chat
- ❌ Debug Routes

---

## 🎯 BESSERE LÖSUNG

Falls du **alle Features** willst, nutze die vorgefertigte Dashboard-Datei:

### **Alternative: Vorgefertigte Dashboard-Datei**

1. Öffne in Figma Make: `/supabase/functions/deploy-ready/DASHBOARD-DEPLOY-READY.ts`
2. **Cmd+A** → **Cmd+C** (alles kopieren)
3. Im Dashboard: **Cmd+V** (einfügen)
4. **Deploy klicken**

Diese Datei enthält:
- ✅ **Alle Features in EINER Datei**
- ✅ Projects, Worlds, Scenes, Characters, Episodes
- ✅ AI Chat (OpenAI, Anthropic, Google, OpenRouter, DeepSeek)
- ✅ MCP Tools
- ✅ Funktioniert im Dashboard!

**ABER:** Sie ist ~2000 Zeilen groß und eventuell zu groß für das Dashboard.

---

## 🆘 TROUBLESHOOTING

### **"Code too large"**

Das Dashboard hat ein Größen-Limit (~50KB). Falls der Code zu groß ist:
- Nutze die Minimal-Version (`index.tsx`)
- Entferne alle Imports
- Entferne die AI Chat Routen

### **"Module not found"**

Du hast die lokalen Imports nicht entfernt.
- Lösche alle Zeilen mit `import ... from "./..."`

### **"Server still offline"**

1. Warte 60 Sekunden (Cold Start)
2. Prüfe die Logs im Dashboard (Functions → Logs)
3. Lade die App neu (F5)

---

## 💡 ZUSAMMENFASSUNG

**Schnellste Lösung für dich:**

1. **Gehe zu:** https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions
2. **Erstelle/Öffne:** Function "make-server-3b52693b"
3. **Kopiere:** `/supabase/functions/deploy-ready/DASHBOARD-DEPLOY-READY.ts`
4. **Füge ein & Deploy**
5. **Fertig!** ✅

Das ist die einfachste Lösung für Figma Make! 🚀
