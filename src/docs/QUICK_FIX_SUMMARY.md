# 🔧 QUICK FIX SUMMARY - Server nicht erreichbar

**Datum:** 25. Oktober 2025  
**Problem:** "Failed to fetch" & Schema Cache Errors

---

## 🚨 **DEINE FEHLER:**

### 1. **"Failed to fetch" - Server nicht erreichbar**
```
❌ [API FETCH ERROR] GET /projects: TypeError: Failed to fetch
❌ URL was: https://.../make-server-3b52693b/projects
```

**Ursache:** Das Frontend versucht die **alte Monolith Edge Function** (`make-server-3b52693b`) aufzurufen, die gelöscht/offline ist.

### 2. **Schema Cache Errors**
```
❌ Could not find the 'color' column of 'scenes' in the schema cache
❌ Could not find the 'project_id' column of 'shots' in the schema cache
```

**Ursache:** PostgREST Schema Cache ist veraltet.

### 3. **NOT NULL Constraint**
```
❌ null value in column "scene_number" violates not-null constraint
```

**Ursache:** Frontend sendet `null` für `scene_number`.

---

## ✅ **FIXES ANGEWENDET:**

### **Fix 1: API Client nutzt jetzt API Gateway** ✅

**Was ich gefixt habe:**

1. **`/lib/config.ts`** - Line 16:
   ```typescript
   // VORHER
   SERVER_BASE_PATH: '/make-server-3b52693b',  // ❌
   
   // NACHHER
   SERVER_BASE_PATH: '',  // ✅ Leer für API Gateway
   ```

2. **`/lib/api-client.ts`** - Komplett umgebaut:
   ```typescript
   // Nutzt jetzt intern API Gateway für Multi-Function Routing
   import { apiGateway as internalApiGateway } from './api-gateway';
   
   const USE_API_GATEWAY = true;  // ← AKTIVIERT!
   ```

**Ergebnis:**  
Alle API-Calls gehen jetzt über **API Gateway** → routet zu den **neuen Edge Functions**!

---

## ⚠️ **WAS DU JETZT TUN MUSST:**

### **SCHRITT 1: App neu laden** 🔄

1. **Refresh** deine Figma Make App (Cmd+R / F5)
2. **Prüfe** die Console Logs:
   ```
   ✅ [API Gateway] GET /projects → scriptony-projects
   ✅ [API Gateway] GET /storage/usage → scriptony-auth
   ```

3. **Erwartung:** Keine "Failed to fetch" Fehler mehr!

---

### **SCHRITT 2: PostgREST Cache neu laden** 🗄️

**Gehe zu Supabase Dashboard:**

1. `https://supabase.com/dashboard/project/ctkouztastyirjywiduc`
2. **Settings** → **API**
3. Scroll nach unten
4. **Klick auf "Reload schema cache"** Button
5. Warte 10-30 Sekunden

**ODER** führe diesen SQL Query aus (SQL Editor):
```sql
NOTIFY pgrst, 'reload schema';
```

**Erwartung:** Schema Cache Errors verschwinden!

---

### **SCHRITT 3: Prüfe ob alle Edge Functions deployed sind** 🚀

Im Supabase Dashboard:

1. **Edge Functions** → **Functions**
2. **Prüfe ob alle 7 Functions existieren:**
   - ✅ `scriptony-auth`
   - ✅ `scriptony-projects`
   - ✅ `scriptony-timeline-v2`
   - ✅ `scriptony-worldbuilding`
   - ✅ `scriptony-assistant`
   - ✅ `scriptony-gym`
   - ✅ `scriptony-superadmin`

**Wenn eine fehlt:** Deploy sie!

---

### **SCHRITT 4: (Optional) Alte Monolith Function löschen** 🗑️

Wenn `make-server-3b52693b` noch existiert:

1. **Edge Functions** → `make-server-3b52693b`
2. **Delete** klicken
3. **Bestätigen**

**Wichtig:** Erst löschen NACHDEM Step 1-3 funktionieren!

---

## 📊 **VORHER vs. NACHHER:**

### ❌ **VORHER:**
```
Frontend → api-client.ts → make-server-3b52693b (OFFLINE!)
                                    ↓
                                  404 Error
```

### ✅ **NACHHER:**
```
Frontend → api-client.ts → API Gateway → scriptony-projects ✅
                             │            scriptony-auth ✅
                             │            scriptony-timeline-v2 ✅
                             │            (alle 7 Functions)
                             ↓
                          200 OK
```

---

## 🎯 **ERWARTETE CONSOLE LOGS (nach Fix):**

```
✅ [API Client] Using API Gateway for GET /projects
✅ [API Gateway] GET /projects → scriptony-projects
✅ [API] Response received: 200 OK

✅ [API Client] Using API Gateway for GET /storage/usage
✅ [API Gateway] GET /storage/usage → scriptony-auth
✅ [API] Response received: 200 OK
```

**Keine "Failed to fetch" oder "schema cache" Errors mehr!** 🎉

---

## 📚 **WEITERE DOCS:**

- `/docs/FIX_SCHEMA_CACHE.md` - Schema Cache Fix Details
- `/docs/ADAPTER_AUDIT_2025.md` - Architektur Analyse
- `/MULTI_FUNCTION_ARCHITECTURE.md` - Multi-Function Übersicht
- `/FULL_STACK_TEST.md` - Testing Guide

---

## ❓ **WENN FEHLER BLEIBEN:**

1. **Console Logs posten** - zeig mir die neuen Fehler
2. **Supabase Dashboard prüfen** - sind alle Functions deployed?
3. **PostgREST Cache neu laden** - hast du den Button geklickt?
4. **SQL Prüfung** - führe die Queries in `/docs/FIX_SCHEMA_CACHE.md` aus

---

**Lass es mich wissen wenn es funktioniert! 🚀**
