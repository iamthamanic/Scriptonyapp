# 🎬 TEMPLATE ENGINE ARCHITECTURE

## 🎯 Vision

Ein **generisches Template-System** das:
- ✅ Beliebig viele Project Types unterstützt (Film, Serie, Buch, Theater, Game, ...)
- ✅ Beliebig viele Templates pro Type (Film: 3-Akt, Heldenreise, 5-Akt, ...)
- ✅ **Neue Templates = Nur Frontend Code** (KEIN Backend Deploy!)
- ✅ Generische Database mit JSONB für Template-spezifische Daten
- ✅ Generische API die mit allen Templates funktioniert

---

## 🏗️ ARCHITEKTUR

### **1. Template Registry (Frontend)**
```
/lib/templates/registry.ts

TEMPLATES = {
  'film-3act': { ... },
  'film-heroes-journey': { ... },
  'film-save-the-cat': { ... },
  'series-traditional': { ... },
  'book-novel': { ... },
  'theater-classic': { ... },
  'game-narrative': { ... },
}
```

**Neues Template hinzufügen = 1 Registry Entry!**

### **2. Generische Database**
```sql
-- timeline_nodes (GENERISCH!)
CREATE TABLE timeline_nodes (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  template_id TEXT NOT NULL,  -- 'film-3act', 'series-traditional'
  
  -- Hierarchie (generisch)
  level INTEGER NOT NULL,     -- 1, 2, 3, 4
  parent_id UUID,             -- NULL für Level 1
  
  -- Basis-Felder (alle Templates)
  node_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT,
  order_index INTEGER,
  
  -- Template-spezifisch (JSONB!)
  metadata JSONB,
  -- Film: { "timeOfDay": "day", "cameraAngle": "wide" }
  -- Buch: { "wordCount": 2500, "pov": "first-person" }
  -- Theater: { "characters": ["Hamlet", "Ophelia"] }
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **3. Template Schema**
```typescript
interface TemplateDefinition {
  id: string;              // 'film-3act'
  type: ProjectType;       // 'film'
  name: string;            // '3-Akt-Struktur'
  description: string;
  
  // Hierarchie Definition
  levels: {
    level_1: LevelConfig;  // Act / Season / Part
    level_2?: LevelConfig; // Sequence / Episode / Chapter
    level_3?: LevelConfig; // Scene / Scene / Section
    level_4?: LevelConfig; // Shot / Shot / null
  };
  
  // Features
  features: {
    hasCinematography: boolean;  // Film = true, Buch = false
    hasDialogue: boolean;
    hasAudio: boolean;
    hasCharacters: boolean;
  };
  
  // Default Structure
  defaultStructure: {
    level_1_count: number;
    level_2_per_parent?: number;
    level_3_per_parent?: number;
    level_4_per_parent?: number;
  };
  
  // Metadata Schema (optional)
  metadataSchema?: {
    level_1?: Record<string, FieldSchema>;
    level_2?: Record<string, FieldSchema>;
    level_3?: Record<string, FieldSchema>;
    level_4?: Record<string, FieldSchema>;
  };
}

interface LevelConfig {
  name: string;        // 'Act', 'Season', 'Part'
  namePlural: string;  // 'Acts', 'Seasons', 'Parts'
  icon: string;        // '🎬', '📺', '📚'
  color?: string;      // Default color
}
```

---

## 📊 TEMPLATE BEISPIELE

### **Film: 3-Akt-Struktur**
```typescript
{
  id: 'film-3act',
  type: 'film',
  name: '3-Akt-Struktur',
  description: 'Klassische Hollywood-Struktur',
  
  levels: {
    level_1: { name: 'Act', namePlural: 'Acts', icon: '🎬' },
    level_2: { name: 'Sequence', namePlural: 'Sequences', icon: '📽️' },
    level_3: { name: 'Scene', namePlural: 'Scenes', icon: '🎥' },
    level_4: { name: 'Shot', namePlural: 'Shots', icon: '📸' },
  },
  
  features: {
    hasCinematography: true,
    hasDialogue: true,
    hasAudio: true,
    hasCharacters: true,
  },
  
  defaultStructure: {
    level_1_count: 3,           // 3 Acts
    level_2_per_parent: 3,      // 3 Sequences per Act
    level_3_per_parent: 4,      // 4 Scenes per Sequence
    level_4_per_parent: 5,      // 5 Shots per Scene
  },
  
  metadataSchema: {
    level_3: {  // Scene
      timeOfDay: { type: 'enum', values: ['day', 'night', 'dawn', 'dusk'] },
      location: { type: 'string' },
      interior: { type: 'boolean' },
    },
    level_4: {  // Shot
      cameraAngle: { type: 'enum', values: ['wide', 'medium', 'close'] },
      cameraMovement: { type: 'enum', values: ['static', 'pan', 'dolly'] },
      lens: { type: 'string' },
      duration: { type: 'number' },
    },
  },
}
```

### **Film: Heldenreise**
```typescript
{
  id: 'film-heroes-journey',
  type: 'film',
  name: 'Heldenreise (12 Stages)',
  description: 'Joseph Campbell Hero\'s Journey',
  
  levels: {
    level_1: { name: 'Stage', namePlural: 'Stages', icon: '🗺️' },
    level_2: { name: 'Phase', namePlural: 'Phases', icon: '⚡' },
    level_3: { name: 'Scene', namePlural: 'Scenes', icon: '🎥' },
    level_4: { name: 'Shot', namePlural: 'Shots', icon: '📸' },
  },
  
  features: { ... },
  
  defaultStructure: {
    level_1_count: 12,  // 12 Stages!
    level_2_per_parent: 2,
    level_3_per_parent: 3,
    level_4_per_parent: 5,
  },
  
  // Vordefinierte Stage Namen
  predefinedNodes: {
    level_1: [
      { number: 1, title: 'Ordinary World' },
      { number: 2, title: 'Call to Adventure' },
      { number: 3, title: 'Refusal of the Call' },
      { number: 4, title: 'Meeting the Mentor' },
      { number: 5, title: 'Crossing the Threshold' },
      { number: 6, title: 'Tests, Allies, Enemies' },
      { number: 7, title: 'Approach to the Inmost Cave' },
      { number: 8, title: 'Ordeal' },
      { number: 9, title: 'Reward' },
      { number: 10, title: 'The Road Back' },
      { number: 11, title: 'Resurrection' },
      { number: 12, title: 'Return with the Elixir' },
    ],
  },
}
```

### **Serie: Traditional**
```typescript
{
  id: 'series-traditional',
  type: 'series',
  name: 'Traditionelle TV-Serie',
  description: 'Staffeln mit Episoden',
  
  levels: {
    level_1: { name: 'Season', namePlural: 'Seasons', icon: '📺' },
    level_2: { name: 'Episode', namePlural: 'Episodes', icon: '🎞️' },
    level_3: { name: 'Scene', namePlural: 'Scenes', icon: '🎥' },
    level_4: { name: 'Shot', namePlural: 'Shots', icon: '📸' },
  },
  
  features: {
    hasCinematography: true,
    hasDialogue: true,
    hasAudio: true,
    hasCharacters: true,
  },
  
  defaultStructure: {
    level_1_count: 1,           // 1 Season (erstmal)
    level_2_per_parent: 10,     // 10 Episodes per Season
    level_3_per_parent: 15,     // 15 Scenes per Episode
    level_4_per_parent: 5,      // 5 Shots per Scene
  },
  
  metadataSchema: {
    level_2: {  // Episode
      episodeNumber: { type: 'string' },  // "S01E01"
      airDate: { type: 'date' },
      runtime: { type: 'number' },
    },
    level_3: { ... },  // Wie Film
    level_4: { ... },  // Wie Film
  },
}
```

### **Buch: Roman**
```typescript
{
  id: 'book-novel',
  type: 'book',
  name: 'Roman (3 Teile)',
  description: 'Klassische Roman-Struktur',
  
  levels: {
    level_1: { name: 'Part', namePlural: 'Parts', icon: '📚' },
    level_2: { name: 'Chapter', namePlural: 'Chapters', icon: '📖' },
    level_3: { name: 'Section', namePlural: 'Sections', icon: '📄' },
    // level_4: null → Keine Shots!
  },
  
  features: {
    hasCinematography: false,  // ← Wichtig!
    hasDialogue: true,
    hasAudio: false,
    hasCharacters: true,
  },
  
  defaultStructure: {
    level_1_count: 3,           // 3 Parts
    level_2_per_parent: 8,      // 8 Chapters per Part
    level_3_per_parent: 5,      // 5 Sections per Chapter
    level_4_per_parent: 0,      // Keine Shots!
  },
  
  metadataSchema: {
    level_2: {  // Chapter
      wordCount: { type: 'number' },
      pov: { type: 'enum', values: ['first-person', 'third-person', 'omniscient'] },
    },
    level_3: {  // Section
      wordCount: { type: 'number' },
      content: { type: 'richtext' },
    },
  },
}
```

### **Theater: Klassisch**
```typescript
{
  id: 'theater-classic',
  type: 'theater',
  name: 'Klassisches Theaterstück',
  description: '5-Akt-Struktur',
  
  levels: {
    level_1: { name: 'Act', namePlural: 'Acts', icon: '🎭' },
    level_2: { name: 'Scene', namePlural: 'Scenes', icon: '🎬' },
    level_3: { name: 'Beat', namePlural: 'Beats', icon: '💬' },
    // level_4: null
  },
  
  features: {
    hasCinematography: false,
    hasDialogue: true,  // Sehr wichtig!
    hasAudio: false,
    hasCharacters: true,
  },
  
  defaultStructure: {
    level_1_count: 5,           // 5 Acts (klassisch)
    level_2_per_parent: 3,      // 3 Scenes per Act
    level_3_per_parent: 8,      // 8 Beats per Scene
  },
  
  metadataSchema: {
    level_2: {  // Scene
      setting: { type: 'string' },
      charactersPresent: { type: 'array' },
    },
    level_3: {  // Beat
      dialogue: { type: 'richtext' },
      character: { type: 'string' },
      action: { type: 'string' },
    },
  },
}
```

### **Game: Narrative**
```typescript
{
  id: 'game-narrative',
  type: 'game',
  name: 'Story-Driven Game',
  description: 'Narrative Game Structure',
  
  levels: {
    level_1: { name: 'Chapter', namePlural: 'Chapters', icon: '🎮' },
    level_2: { name: 'Level', namePlural: 'Levels', icon: '🗺️' },
    level_3: { name: 'Mission', namePlural: 'Missions', icon: '⚔️' },
    level_4: { name: 'Cutscene', namePlural: 'Cutscenes', icon: '🎬' },
  },
  
  features: {
    hasCinematography: true,   // Für Cutscenes
    hasDialogue: true,
    hasAudio: true,
    hasCharacters: true,
  },
  
  defaultStructure: {
    level_1_count: 3,
    level_2_per_parent: 4,
    level_3_per_parent: 5,
    level_4_per_parent: 2,
  },
  
  metadataSchema: {
    level_2: {  // Level
      difficulty: { type: 'enum', values: ['easy', 'medium', 'hard'] },
      estimatedPlaytime: { type: 'number' },
    },
    level_3: {  // Mission
      objective: { type: 'string' },
      rewards: { type: 'array' },
    },
    level_4: {  // Cutscene (wie Film Shot)
      cameraAngle: { type: 'enum', values: ['wide', 'medium', 'close'] },
      duration: { type: 'number' },
    },
  },
}
```

---

## 🔄 MIGRATION STRATEGY

### **Phase 1: Parallel System (SICHER!)**
```
✅ Behalte: acts, sequences, scenes, shots Tabellen
✅ Neu: timeline_nodes Tabelle (parallel)
✅ Beide Systeme laufen gleichzeitig
✅ Zero Downtime!
```

### **Phase 2: Data Migration**
```sql
-- Migriere existierende Daten
INSERT INTO timeline_nodes (project_id, template_id, level, parent_id, node_number, title, ...)
SELECT 
  project_id, 
  'film-3act' as template_id,
  1 as level,
  NULL as parent_id,
  act_number as node_number,
  title,
  ...
FROM acts;

-- Analog für sequences, scenes, shots
```

### **Phase 3: Frontend Switch**
```typescript
// ProjectsPage.tsx - Template Selection
<Select onChange={(templateId) => setProjectTemplate(templateId)}>
  <option value="film-3act">Film: 3-Akt-Struktur</option>
  <option value="film-heroes-journey">Film: Heldenreise</option>
  <option value="series-traditional">Serie: Traditional</option>
  <option value="book-novel">Buch: Roman</option>
  <option value="theater-classic">Theater: Klassisch</option>
  <option value="game-narrative">Game: Story-Driven</option>
</Select>
```

### **Phase 4: Deprecate Old Tables (SPÄTER!)**
```
Nach erfolgreicher Migration:
✅ timeline_nodes ist Production
❌ acts, sequences, scenes, shots können archiviert werden
```

---

## 🎯 VORTEILE

### **1. Neue Templates = Nur Frontend**
```typescript
// Neues Template: Film 5-Akt
{
  id: 'film-5act',
  type: 'film',
  name: '5-Akt-Struktur',
  levels: { ... },
  defaultStructure: { level_1_count: 5 },  // ← Das ist alles!
}

// Fertig! Kein Backend Deploy! ✅
```

### **2. Template Varianten unbegrenzt**
```
Film:
- 3-Akt
- 5-Akt
- Heldenreise (12 Stages)
- Save the Cat (15 Beats)
- Dan Harmon Story Circle (8 Steps)
- Freytag's Pyramid
- In Medias Res
- Nonlinear / Pulp Fiction Style
- ... unbegrenzt!
```

### **3. Generische UI Components**
```typescript
// EINE Timeline Component für ALLE Templates!
<GenericTimelineView 
  project={project} 
  template={TEMPLATES[project.template_id]} 
/>

// Rendered automatisch:
// - Film → Acts, Sequences, Scenes, Shots
// - Serie → Seasons, Episodes, Scenes, Shots
// - Buch → Parts, Chapters, Sections
// - Theater → Acts, Scenes, Beats
// - Game → Chapters, Levels, Missions, Cutscenes
```

### **4. Type-Safe Metadata**
```typescript
// Template definiert Schema
metadataSchema: {
  level_3: {
    timeOfDay: { type: 'enum', values: ['day', 'night'] }
  }
}

// UI rendered automatisch:
<Select>
  <option value="day">Day</option>
  <option value="night">Night</option>
</Select>

// Database speichert:
metadata: { "timeOfDay": "day" }
```

---

## 📁 DATEIEN DIE ICH ERSTELLE

```
✅ /lib/templates/registry-v2.ts
   → Enhanced Template Registry mit allen Templates

✅ /lib/templates/types.ts
   → TypeScript Interfaces für Template Engine

✅ /supabase/migrations/013_timeline_nodes.sql
   → Generische timeline_nodes Tabelle

✅ /supabase/functions/scriptony-timeline-v2/index.ts
   → Generische Timeline Function (alle Templates)

✅ /components/timeline/GenericTimelineView.tsx
   → Universelle Timeline Component

✅ /components/timeline/GenericContainer.tsx
   → Generischer Container (Act/Sequence/Scene/Shot)

✅ /lib/api/timeline-api-v2.ts
   → Generische API Client Functions

✅ /TEMPLATE_ENGINE_DEPLOY_GUIDE.md
   → Komplette Deploy-Anleitung
```

---

## 🚀 NÄCHSTE SCHRITTE

1. **Ich erstelle alle Dateien** (30 Min)
2. **Du reviewst die Struktur**
3. **Du deployest die Migration** (timeline_nodes Tabelle)
4. **Du deployest die Timeline Function**
5. **Du testest parallel zu existierendem System**
6. **Wenn happy → Frontend Switch**

**Ready? Let's go! 🎬**
