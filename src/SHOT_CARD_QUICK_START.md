# 🚀 Shot Card System - Quick Start

## ⚡ In 5 Minuten loslegen

### Schritt 1: Migration ausführen (WICHTIG!)

1. Öffne **Supabase Dashboard**
2. Gehe zu **SQL Editor**
3. Öffne Datei `/supabase/migrations/010_shot_enhancements.sql` in diesem Projekt
4. Kopiere den **gesamten Inhalt**
5. Füge in SQL Editor ein und klicke **RUN**
6. ✅ Erfolgsmeldung: "Migration 010 completed successfully!"

**Was passiert:**
- Fügt 6 neue Felder zu `shots` Tabelle hinzu
- Erstellt `shot_audio` Tabelle
- Erstellt `shot_characters` Tabelle
- Erstellt 3 Helper Functions

---

### Schritt 2: Test ob Server läuft

```bash
# Im Browser öffnen:
https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3b52693b/health

# Sollte zurückgeben:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

**Server Logs checken:**
- Supabase Dashboard > Edge Functions > server > Logs
- Sollte sehen: "🎬 Enhanced: Shot uploads, characters, audio files"

---

### Schritt 3: 3-Akt-Struktur testen

```typescript
// In deiner FilmTimelinePage.tsx oder ProjectsPage.tsx:

import { initializeThreeActStructure } from '../lib/api/shots-api';
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { session } = useAuth();
  
  const handleInit3Act = async () => {
    try {
      const result = await initializeThreeActStructure(
        'YOUR_PROJECT_ID',
        session.accessToken
      );
      
      console.log('✅ Struktur erstellt:', result);
      // Reload your timeline data here
    } catch (error) {
      console.error('❌ Fehler:', error);
    }
  };

  return (
    <Button onClick={handleInit3Act}>
      3-Akt-Struktur initialisieren
    </Button>
  );
}
```

**Was passiert:**
- Erstellt 3 Acts (Setup, Confrontation, Resolution)
- Pro Act: 1 Sequence
- Pro Sequence: 1 Scene  
- Pro Scene: 1 Shot (mit Default-Werten)

---

### Schritt 4: Shot Card verwenden

```typescript
import { ShotCard } from '../components/ShotCard';
import { useState } from 'react';
import * as ShotsAPI from '../lib/api/shots-api';

function SceneView({ scene, projectId }) {
  const [shots, setShots] = useState<Shot[]>([]);
  const { session } = useAuth();

  // Load shots
  useEffect(() => {
    ShotsAPI.getShots(scene.id, session.accessToken)
      .then(setShots)
      .catch(console.error);
  }, [scene.id]);

  // Handler: Shot Update
  const handleShotUpdate = async (shotId: string, updates: Partial<Shot>) => {
    // Optimistic UI update
    setShots(shots.map(s => s.id === shotId ? { ...s, ...updates } : s));
    
    // Send to server
    try {
      await ShotsAPI.updateShot(shotId, updates, session.accessToken);
    } catch (error) {
      console.error('Failed to update:', error);
      // Revert optimistic update
      await ShotsAPI.getShots(scene.id, session.accessToken).then(setShots);
    }
  };

  // Handler: Image Upload
  const handleImageUpload = async (shotId: string, file: File) => {
    try {
      const imageUrl = await ShotsAPI.uploadShotImage(
        shotId,
        file,
        session.accessToken
      );
      
      setShots(shots.map(s => 
        s.id === shotId ? { ...s, imageUrl } : s
      ));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handler: Audio Upload
  const handleAudioUpload = async (
    shotId: string,
    file: File,
    type: 'music' | 'sfx',
    label?: string
  ) => {
    try {
      const audio = await ShotsAPI.uploadShotAudio(
        shotId,
        file,
        type,
        label,
        session.accessToken
      );
      
      setShots(shots.map(s => 
        s.id === shotId 
          ? { ...s, audioFiles: [...(s.audioFiles || []), audio] }
          : s
      ));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handler: Character Add
  const handleCharacterAdd = async (shotId: string, characterId: string) => {
    try {
      await ShotsAPI.addCharacterToShot(shotId, characterId, session.accessToken);
      // Reload to get populated character data
      const updatedShots = await ShotsAPI.getShots(scene.id, session.accessToken);
      setShots(updatedShots);
    } catch (error) {
      console.error('Failed to add character:', error);
    }
  };

  // Handler: Character Remove
  const handleCharacterRemove = async (shotId: string, characterId: string) => {
    try {
      await ShotsAPI.removeCharacterFromShot(shotId, characterId, session.accessToken);
      setShots(shots.map(s => 
        s.id === shotId 
          ? { ...s, characters: s.characters?.filter(c => c.id !== characterId) }
          : s
      ));
    } catch (error) {
      console.error('Failed to remove character:', error);
    }
  };

  // Handler: Drag & Drop Reorder
  const handleShotReorder = async (draggedId: string, targetId: string) => {
    const shotsCopy = [...shots];
    const draggedIndex = shotsCopy.findIndex(s => s.id === draggedId);
    const targetIndex = shotsCopy.findIndex(s => s.id === targetId);
    
    const [removed] = shotsCopy.splice(draggedIndex, 1);
    shotsCopy.splice(targetIndex, 0, removed);
    
    setShots(shotsCopy);

    try {
      await ShotsAPI.reorderShots(
        scene.id,
        shotsCopy.map(s => s.id),
        session.accessToken
      );
    } catch (error) {
      console.error('Reorder failed:', error);
      // Reload on error
      await ShotsAPI.getShots(scene.id, session.accessToken).then(setShots);
    }
  };

  // Handler: Delete Shot
  const handleShotDelete = async (shotId: string) => {
    if (!confirm('Shot wirklich löschen?')) return;
    
    setShots(shots.filter(s => s.id !== shotId));
    
    try {
      await ShotsAPI.deleteShot(shotId, session.accessToken);
    } catch (error) {
      console.error('Delete failed:', error);
      await ShotsAPI.getShots(scene.id, session.accessToken).then(setShots);
    }
  };

  return (
    <div className="space-y-4">
      {shots.map(shot => (
        <ShotCard
          key={shot.id}
          shot={shot}
          sceneId={scene.id}
          projectId={projectId}
          projectCharacters={allProjectCharacters} // Du musst diese laden
          onUpdate={handleShotUpdate}
          onDelete={handleShotDelete}
          onReorder={handleShotReorder}
          onImageUpload={handleImageUpload}
          onAudioUpload={handleAudioUpload}
          onAudioDelete={(audioId) => {
            // Implement similar to others
          }}
          onCharacterAdd={handleCharacterAdd}
          onCharacterRemove={handleCharacterRemove}
        />
      ))}
    </div>
  );
}
```

---

### Schritt 5: Drag & Drop Setup

Shot Card nutzt `react-dnd`. Deine Timeline muss in DndProvider wrapped sein:

```typescript
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function FilmTimelinePage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FilmTimeline projectId={projectId} />
    </DndProvider>
  );
}
```

---

## 🎯 Features die jetzt funktionieren

### ✅ Shot CRUD
```typescript
// Erstellen
const newShot = await ShotsAPI.createShot(sceneId, {
  shot_number: '1.1.1.2',
  camera_angle: 'Eye Level',
  framing: 'MS',
  camera_movement: 'Static',
  lens: '50mm',
  shotlength_minutes: 0,
  shotlength_seconds: 5,
}, accessToken);

// Updaten
await ShotsAPI.updateShot(shotId, {
  framing: 'CU',
  notes: 'Establish tension',
}, accessToken);

// Löschen
await ShotsAPI.deleteShot(shotId, accessToken);
```

### ✅ File Uploads
```typescript
// Bild hochladen
const imageUrl = await ShotsAPI.uploadShotImage(
  shotId,
  imageFile,
  accessToken
);

// Audio hochladen
const audio = await ShotsAPI.uploadShotAudio(
  shotId,
  audioFile,
  'music', // oder 'sfx'
  'Main Theme', // optional label
  accessToken
);
```

### ✅ Character Management
```typescript
// Character hinzufügen
await ShotsAPI.addCharacterToShot(shotId, characterId, accessToken);

// Character entfernen
await ShotsAPI.removeCharacterFromShot(shotId, characterId, accessToken);
```

### ✅ Reorder (Drag & Drop)
```typescript
// Shots neu sortieren
await ShotsAPI.reorderShots(
  sceneId,
  ['shot-id-1', 'shot-id-3', 'shot-id-2'], // neue Reihenfolge
  accessToken
);
```

---

## 📸 Screenshots der Shot Card

Die Shot Card hat alle Features aus dem Figma Design:

1. **Header** - Shot Number + Delete Button
2. **Image Upload** - Preview + Upload Button
3. **Characters** - Avatar-Liste + Add/Remove
4. **Camera Settings** - 4 Dropdowns (Angle, Framing, Movement, Lens)
5. **Shotlength** - Minutes : Seconds Input
6. **Audio** - Music + SFX Upload mit Labels
7. **Dialog** - Textarea mit @-Mention Support
8. **Notes** - Produktionsnotizen

---

## 🎬 Cinematografie-Optionen

### Camera Angle (7 Optionen)
- Eye Level, High Angle, Low Angle
- Bird's Eye View, Dutch Angle
- Over-the-Shoulder, POV

### Framing (9 Optionen)
- ECU, CU, MCU, MS, MWS, WS, EWS
- TWO SHOT, OTS

### Movement (14 Optionen)
- Static, Pan, Tilt
- Dolly In/Out, Truck, Pedestal
- Zoom In/Out, Handheld, Steadicam
- Crane, Drone, Whip Pan

### Lens (9 Optionen)
- 14mm, 24mm, 35mm, 50mm, 85mm
- 100mm, 200mm, Fisheye, Anamorphic

---

## 🐛 Häufige Probleme

### "Failed to fetch shots"
- ✅ Migration ausgeführt?
- ✅ Server läuft? (Health Check)
- ✅ Access Token korrekt?

### "Buckets do not exist"
- Server startet Buckets automatisch
- Checke Supabase Dashboard > Storage
- Sollte sehen: `make-3b52693b-shot-images`, `make-3b52693b-shot-audio`

### Drag & Drop funktioniert nicht
- ✅ DndProvider im Parent?
- ✅ HTML5Backend importiert?

### Characters werden nicht angezeigt
- ✅ `projectCharacters` Prop gesetzt?
- ✅ Characters existieren im Projekt?
- ✅ GET /shots/:sceneId populated characters?

---

## 🎨 Styling Anpassen

Shot Card nutzt Tailwind + ShadCN. Alle Farben sind im Code:

```typescript
// Backgrounds
bg-[#f8f3f3] // Light gray
bg-[#cacaca] // Medium gray (Dropdowns)

// Borders
border-[#bfbfbf]

// Rounded Corners
rounded-[20px] // Cards
rounded-[5px]  // Inputs
```

---

## 📚 Weitere Dokumentation

- **Vollständige API Docs:** `/SHOT_CARD_IMPLEMENTATION_GUIDE.md`
- **Server Routes:** `/supabase/functions/server/routes-shots.tsx`
- **Migration:** `/supabase/migrations/010_shot_enhancements.sql`
- **Component:** `/components/ShotCard.tsx`
- **API Client:** `/lib/api/shots-api.ts`

---

## ✅ Checkliste

- [ ] Migration 010 ausgeführt
- [ ] Server Health Check erfolgreich
- [ ] 3-Akt-Init getestet
- [ ] Shot Card in Timeline eingebaut
- [ ] Image Upload funktioniert
- [ ] Audio Upload funktioniert
- [ ] Character Add/Remove funktioniert
- [ ] Drag & Drop funktioniert
- [ ] Dropdowns speichern Werte

---

**Viel Erfolg! 🎬 Bei Fragen einfach fragen!**
