# 🚨 SCHEMA FIX - Shots & Scenes Fehler beheben

## Problem
Der Server-Code versucht Spalten zu verwenden, die in der Datenbank nicht existieren:

```
❌ shots: "Could not find the 'project_id' column"
❌ scenes: "Could not find the 'color' column"
```

## Ursache
Die Migrationen 008 und 009 haben diese Spalten nicht erstellt, aber der deployte Server-Code in `DASHBOARD-DEPLOY-READY.ts` erwartet sie.

## Lösung

### ⚡ SOFORT-FIX (3 Schritte)

1. **Öffne die Datei `/SCHEMA_FIX_SHOTS_SCENES.sql`**
   - Cmd+A → Alles markieren
   - Cmd+C → Kopieren

2. **Gehe zum Supabase Dashboard**
   - Öffne dein Projekt
   - Navigiere zu: **SQL Editor** (linke Sidebar)
   - Klicke: **New Query**

3. **Führe den Fix aus**
   - Cmd+V → SQL Code einfügen
   - Klicke: **Run** (oder Cmd+Enter)
   - ✅ Warte auf Success-Meldung

### ✅ Erwartete Ausgabe

Du solltest diese Notices sehen:
```
✅ Added project_id to shots table
✅ Added color to scenes table

========================================
🔍 SCHEMA FIX VERIFICATION
========================================
shots.project_id: ✅ EXISTS
scenes.color: ✅ EXISTS
========================================
✅ ALL COLUMNS EXIST - FIX COMPLETE!

🎉 Du kannst jetzt Shots und Scenes erstellen!
```

## Was macht der Fix?

### 1. shots.project_id
```sql
- Fügt project_id Spalte hinzu (UUID, NOT NULL)
- Erstellt Foreign Key zu projects(id)
- Erstellt Index für Performance
- Füllt existierende Shots mit project_id von ihrer Scene
```

### 2. scenes.color
```sql
- Fügt color Spalte hinzu (TEXT, DEFAULT '#6E59A5')
- Setzt Violett-Farbe für existierende Scenes
```

## Nach dem Fix

Teste ob alles funktioniert:

1. **Gehe zur Film Timeline Page**
2. **Versuche einen Shot zu erstellen**
   - Sollte jetzt funktionieren ✅
3. **Versuche eine Scene zu erstellen**
   - Sollte jetzt funktionieren ✅

## Troubleshooting

### Problem: "permission denied"
- Du musst als Database Owner eingeloggt sein
- Gehe zu: Project Settings → Database → Reset Database Password

### Problem: "relation already exists"
- Das ist OK! Die Spalten existieren bereits
- Der Fix ist idempotent - du kannst ihn mehrmals ausführen

### Problem: Fehler bleiben
1. Refreshe die Seite (Cmd+R)
2. Lösche den Browser Cache
3. Checke die Server Logs im Supabase Dashboard

## Nächste Schritte

Nach dem Fix sollte alles funktionieren! Du kannst dann:

- ✅ Shots erstellen und bearbeiten
- ✅ Scenes erstellen und bearbeiten
- ✅ Die komplette 3-Act Timeline nutzen
- ✅ Weiter an Phase 2 arbeiten (Multi-Function Architektur)

---

**Wichtig:** Dieser Fix muss NUR EINMAL ausgeführt werden! Die Spalten bleiben danach permanent in der Datenbank.
