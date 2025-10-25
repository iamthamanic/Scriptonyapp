# 🚨 SCHEMA CACHE FIX - Sofort-Lösung

## Problem
Nach SQL-Migration zeigt Supabase:
```
"Could not find the 'color' column of 'scenes' in the schema cache"
"Could not find the 'project_id' column of 'shots' in the schema cache"
```

Die Spalten existieren in der Datenbank, aber **PostgREST hat den Schema Cache nicht aktualisiert**.

## ⚡ SOFORT-FIX (2 Optionen)

### Option 1: Schema Cache Reload (EMPFOHLEN)

1. **Öffne Supabase Dashboard**
   - Navigiere zu: **SQL Editor**
   - Klicke: **New Query**

2. **Führe diesen Befehl aus:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Warte 5 Sekunden** → Fertig!

### Option 2: Edge Function Neustart

Wenn Option 1 nicht funktioniert:

1. **Gehe zu Edge Functions**
2. **make-server-3b52693b** → Deploy (einfach nochmal deployen)
3. **Warte auf "Deployed successfully"**

## ✅ Verification

Nach dem Fix sollten keine Cache-Fehler mehr kommen.

Teste mit:
```javascript
// Im Browser Console
console.log('Testing scene creation...');
```

## Nächstes Problem: scene_number

Der Frontend-Code sendet `number`, aber der Server erwartet `scene_number`.

**Ich fixe das jetzt im Code!**

---

## Warum passiert das?

Supabase PostgREST cached das Database Schema für Performance.
Nach DDL-Änderungen (ALTER TABLE, ADD COLUMN) muss der Cache manuell neu geladen werden.

Das ist ein bekanntes Supabase-Verhalten - siehe [PostgREST Docs](https://postgrest.org/en/stable/admin.html#schema-reloading).
