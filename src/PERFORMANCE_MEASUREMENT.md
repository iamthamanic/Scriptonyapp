# 🎯 Performance Measurement System

## Übersicht

Das Performance-Measurement-System misst die Ladezeiten beim Öffnen eines Projekts und zeigt detailliert an, welche Komponenten wie lange brauchen.

## Messpunkte

### 1. **Total Project Load** (Gesamt)
- **Start**: Wenn `selectedProjectId` sich ändert und das Projekt geöffnet wird
- **Ende**: Wenn die ProjectDetail-Komponente vollständig gerendert ist (100ms nach Mount)
- **Label**: `⏱️ [PERF] Total Project Load: ${projectId}`

### 2. **Worldbuilding Load**
- **Start**: Beim Start des Projekt-Öffnens
- **Ende**: Wenn Worldbuilding Items geladen sind
- **Label**: `⏱️ [PERF] Worldbuilding Load: ${projectId}`

### 3. **Timeline Cache Load** (Wichtigster Indikator!)
- **Start**: Beim Start des Projekt-Öffnens
- **Ende**: Wenn alle Timeline-Daten (Acts, Sequences, Scenes, Shots) gecacht sind
- **Label**: `⏱️ [PERF] Timeline Cache Load: ${projectId}`
- **Sub-Messungen**:
  - `⏱️ [PERF] Timeline API - Acts: ${projectId}` - Wie lange dauert das Laden der Acts
  - `⏱️ [PERF] Timeline API - All Nodes: ${projectId}` - Wie lange dauert das parallele Laden aller Nodes

### 4. **Characters Load**
- **Start**: Wenn ProjectDetail mounted
- **Ende**: Wenn Characters aus dem Backend geladen sind
- **Label**: `⏱️ [PERF] Characters Load: ${projectId}`

### 5. **FilmDropdown Load**
- **Ohne Cache**: `⏱️ [PERF] FilmDropdown Full Load: ${projectId}`
- **Mit Cache**: Zeigt "0ms (instant)" an

## Wie man die Messungen liest

1. **Öffne die Browser Console** (F12 → Console)
2. **Öffne ein Projekt** in Scriptony
3. **Suche nach `⏱️ [PERF]`** Logs

### Beispiel-Output (ideal mit Caching):

```
⏱️ [PERF] Timeline API - Acts: project-123: 250ms
⏱️ [PERF] Timeline API - All Nodes: project-123: 450ms
⏱️ [PERF] Timeline Cache Load: project-123: 500ms
⏱️ [PERF] Worldbuilding Load: project-123: 180ms
[FilmDropdown] 🚀 Using cached initialData - INSTANT LOAD!
⏱️ [PERF] FilmDropdown with cache: project-123 - 0ms (instant)
⏱️ [PERF] Characters Load: project-123: 320ms
⏱️ [PERF] ProjectDetail Rendered: project-123
⏱️ [PERF] Total Project Load: project-123: 620ms
```

### Was die Zeiten bedeuten:

- **< 100ms**: Blitzschnell ⚡
- **100-300ms**: Sehr gut ✅
- **300-500ms**: Akzeptabel ⚠️
- **500-1000ms**: Langsam - Optimierung notwendig 🐌
- **> 1000ms**: Sehr langsam - Dringend optimieren! 🚨

## Bottlenecks identifizieren

### Timeline API zu langsam?
→ Schaue dir die Sub-Messungen an:
- Wenn "Acts" lange dauert: Problem beim Laden der Acts
- Wenn "All Nodes" lange dauert: Problem beim parallelen Laden der Sequences/Scenes/Shots

### Characters Load zu langsam?
→ Prüfe die `scriptony-characters` Edge Function

### FilmDropdown zu langsam?
→ Cache funktioniert nicht! Prüfe:
1. Wird `initialData` korrekt übergeben?
2. Ist `timelineCache` gefüllt?

## Performance-Ziele

Mit dem aggressiven Caching sollten wir erreichen:

- **Timeline Cache Load**: < 500ms
- **Characters Load**: < 300ms
- **FilmDropdown**: 0ms (instant mit Cache)
- **Total Project Load**: < 700ms

## Implementierte Optimierungen

✅ **Aggressive Timeline Caching**:
- ProjectsPage lädt Timeline-Daten beim Öffnen
- FilmDropdown erhält `initialData` und lädt sofort
- Cache wird nach Mutations aktualisiert

✅ **Parallel Loading**:
- Acts, Sequences, Scenes, Shots werden parallel geladen
- Promise.all() für maximale Geschwindigkeit

✅ **Optimistic UI**:
- Keine Wartezeit für UI-Updates
- Backend-Sync im Hintergrund

## Debugging

Wenn die Performance schlecht ist:

1. **Prüfe die Console-Logs** auf Fehler
2. **Schaue dir die Network-Tab** an (F12 → Network)
3. **Vergleiche die Messungen** mit den Zielwerten oben
4. **Identifiziere den langsamsten Teil** und optimiere gezielt

## Nächste Schritte

Wenn Timeline Cache Load immer noch > 500ms:

1. **Database Indexing**: Prüfe ob Indexes auf `project_id`, `parent_id` gesetzt sind
2. **Edge Function Location**: Prüfe ob Edge Function nahe am DB-Server deployed ist
3. **Query Optimization**: Schaue dir die SQL-Queries in den Edge Functions an
4. **Reduce Data**: Lade nur die nötigsten Felder (nicht alle)

---

**Status**: ✅ Performance-Messungen vollständig implementiert
**Datum**: 2025-11-03
