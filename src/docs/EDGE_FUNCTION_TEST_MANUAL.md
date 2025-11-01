# 🔍 MANUAL EDGE FUNCTION TEST

**Datum:** 25. Oktober 2025  
**Problem:** Failed to fetch - Edge Functions testen

---

## 🎯 **QUICK TEST - ÖFFNE DIESE URLs IM BROWSER:**

**Wichtig:** Du MUSST eingeloggt sein! Sonst bekommst du 401 Errors.

### **1. scriptony-projects** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-projects/projects
```

**Erwartetes Ergebnis:** JSON Array mit deinen Projects  
**Wenn Error:** Function ist offline/nicht deployed

---

### **2. scriptony-auth** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-auth/storage/usage
```

**Erwartetes Ergebnis:** JSON mit Storage Stats  
**Wenn Error:** Function ist offline/nicht deployed

---

### **3. scriptony-timeline-v2** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-timeline-v2/timeline?projectId=DEINE_PROJECT_ID
```

**Erwartetes Ergebnis:** JSON mit Timeline Nodes  
**Wenn Error:** Function ist offline/nicht deployed

---

### **4. scriptony-worldbuilding** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-worldbuilding/worlds
```

**Erwartetes Ergebnis:** JSON Array mit Worlds  
**Wenn Error:** Function ist offline/nicht deployed

---

### **5. scriptony-assistant** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-assistant/ai/models
```

**Erwartetes Ergebnis:** JSON Array mit AI Models  
**Wenn Error:** Function ist offline/nicht deployed

---

### **6. scriptony-gym** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-gym/categories
```

**Erwartetes Ergebnis:** JSON Array mit Exercise Categories  
**Wenn Error:** Function ist offline/nicht deployed

---

### **7. scriptony-superadmin** ✅
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-superadmin/superadmin/stats
```

**Erwartetes Ergebnis:** JSON mit System Stats  
**Wenn Error:** Function ist offline/nicht deployed

---

## 📋 **WAS KANNST DU SEHEN?**

### ✅ **WENN ES FUNKTIONIERT:**
```json
{
  "id": "123",
  "name": "My Project",
  ...
}
```
oder
```json
[...]
```

### ❌ **WENN 401 UNAUTHORIZED:**
```json
{
  "error": "Unauthorized"
}
```
**Lösung:** Du musst eingeloggt sein!

### ❌ **WENN 404 NOT FOUND:**
```
404 - Not Found
```
**Lösung:** Edge Function ist NICHT deployed!

### ❌ **WENN CORS ERROR (Browser Console):**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Lösung:** CORS ist falsch konfiguriert in der Edge Function!

### ❌ **WENN "Failed to fetch":**
```
Failed to fetch
```
**Lösung:** 
1. Prüfe deine Internetverbindung
2. Prüfe ob Supabase online ist
3. Prüfe Browser Console für Details

---

## 🔧 **WENN EINE FUNCTION FEHLT/OFFLINE:**

1. **Gehe zu Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ctkouztastyirjywiduc/functions
   ```

2. **Prüfe ob die Function existiert:**
   - scriptony-auth
   - scriptony-projects
   - scriptony-timeline-v2
   - scriptony-worldbuilding
   - scriptony-assistant
   - scriptony-gym
   - scriptony-superadmin

3. **Wenn Function fehlt:** Deploy sie!
   - Du hast die deploy-ready Files in:
     - `/supabase/functions/scriptony-auth/index.ts`
     - `/supabase/functions/scriptony-projects/index.ts`
     - etc.
   - Kopiere den Code ins Dashboard
   - Klick "Deploy"

4. **Wenn Function existiert aber offline:**
   - Klick auf die Function
   - Klick "Redeploy"
   - Warte 30 Sekunden

---

## 🎯 **NÄCHSTE SCHRITTE:**

1. ✅ **Teste alle 7 URLs** (siehe oben)
2. ✅ **Notiere welche funktionieren** (200 OK)
3. ✅ **Notiere welche fehlen** (404 oder Failed to fetch)
4. ⚠️ **Deploy fehlende Functions** im Supabase Dashboard
5. ⚠️ **Reload Schema Cache** (Settings → API → Reload)
6. ✅ **Teste nochmal**

---

**Sag mir welche URLs funktionieren und welche nicht!** 🚀
