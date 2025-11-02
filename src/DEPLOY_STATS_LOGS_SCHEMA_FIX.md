# 🚀 DEPLOYMENT: Stats & Logs Schema Fix

## 📋 Zusammenfassung

Die Stats & Logs Edge Functions hatten Schema-Fehler, weil sie Spalten erwarteten, die nicht existieren:
- ❌ `timeline_nodes.duration` (ist in `metadata.duration`)
- ❌ `timeline_nodes.user_id` (existiert nicht, RLS nutzt `auth.uid()`)
- ❌ `timeline_nodes.mentioned_characters` (noch nicht implementiert)
- ❌ `activity_logs.timestamp` (heißt `created_at`)

## ✅ Was wurde gefixt

### 1. Edge Functions
- ✅ `scriptony-stats` - Liest jetzt korrekt aus `metadata` JSONB
- ✅ `scriptony-logs` - Nutzt `created_at` statt `timestamp`

### 2. Database Triggers
- ✅ Migration 022 fixt die Activity Log Triggers
- ✅ Trigger nutzen jetzt `auth.uid()` statt `user_id` Spalte
- ✅ Trigger lesen Duration/CameraAngle/Framing aus `metadata` JSONB

---

## 📦 DEPLOYMENT STEPS

### SCHRITT 1: Database Migration (SQL Editor)

1. Gehe zu **Supabase Dashboard → SQL Editor**
2. Erstelle eine neue Query
3. Kopiere den Inhalt von `/supabase/migrations/022_fix_activity_logs_triggers.sql`
4. Führe die Query aus (Run)
5. Verifiziere: "Success. No rows returned"

### SCHRITT 2: Update scriptony-stats Edge Function

1. Gehe zu **Supabase Dashboard → Edge Functions**
2. Wähle die Function `scriptony-stats`
3. Klicke auf "Edit function"
4. Kopiere den **kompletten Inhalt** von:
   ```
   /supabase/functions/scriptony-stats/index.ts
   ```
5. Ersetze den gesamten Code in der Edge Function
6. Klicke "Save" und dann "Deploy"

### SCHRITT 3: Update scriptony-logs Edge Function

1. Gehe zu **Supabase Dashboard → Edge Functions**
2. Wähle die Function `scriptony-logs`
3. Klicke auf "Edit function"
4. Kopiere den **kompletten Inhalt** von:
   ```
   /supabase/functions/scriptony-logs/index.ts
   ```
5. Ersetze den gesamten Code in der Edge Function
6. Klicke "Save" und dann "Deploy"

---

## 🧪 TESTING

Nach dem Deployment teste:

### 1. Test Stats Endpoint
```bash
# Im Browser Console oder als API Test
const projectId = "YOUR_PROJECT_ID";
const token = "YOUR_AUTH_TOKEN";

const response = await fetch(
  `https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-stats/stats/project/${projectId}/overview`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
console.log(await response.json());
```

### 2. Test Logs Endpoint
```bash
const response = await fetch(
  `https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-logs/logs/project/${projectId}/recent`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
console.log(await response.json());
```

### 3. Test im UI
1. Öffne ein Projekt
2. Klicke auf "..." → "Statistiken & Logs"
3. Tab "Statistics":
   - ✅ Sollte jetzt echte Zahlen zeigen (Acts, Sequences, Scenes, Shots)
   - ✅ Shot Analytics sollte funktionieren (falls Shots vorhanden)
   - ✅ Farben: Scenes = Rosa, Media Images = Gelb
4. Tab "Logs":
   - ✅ Sollte Activity Logs anzeigen (falls vorhanden)
   - ✅ Kein 404 Error mehr

---

## 📊 Erwartete Ergebnisse

### Statistics Tab
```json
{
  "timeline": {
    "acts": 3,
    "sequences": 8,
    "scenes": 24,
    "shots": 0
  },
  "content": {
    "characters": 5,
    "worlds": 2
  },
  "metadata": {
    "type": "film",
    "genre": "Thriller"
  }
}
```

### Logs Tab
```json
{
  "logs": [
    {
      "id": "...",
      "timestamp": "2025-11-02T...",
      "user": { "name": "User Name", "email": "..." },
      "entity_type": "timeline_node",
      "action": "created",
      "details": { "title": "Sequence 1", "level": 2 }
    }
  ]
}
```

---

## 🔍 Troubleshooting

### Stats zeigen immer noch 0
- Prüfe: Sind Acts/Sequences/Scenes tatsächlich in `timeline_nodes` Tabelle?
- Prüfe: Ist das richtige `project_id` in der URL?
- Check Console: Gibt es SQL Fehler?

### Logs zeigen "Fehler beim Laden"
- Prüfe: Ist die `scriptony-logs` Edge Function deployed?
- Prüfe: Hat die `activity_logs` Tabelle Daten?
- Check: Wurden die Trigger korrekt erstellt? (Migration 022)

### Trigger funktionieren nicht
- Die Trigger werden automatisch gefeuert bei INSERT/UPDATE/DELETE
- Test: Erstelle eine neue Sequence - es sollte ein Log-Eintrag erscheinen
- Falls nicht: Prüfe, ob Migration 022 erfolgreich ausgeführt wurde

---

## 📝 Änderungs-Log

### scriptony-stats v2.1.0
- ✅ Entfernt: `user_id` Filter (nutzt RLS)
- ✅ Geändert: Liest `metadata.duration` statt `duration` Spalte
- ✅ Geändert: Liest `metadata.cameraAngle`, `metadata.framing`, etc.
- ✅ Character Analytics: Placeholder (noch nicht implementiert)

### scriptony-logs v2.1.0
- ✅ Geändert: `timestamp` → `created_at`
- ✅ Korrekte Spaltennamen in allen Queries

### Migration 022
- ✅ Fixt: `log_timeline_changes()` Trigger
- ✅ Fixt: `log_character_changes()` Trigger
- ✅ Fixt: `log_project_changes()` Trigger
- ✅ Alle Triggers nutzen `auth.uid()` und `metadata` JSONB

---

## ✨ Nach dem Fix

Die Stats & Logs sollten jetzt funktionieren! 🎉

- **Statistics**: Zeigt echte Zahlen aus der Datenbank
- **Logs**: Zeigt Activity History (falls Daten vorhanden)
- **Farben**: Design-System korrekt (Rosa für Scenes, Gelb für Images)
- **Performance**: Optimiert durch RLS und JSONB Indexe

---

**Status**: ✅ Ready to Deploy
**Datum**: 2025-11-02
**Version**: Stats/Logs v2.1.0
