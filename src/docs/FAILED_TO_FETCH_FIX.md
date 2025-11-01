# 🔧 "FAILED TO FETCH" FIX - Komplette Anleitung

**Datum:** 25. Oktober 2025  
**Status:** ✅ **FIXES ANGEWENDET - JETZT TESTEN!**

---

## 🚨 **DEIN FEHLER:**

```
❌ [API Client via Gateway] Error: TypeError: Failed to fetch
❌ Error loading projects: Error: Failed to fetch
```

**Bedeutung:** Das Frontend kann die Edge Functions nicht erreichen!

---

## ✅ **WAS ICH GEFIXT HABE:**

### **1. API Client nutzt jetzt API Gateway** ✅

**Dateien geändert:**
- ✅ `/lib/config.ts` - `SERVER_BASE_PATH` auf leer gesetzt
- ✅ `/lib/api-client.ts` - Nutzt jetzt `api-gateway.ts` intern
- ✅ `/lib/api-gateway.ts` - Besseres Error Handling + Logging

**Ergebnis:**  
Alle API-Calls gehen jetzt über **API Gateway** → automatisches Routing zu den 7 Edge Functions!

### **2. Besseres Error Logging** ✅

Der API Gateway zeigt jetzt **genau** was das Problem ist:

```typescript
console.error(`[API Gateway] Possible causes:`);
console.error(`  1. Edge Function "${functionName}" is not deployed`);
console.error(`  2. CORS issue (check function CORS settings)`);
console.error(`  3. Network/internet connection issue`);
console.error(`  4. Supabase project offline`);
```

### **3. Test-Dokumentation erstellt** ✅

- ✅ `/docs/EDGE_FUNCTION_TEST_MANUAL.md` - Manuelle Test-URLs
- ✅ `/components/pages/ApiDebugPage.tsx` - Automatische Test-Page (optional)

---

## 🎯 **WAS DU JETZT TUN MUSST:**

### **SCHRITT 1: App neu laden** 🔄

1. **Refresh** die Figma Make App (Cmd+R oder F5)
2. **Öffne Browser Console** (F12)
3. **Versuche Projects zu laden**
4. **Prüfe die neuen Logs:**

**Erwartete Logs:**
```
✅ [API Client] Using API Gateway for GET /projects
✅ [API Gateway] GET /projects → scriptony-projects
✅ [API Gateway] Fetching https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-projects/projects
✅ [API Gateway] Response received: 200 OK
```

**Wenn immer noch Fehler:**
```
❌ [API Gateway] Network Error: ...
❌ [API Gateway] Possible causes:
  1. Edge Function "scriptony-projects" is not deployed
  2. CORS issue (check function CORS settings)
  3. Network/internet connection issue
  4. Supabase project offline
```

---

### **SCHRITT 2: Manuelle URL Tests** 🧪

**Öffne diese URL direkt im Browser** (während du eingeloggt bist):

```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-projects/projects
```

**Was siehst du?**

#### ✅ **FALL A: JSON Array mit Projects**
```json
[
  { "id": "abc123", "title": "My Project", ... }
]
```
**→ PERFEKT! Function ist deployed und funktioniert!**  
**→ Problem ist im Frontend/API Gateway Code**

#### ❌ **FALL B: 404 Not Found**
```
404 - Not Found
```
**→ Function ist NICHT deployed!**  
**→ Deploy sie im Supabase Dashboard!**

#### ❌ **FALL C: 401 Unauthorized**
```json
{ "error": "Unauthorized" }
```
**→ Du bist nicht eingeloggt!**  
**→ Login dich ein und probier nochmal!**

#### ❌ **FALL D: CORS Error (Browser Console)**
```
Access to fetch at '...' has been blocked by CORS policy
```
**→ CORS ist falsch konfiguriert!**  
**→ Redeploy die Function!**

---

### **SCHRITT 3: Alle 7 Functions testen** 📋

Teste **alle 7 URLs** aus `/docs/EDGE_FUNCTION_TEST_MANUAL.md`:

1. ✅ scriptony-projects → `/projects`
2. ✅ scriptony-auth → `/storage/usage`
3. ✅ scriptony-timeline-v2 → `/timeline`
4. ✅ scriptony-worldbuilding → `/worlds`
5. ✅ scriptony-assistant → `/ai/models`
6. ✅ scriptony-gym → `/categories`
7. ✅ scriptony-superadmin → `/superadmin/stats`

**Notiere welche funktionieren!**

---

### **SCHRITT 4: Fehlende Functions deployen** 🚀

**Wenn eine Function 404 zurückgibt:**

1. **Gehe zu Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions
   ```

2. **Prüfe ob die Function existiert**
   - Wenn **JA**: Klick "Redeploy" → Warte 30 Sek → Test nochmal
   - Wenn **NEIN**: Deploy sie neu:

3. **Function neu deployen:**
   - Klick "New Function"
   - Name: z.B. `scriptony-projects`
   - Code: Kopiere aus `/supabase/functions/scriptony-projects/index.ts`
   - Klick "Deploy"
   - Warte 30-60 Sekunden

---

## 📊 **ERWARTETES ERGEBNIS:**

Nach den Fixes solltest du sehen:

### **Browser Console:**
```
✅ [API Client] Using API Gateway for GET /projects
✅ [API Gateway] GET /projects → scriptony-projects
✅ [API Gateway] Fetching https://...
✅ [API Gateway] Response received: 200 OK
✅ Projects loaded successfully
```

### **UI:**
- ✅ Projects Page zeigt deine Projekte
- ✅ Kein "Server nicht erreichbar" Banner
- ✅ Keine "Failed to fetch" Errors

### **Manuelle URL Tests:**
- ✅ Alle 7 URLs geben JSON zurück (nicht 404!)

---

## ❓ **TROUBLESHOOTING:**

### **"Alle URLs geben 404"**
→ **KEINE der Functions ist deployed!**  
→ Gehe zu Supabase Dashboard → Edge Functions  
→ Deploy alle 7 Functions manuell

### **"Nur scriptony-projects gibt 404"**
→ **Nur diese Function fehlt!**  
→ Deploy sie im Dashboard

### **"Alle URLs funktionieren, aber Frontend hat immer noch Fehler"**
→ **Frontend-Problem!**  
→ Refresh die App (Hard Reload: Cmd+Shift+R)  
→ Clear Browser Cache  
→ Poste die Console Logs

### **"CORS Error in Console"**
→ **CORS falsch konfiguriert!**  
→ Redeploy die betroffene Function  
→ Prüfe ob CORS Code vorhanden ist (Line 30-36 in index.ts)

---

## 🎯 **NÄCHSTE SCHRITTE:**

1. ✅ **Refresh App** (Cmd+R)
2. ✅ **Öffne Console** (F12)
3. ✅ **Lade Projects Page**
4. ✅ **Kopiere Console Logs** hier rein
5. ✅ **Test manuelle URL** (siehe SCHRITT 2)
6. ✅ **Poste Ergebnis** (JSON? 404? CORS?)

---

**Sag mir was du siehst und ich helfe dir weiter!** 🚀
