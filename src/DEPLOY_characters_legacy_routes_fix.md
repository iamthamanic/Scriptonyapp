# 🚀 DEPLOY: Scriptony Characters - Legacy Routes Fix

**Datum:** 2025-11-01
**Funktion:** `scriptony-characters`
**Problem:** 404 Fehler bei `/timeline-characters/:id` Routes

## 🐛 Problem

Character API Calls schlugen fehl mit 404:
```
GET /timeline-characters/1fe0dfb0-c5a2-4e41-9485-73e2e297253b → 404 Not Found
PUT /timeline-characters/:id → 404 Not Found  
DELETE /timeline-characters/:id → 404 Not Found
```

## ✅ Lösung

Hinzufügen der fehlenden Legacy Routes zur `scriptony-characters` Edge Function:

### Neue Routes:
1. **GET `/timeline-characters/:id`** - Single Character abrufen
2. **PUT `/timeline-characters/:id`** - Character aktualisieren
3. **DELETE `/timeline-characters/:id`** - Character löschen

Diese Routes waren in `scriptony-timeline-v2` vorhanden, wurden aber bei der Migration zu `scriptony-characters` vergessen.

## 📋 Deploy Anleitung

### 1. Supabase Dashboard öffnen
- Navigiere zu: **Edge Functions → scriptony-characters**

### 2. Code ersetzen
- Kopiere **KOMPLETTEN** Code aus `/supabase/functions/scriptony-characters/index.ts`
- Füge ihn in die Edge Function ein

### 3. Deploy & Test
```bash
# Deploy über Supabase Dashboard "Deploy" Button

# Test Health Check
curl https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-characters/health

# Test Legacy Route
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-characters/timeline-characters/CHARACTER_ID
```

## 🎯 Erwartetes Ergebnis

✅ Character GET/PUT/DELETE funktioniert wieder
✅ ProjectDetail lädt Characters ohne Fehler
✅ Character Updates funktionieren

## 📝 API Struktur nach Fix

### Neue Routes (empfohlen):
- `GET /characters?project_id=X`
- `GET /characters/:id`
- `POST /characters`
- `PUT /characters/:id`
- `DELETE /characters/:id`

### Legacy Routes (backwards compatibility):
- `GET /timeline-characters?project_id=X`
- `POST /timeline-characters`
- **🆕 GET `/timeline-characters/:id`**
- **🆕 PUT `/timeline-characters/:id`**
- **🆕 DELETE `/timeline-characters/:id`**

## ⚡️ Performance

Keine Performance-Änderung, nur Bugfix für fehlende Routes.

---

**Status:** ⏳ Bereit für Deployment
**Dringlichkeit:** 🔴 KRITISCH (Character Management funktioniert nicht ohne diesen Fix)
