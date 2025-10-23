# 🎬 Shot Card & 3-Akt-Struktur Implementation Guide

## ✅ Was wurde implementiert (Phase 1)

### 1. **Datenbank Migration** (`010_shot_enhancements.sql`)

**Neue Felder in `shots` Tabelle:**
- `framing` - Bildausschnitt (ECU, CU, MCU, MS, WS, EWS, etc.)
- `dialog` - Dialog-Text mit @-Character-Mentions Support
- `notes` - Produktionsnotizen
- `shotlength_minutes` - Länge in Minuten
- `shotlength_seconds` - Länge in Sekunden  
- `image_url` - Preview-Bild URL (Supabase Storage)

**Neue Tabellen:**
- `shot_audio` - Audio-Dateien (Musik + SFX) mit Label, File Size, Type
- `shot_characters` - Many-to-Many Junction Table für Characters in Shots

**Neue Helper Functions:**
- `get_shot_characters(p_shot_id)` - Gibt alle Characters eines Shots zurück
- `add_character_to_shot(p_shot_id, p_character_id)` - Character hinzufügen (idempotent)
- `remove_character_from_shot(p_shot_id, p_character_id)` - Character entfernen

**⚠️ WICHTIG: Migration ausführen!**
```bash
# In Supabase Dashboard > SQL Editor:
# Kopiere den Inhalt von /supabase/migrations/010_shot_enhancements.sql
# Führe das SQL aus
```

---

### 2. **Server Routes** (erweitert)

**File: `/supabase/functions/server/routes-shots.tsx`**

**Neue Endpoints:**

✅ `GET /make-server-3b52693b/shots/:sceneId`
- Gibt alle Shots einer Scene zurück
- **Inkludiert jetzt:** Characters + Audio Files populated

✅ `POST /make-server-3b52693b/shots`
- Erstellt neuen Shot
- **Unterstützt alle neuen Felder:** framing, dialog, notes, shotlength_minutes, shotlength_seconds, image_url

✅ `PUT /make-server-3b52693b/shots/:id`
- Updated Shot
- **Unterstützt alle neuen Felder**

✅ `POST /make-server-3b52693b/shots/:shotId/upload-image`
- Upload Shot Preview Image
- **Multipart Form Data:** `file` (Image File)
- Speichert in Supabase Storage Bucket `make-3b52693b-shot-images`
- Gibt Signed URL zurück (gültig 1 Jahr)

✅ `POST /make-server-3b52693b/shots/:shotId/upload-audio`
- Upload Audio File (Musik oder SFX)
- **Multipart Form Data:** `file` (Audio), `type` ('music' | 'sfx'), `label` (optional)
- Speichert in Bucket `make-3b52693b-shot-audio`
- Erstellt Eintrag in `shot_audio` Tabelle

✅ `DELETE /make-server-3b52693b/shots/audio/:audioId`
- Löscht Audio File

✅ `POST /make-server-3b52693b/shots/:shotId/characters`
- Fügt Character zu Shot hinzu
- **Body:** `{ character_id: string }`

✅ `DELETE /make-server-3b52693b/shots/:shotId/characters/:characterId`
- Entfernt Character von Shot

✅ `POST /make-server-3b52693b/shots/reorder`
- Reorder Shots innerhalb Scene
- **Body:** `{ scene_id: string, shot_ids: string[] }`

**Supabase Storage Buckets:**
- Server erstellt automatisch beim Start:
  - `make-3b52693b-shot-images` (private)
  - `make-3b52693b-shot-audio` (private)

---

### 3. **3-Akt-Struktur Auto-Init**

**File: `/supabase/functions/server/routes-projects-init.tsx`**

✅ `POST /make-server-3b52693b/projects/:projectId/init-three-act`

**Erstellt automatisch:**
- **3 Acts:**
  - Act 1 - Setup (Türkis #00CCC0)
  - Act 2 - Confrontation (Grün #98E5B4)
  - Act 3 - Resolution (Rosa #FF8FB1)

- **Pro Act: 1 Sequence**
  - Sequence 1.1, 2.1, 3.1

- **Pro Sequence: 1 Scene**
  - Scene 1.1.1, 2.1.1, 3.1.1

- **Pro Scene: 1 Shot**
  - Shot 1.1.1.1, 2.1.1.1, 3.1.1.1
  - Mit Default-Werten: Eye Level, Static, MS, 50mm, 5 Sekunden

**Response:**
```json
{
  "success": true,
  "message": "3-act structure initialized successfully",
  "structure": [
    {
      "act": { ... },
      "sequence": { ... },
      "scene": { ... },
      "shot": { ... }
    }
  ]
}
```

---

### 4. **Shot Card Component**

**File: `/components/ShotCard.tsx`**

**Features:**
✅ **Drag & Drop** - react-dnd integriert (Shots innerhalb Scene verschiebbar)
✅ **Image Upload** - Shot Preview mit Upload-Button
✅ **Character Management** - Avatar-Liste + Picker Dropdown + @-Mention im Dialog
✅ **Cinematografie Dropdowns:**
  - Camera Angle (7 Optionen)
  - Framing (9 Optionen)  
  - Movement (14 Optionen)
  - Lens (9 Optionen)
✅ **Shotlength Input** - Minuten + Sekunden Felder
✅ **Audio Uploads** - Musik + SFX mit Labels
✅ **Dialog Textarea** - Mit @-Mention Character Picker
✅ **Notes Textarea** - Produktionsnotizen

**Props:**
```typescript
interface ShotCardProps {
  shot: Shot;
  sceneId: string;
  projectId: string;
  projectCharacters?: Character[]; // Für @-Mention
  onUpdate: (shotId: string, updates: Partial<Shot>) => void;
  onDelete: (shotId: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onImageUpload: (shotId: string, file: File) => Promise<void>;
  onAudioUpload: (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => Promise<void>;
  onAudioDelete: (audioId: string) => void;
  onCharacterAdd: (shotId: string, characterId: string) => void;
  onCharacterRemove: (shotId: string, characterId: string) => void;
}
```

---

### 5. **TypeScript Types** (erweitert)

**File: `/lib/types/index.ts`**

Neue Types:
```typescript
export interface ShotAudio {
  id: string;
  shotId: string;
  type: 'music' | 'sfx';
  fileUrl: string;
  fileName: string;
  label?: string;
  fileSize?: number;
  createdAt: string;
}

export interface Shot {
  // ... alle bestehenden Felder
  // Neue Felder:
  framing?: string;
  dialog?: string;
  notes?: string;
  shotlengthMinutes?: number;
  shotlengthSeconds?: number;
  imageUrl?: string;
  // Relations:
  characters?: Character[];
  audioFiles?: ShotAudio[];
}
```

---

## 🚀 Wie du es nutzen kannst

### Schritt 1: Migration ausführen

1. Öffne Supabase Dashboard
2. Gehe zu SQL Editor
3. Kopiere `/supabase/migrations/010_shot_enhancements.sql`
4. Führe aus
5. Überprüfe ob Tabellen `shot_audio` und `shot_characters` existieren

### Schritt 2: FilmTimeline integrieren

In deiner `FilmTimeline.tsx` Component:

```typescript
import { ShotCard } from './ShotCard';

// Im Scene-Rendering:
{shots
  .filter(shot => shot.sceneId === scene.id)
  .map(shot => (
    <ShotCard
      key={shot.id}
      shot={shot}
      sceneId={scene.id}
      projectId={projectId}
      projectCharacters={allProjectCharacters}
      onUpdate={handleShotUpdate}
      onDelete={handleShotDelete}
      onReorder={handleShotReorder}
      onImageUpload={handleImageUpload}
      onAudioUpload={handleAudioUpload}
      onAudioDelete={handleAudioDelete}
      onCharacterAdd={handleCharacterAdd}
      onCharacterRemove={handleCharacterRemove}
    />
  ))}
```

### Schritt 3: Handler Functions implementieren

```typescript
const handleImageUpload = async (shotId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_URL}/shots/${shotId}/upload-image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );

  const { imageUrl } = await response.json();
  
  // Update local state
  setShots(shots.map(s => 
    s.id === shotId ? { ...s, imageUrl } : s
  ));
};

const handleAudioUpload = async (
  shotId: string, 
  file: File, 
  type: 'music' | 'sfx', 
  label?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (label) formData.append('label', label);

  const response = await fetch(
    `${API_URL}/shots/${shotId}/upload-audio`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );

  const { audio } = await response.json();
  
  // Update local state
  setShots(shots.map(s => 
    s.id === shotId 
      ? { ...s, audioFiles: [...(s.audioFiles || []), audio] }
      : s
  ));
};

const handleCharacterAdd = async (shotId: string, characterId: string) => {
  await fetch(`${API_URL}/shots/${shotId}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ character_id: characterId }),
  });

  // Refresh shot data
  await loadShots(sceneId);
};

const handleShotReorder = async (draggedId: string, targetId: string) => {
  // Reorder locally first (optimistic UI)
  const shotsCopy = [...shots];
  const draggedIndex = shotsCopy.findIndex(s => s.id === draggedId);
  const targetIndex = shotsCopy.findIndex(s => s.id === targetId);
  
  const [removed] = shotsCopy.splice(draggedIndex, 1);
  shotsCopy.splice(targetIndex, 0, removed);
  
  setShots(shotsCopy);

  // Send to server
  await fetch(`${API_URL}/shots/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      scene_id: sceneId,
      shot_ids: shotsCopy.map(s => s.id),
    }),
  });
};
```

### Schritt 4: 3-Akt-Struktur initialisieren

In deiner Projects Page:

```typescript
const initializeThreeActStructure = async (projectId: string) => {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/init-three-act`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const { structure } = await response.json();
  
  console.log('✅ 3-Akt-Struktur erstellt:', structure);
  
  // Reload timeline data
  await loadTimelineData(projectId);
};
```

---

## 📊 Cinematografie-Optionen

### Camera Angle (7 Optionen)
- Eye Level (Augenhöhe)
- High Angle (Aufsicht)
- Low Angle (Untersicht)
- Bird's Eye View (Vogelperspektive)
- Dutch Angle (Schräg)
- Over-the-Shoulder (Über Schulter)
- POV (Point of View)

### Framing (9 Optionen)
- ECU - Extreme Close-Up
- CU - Close-Up
- MCU - Medium Close-Up
- MS - Medium Shot (Halbnah)
- MWS - Medium Wide Shot (Amerikanische)
- WS - Wide Shot (Totale)
- EWS - Extreme Wide Shot (Supertotale)
- TWO SHOT - Zwei Personen
- OTS - Over-the-Shoulder

### Movement (14 Optionen)
- Static (Statisch)
- Pan (Schwenk horizontal)
- Tilt (Schwenk vertikal)
- Dolly In (Heranfahrt)
- Dolly Out (Wegfahrt)
- Truck (Seitwärtsfahrt)
- Pedestal (Hoch/Runter)
- Zoom In/Out
- Handheld (Handkamera)
- Steadicam
- Crane (Kran)
- Drone (Drohne)
- Whip Pan (Schneller Schwenk)

### Lens (9 Optionen)
- 14mm - Ultra Wide
- 24mm - Wide Angle
- 35mm - Standard Wide
- 50mm - Normal
- 85mm - Portrait
- 100mm - Telephoto
- 200mm - Super Telephoto
- Fisheye
- Anamorphic (Cinemascope)

---

## 🎯 Nächste Schritte (Phase 2-4)

### Phase 2: Integration in FilmTimeline
- [ ] ShotCard in FilmTimeline einbauen
- [ ] API Calls für alle Handler implementieren
- [ ] Loading States + Error Handling
- [ ] Optimistic UI Updates

### Phase 3: Advanced Features
- [ ] Dropdown-Bilder via eigene Upload-Funktion
  - Admin-Bereich für Cinematografie-Beispielbilder
  - Upload + Management Interface
- [ ] Drag & Drop zwischen Scenes (cross-scene movement)
- [ ] Nummerierungs-Override (manuell Shot-Nummer eingeben → Auto-Reorder)
- [ ] Bulk-Operations (mehrere Shots gleichzeitig bearbeiten)

### Phase 4: Polish
- [ ] Keyboard Shortcuts (z.B. @ für Character Picker)
- [ ] Undo/Redo für Shot-Changes
- [ ] Shot Templates (Default-Settings speichern)
- [ ] Export Timeline als PDF

---

## 🐛 Troubleshooting

### Server startet nicht?
```bash
# Check Server Logs in Supabase Dashboard > Edge Functions > Logs
# Häufiger Fehler: Migration nicht ausgeführt
```

### File Upload funktioniert nicht?
```bash
# Check ob Buckets existieren:
# Supabase Dashboard > Storage
# Sollte sehen: make-3b52693b-shot-images, make-3b52693b-shot-audio
```

### Drag & Drop funktioniert nicht?
```typescript
// FilmTimeline muss in DndProvider wrapped sein:
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

<DndProvider backend={HTML5Backend}>
  <FilmTimeline projectId={projectId} />
</DndProvider>
```

---

## 💡 API Usage Beispiele

### Shot mit allen Feldern erstellen:
```typescript
const newShot = await fetch(`${API_URL}/shots`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    scene_id: sceneId,
    shot_number: '1.1.1.2',
    description: 'Hero enters room',
    camera_angle: 'Eye Level',
    framing: 'MS',
    camera_movement: 'Dolly In',
    lens: '50mm',
    shotlength_minutes: 0,
    shotlength_seconds: 8,
    dialog: '@Hero: "What happened here?"',
    notes: 'Establish tension, slow zoom',
  }),
});
```

### Alle Shots einer Scene laden:
```typescript
const response = await fetch(
  `${API_URL}/shots/${sceneId}`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const { shots } = await response.json();
// shots inkludiert characters + audioFiles
```

---

## 🎨 Styling Notes

- Shot Card nutzt das Figma-Design 1:1
- Farben: `#f8f3f3` (Light Gray), `#cacaca` (Medium Gray), `#bfbfbf` (Border)
- Rounded Corners: `20px` für Karten, `5px` für Inputs
- Font: Inter (bereits in globals.css)
- Dropdown-Höhe: `21px` (wie im Figma)

---

## 📝 Zusammenfassung

**Was funktioniert:**
✅ Datenbank-Schema mit allen Feldern
✅ Server-Routes für CRUD + File Uploads
✅ Supabase Storage Integration
✅ Shot Card Component mit vollem Feature-Set
✅ 3-Akt-Auto-Init Route
✅ TypeScript Types

**Was noch fehlt:**
⏳ Integration in FilmTimeline Component
⏳ API Call Handler Functions
⏳ Dropdown-Beispielbilder Upload-System
⏳ Cross-Scene Drag & Drop
⏳ Nummerierungs-Override Logic

---

**Viel Erfolg! 🚀 Bei Fragen einfach melden!**
