# 🎬 Timeline System - Template-basierte Projektstruktur

## Übersicht

Das neue Timeline-System ermöglicht die Erstellung und Verwaltung hierarchischer Projektstrukturen mit einem flexiblen Template-System für verschiedene Medientypen.

## Architektur

```
Project → Act → Sequence → Scene → Shot
```

### Komponenten-Struktur

```
/components/timeline/
├── BaseContainer.tsx              # Wiederverwendbare Basis-Komponente
├── types.ts                       # TypeScript Typen
├── TimelineView.tsx              # Hauptkomponente mit State Management
├── containers/                    # Spezifische Container-Komponenten
│   ├── ContainerAct.tsx          # Blau (#56cfec)
│   ├── ContainerSequence.tsx     # Grün (#85ea78)
│   ├── ContainerScene.tsx        # Rosa (#ea8778)
│   └── ContainerShot.tsx         # Grau (#dee1de)
└── templates/                     # Projekttyp-Templates
    ├── TemplateRegistry.ts       # Template-Definitionen
    └── FilmTemplate.tsx          # Film-spezifisches Rendering
```

## Projekttypen & Templates

### 1. Film (3-Akt-Struktur)
- **Hierarchie:** Akt → Sequenz → Szene → Shot
- **Standard:** 3 Akte, je 3 Sequenzen, je 4 Szenen, je 5 Shots
- **Farben:** Blau, Grün, Rosa, Grau

### 2. TV-Serie
- **Hierarchie:** Staffel → Episode → Szene → Shot
- **Standard:** 1 Staffel, 8 Episoden, je 10 Szenen, je 5 Shots

### 3. Hörbuch
- **Hierarchie:** Buch → Kapitel → Abschnitt → Paragraph
- **Standard:** 1 Buch, 10 Kapitel, je 5 Abschnitte

### 4. Roman
- **Hierarchie:** Teil → Kapitel → Szene → Absatz
- **Standard:** 3 Teile, je 5 Kapitel, je 8 Szenen

### 5. Theaterstück
- **Hierarchie:** Akt → Szene → Auftritt → Moment
- **Standard:** 3 Akte, je 4 Szenen

## Features

### ✅ Implementiert

1. **Hierarchische Container**
   - Verschachtelte, farbcodierte Container
   - Physische Überlagerung (wie aufgefächerte Spielkarten)
   - Einrückung basierend auf Tiefe

2. **Collapse/Expand**
   - Jeder Container kann eingeklappt werden
   - State wird persistent gehalten
   - Chevron-Icons für visuelles Feedback

3. **Inline-Editing**
   - Namen direkt in den Containern editierbar
   - Click-to-Edit Interface
   - Enter/Escape Keyboard-Support

4. **CRUD-Operationen**
   - Create: "+ X hinzufügen" Buttons
   - Read: Automatisches Laden vom Server
   - Update: Inline-Editing mit Auto-Save
   - Delete: Mülltonne-Icons

5. **Optimistic UI**
   - Sofortiges UI-Feedback
   - Rollback bei Fehlern
   - Wie beim AI Chat System

6. **Backend-Integration**
   - Nutzt vorhandene Supabase-Routes:
     - `/projects/{projectId}/acts`
     - `/acts/{actId}/sequences`
     - `/sequences/{sequenceId}/scenes`
     - `/scenes/{sceneId}/shots`

## Verwendung

```tsx
import { TimelineView } from '../timeline/TimelineView';

<TimelineView 
  projectId="abc-123" 
  projectType="film" 
/>
```

## API-Endpunkte

### Acts
```typescript
GET    /projects/{projectId}/acts          // Alle Acts mit nested data
POST   /projects/{projectId}/acts          // Neuen Act erstellen
PUT    /projects/{projectId}/acts/{actId}  // Act aktualisieren
DELETE /projects/{projectId}/acts/{actId}  // Act löschen
```

### Sequences
```typescript
POST   /projects/{projectId}/acts/{actId}/sequences
PUT    /projects/{projectId}/sequences/{sequenceId}
DELETE /projects/{projectId}/sequences/{sequenceId}
```

### Scenes
```typescript
POST   /projects/{projectId}/sequences/{sequenceId}/scenes
PUT    /projects/{projectId}/scenes/{sceneId}
DELETE /projects/{projectId}/scenes/{sceneId}
```

### Shots
```typescript
POST   /projects/{projectId}/scenes/{sceneId}/shots
PUT    /projects/{projectId}/shots/{shotId}
DELETE /projects/{projectId}/shots/{shotId}
```

## Nächste Schritte

### Phase 2 - Erweiterte Features
- [ ] Drag & Drop für Reordering
- [ ] Character-Avatars in Scene Cards
- [ ] Preview-Bilder für Scenes/Shots
- [ ] Dauer-Anzeige und Timeline-Ruler
- [ ] Batch-Operationen (Multi-Select)

### Phase 3 - Templates
- [ ] SeriesTemplate.tsx
- [ ] AudiobookTemplate.tsx
- [ ] BookTemplate.tsx
- [ ] TheaterTemplate.tsx
- [ ] Custom Template Creator

### Phase 4 - Export/Import
- [ ] Export als JSON
- [ ] Import von Final Draft/Celtx
- [ ] PDF-Export mit Visualisierung

## Technische Details

### State Management
- React useState für Acts-Array
- Lokaler CollapseState für UI
- Optimistic Updates mit Rollback

### Styling
- Tailwind CSS mit Inline-Styles für Farben
- Figma-Import CSS-Klassen beibehalten
- Responsive (Mobile-First)

### Performance
- Lazy Loading für große Hierarchien
- Memoization mit useCallback
- Aggressive Caching wie beim Chat

## Troubleshooting

### Server läuft nicht
```bash
# Backend-Status prüfen
# Server sollte auf Port 54321 laufen
```

### Daten werden nicht geladen
1. Check Browser Console für Fehler
2. Prüfe Supabase Auth Token
3. Verifiziere Project ID in Request

### Styling-Probleme
- Alle Figma-Import Klassen müssen erhalten bleiben
- Inline-Styles haben Priorität
- Border-Overlays sind wichtig für Design
