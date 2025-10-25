# 🎬 TEMPLATE ENGINE - QUICK REFERENCE

## 🚀 IN 60 SEKUNDEN

### Was ist das?
Ein **generisches Template-System** für Scriptony, das beliebige Project Types unterstützt ohne Backend-Änderungen.

### Was funktioniert out-of-the-box?
```
Film:
├── 3-Akt-Struktur (film-3act)
├── Heldenreise (film-heroes-journey)
└── Save the Cat (film-save-the-cat)

Serie:
└── Traditional (series-traditional)

Buch:
└── Roman (book-novel)

Theater:
└── Klassisch (theater-classic)

Game:
└── Story-Driven (game-narrative)
```

### Wie füge ich ein neues Template hinzu?
```typescript
// /lib/templates/registry-v2.ts - add to ALL_TEMPLATES array

export const MEIN_TEMPLATE: TemplateDefinition = {
  id: 'mein-typ-name',
  type: 'film',  // or 'series', 'book', etc.
  name: 'Anzeige Name',
  description: 'Beschreibung',
  
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
    hasLocations: true,
    hasDuration: true,
  },
  
  defaultStructure: {
    level_1_count: 3,
    level_2_per_parent: 3,
    level_3_per_parent: 4,
    level_4_per_parent: 5,
  },
};

// Fertig! Kein Backend Deploy! ✅
```

---

## 📊 TEMPLATE VERGLEICH

| Template | Type | Level 1 | Level 2 | Level 3 | Level 4 | Cinema | Levels |
|----------|------|---------|---------|---------|---------|--------|--------|
| `film-3act` | Film | Act | Sequence | Scene | Shot | ✅ | 4 |
| `film-heroes-journey` | Film | Stage (12) | Phase | Scene | Shot | ✅ | 4 |
| `film-save-the-cat` | Film | Beat (15) | Sequence | Scene | Shot | ✅ | 4 |
| `series-traditional` | Serie | Season | Episode | Scene | Shot | ✅ | 4 |
| `book-novel` | Buch | Part | Chapter | Section | - | ❌ | 3 |
| `theater-classic` | Theater | Act (5) | Scene | Beat | - | ❌ | 3 |
| `game-narrative` | Game | Chapter | Level | Mission | Cutscene | ✅ | 4 |

---

## 💾 DATABASE SCHEMA

### Timeline Nodes (generisch!)
```sql
timeline_nodes {
  id              UUID
  project_id      UUID      -- Projekt
  parent_id       UUID      -- Hierarchie (NULL für Level 1)
  template_id     TEXT      -- 'film-3act', 'series-traditional', etc.
  level           INT       -- 1, 2, 3, 4
  node_number     INT       -- Nummerierung
  title           TEXT      -- Name/Titel
  description     TEXT      -- Beschreibung
  color           TEXT      -- UI Farbe
  order_index     INT       -- Sortierung
  metadata        JSONB     -- Template-spezifische Daten!
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
}
```

### Metadata Beispiele

**Film Scene (Level 3):**
```json
{
  "location": "Central Park",
  "timeOfDay": "day",
  "interior": false
}
```

**Film Shot (Level 4):**
```json
{
  "cameraAngle": "low-angle",
  "cameraMovement": "dolly",
  "framing": "ws",
  "lens": "24mm",
  "duration": 5
}
```

**Book Chapter (Level 2):**
```json
{
  "wordCount": 3500,
  "pov": "first-person",
  "narrator": "John"
}
```

**Game Mission (Level 3):**
```json
{
  "objective": "Rescue the princess",
  "secondaryObjectives": ["Collect 3 keys", "Defeat boss"],
  "rewards": ["Gold Sword", "500 XP"],
  "enemyTypes": ["Goblin", "Troll"]
}
```

---

## 🔧 API USAGE

### Get Template
```typescript
import TemplateRegistry from './lib/templates/registry-v2';

// Single template
const template = TemplateRegistry.get('film-3act');

// All templates
const all = TemplateRegistry.getAll();

// By type
const filmTemplates = TemplateRegistry.getByType('film');

// Check exists
const exists = TemplateRegistry.has('film-3act'); // true
```

### Level Config
```typescript
const template = TemplateRegistry.get('film-3act');

// Get level config
const level1 = template.levels.level_1;
console.log(level1.name);       // "Act"
console.log(level1.namePlural); // "Acts"
console.log(level1.icon);       // "🎬"

// Or via registry
const levelConfig = TemplateRegistry.getLevelConfig('film-3act', 1);
```

### Features
```typescript
const template = TemplateRegistry.get('book-novel');

if (template.features.hasCinematography) {
  // Show camera controls
} else {
  // Hide camera controls
}

if (template.features.hasDialogue) {
  // Show dialogue editor
}
```

### Predefined Nodes
```typescript
const template = TemplateRegistry.get('film-heroes-journey');

// Get predefined Level 1 nodes (12 Stages)
const stages = template.predefinedNodes?.level_1 || [];

stages.forEach(stage => {
  console.log(`${stage.number}. ${stage.title}`);
  // 1. Ordinary World
  // 2. Call to Adventure
  // ...
});
```

---

## 📝 METADATA SCHEMA

### Define Schema in Template
```typescript
metadataSchema: {
  level_3: {  // Scene
    timeOfDay: { 
      type: 'enum',
      label: 'Time of Day',
      values: ['day', 'night', 'dawn', 'dusk'],
      required: true,
    },
    location: { 
      type: 'string',
      label: 'Location',
      maxLength: 100,
    },
    interior: { 
      type: 'boolean',
      label: 'Interior',
      default: false,
    },
    temperature: {
      type: 'number',
      label: 'Temperature (°C)',
      min: -50,
      max: 50,
    },
  },
}
```

### Use in UI
```typescript
const schema = template.metadataSchema?.level_3;

Object.entries(schema).forEach(([key, field]) => {
  switch (field.type) {
    case 'enum':
      // Render <Select> with field.values
      break;
    case 'boolean':
      // Render <Checkbox>
      break;
    case 'number':
      // Render <Input type="number" min={field.min} max={field.max}>
      break;
    case 'string':
      // Render <Input type="text" maxLength={field.maxLength}>
      break;
    case 'richtext':
      // Render <RichTextEditor>
      break;
  }
});
```

---

## 🎨 UI CONFIGURATION

### Template UI Config
```typescript
uiConfig: {
  defaultView: 'timeline',    // 'timeline' | 'list' | 'kanban' | 'outline'
  showNumbers: true,          // Show numbers (Act 1, Scene 5)
  enableReorder: true,        // Enable drag & drop
  levelColors: {              // Custom colors per level
    level_1: '#6E59A5',
    level_2: '#8B7BB8',
    level_3: '#A89CC8',
    level_4: '#C5BDD8',
  },
}
```

---

## 🔄 MIGRATION

### From Old Schema to Timeline Nodes

```sql
-- Auto-migrate existing data
SELECT migrate_to_timeline_nodes();

-- Result:
-- NOTICE: Migration complete!

-- Check migrated data
SELECT level, COUNT(*) FROM timeline_nodes GROUP BY level;
--  level | count
-- -------+-------
--    1   |    3    (Acts)
--    2   |    9    (Sequences)
--    3   |   36    (Scenes)
--    4   |  180    (Shots)
```

### Manual Migration
```sql
-- Migrate single project
INSERT INTO timeline_nodes (...)
SELECT ... FROM acts WHERE project_id = 'project-id';

-- Or update template_id for migrated nodes
UPDATE timeline_nodes 
SET template_id = 'film-save-the-cat'
WHERE project_id = 'project-id';
```

---

## 🧪 TESTING CHECKLIST

### Template Registry
```typescript
// Browser Console
import TemplateRegistry from './lib/templates/registry-v2';

✅ TemplateRegistry.getAll().length === 7
✅ TemplateRegistry.get('film-3act') !== undefined
✅ TemplateRegistry.getByType('film').length === 3
✅ TemplateRegistry.has('nonexistent') === false
```

### Database
```sql
✅ SELECT COUNT(*) FROM timeline_nodes;
✅ SELECT DISTINCT template_id FROM timeline_nodes;
✅ SELECT * FROM get_node_descendants('act-id');
✅ SELECT * FROM get_node_path('shot-id');
```

### RLS
```sql
✅ SELECT * FROM pg_policies WHERE tablename = 'timeline_nodes';
-- Should show 4 policies
```

---

## 🎯 BEISPIEL: Film vs. Serie

### Film (3-Act)
```
Project { template_id: 'film-3act' }
└── Act 1 { level: 1, node_number: 1 }
    ├── Sequence 1 { level: 2, parent_id: act1_id }
    │   ├── Scene 1 { level: 3, parent_id: seq1_id }
    │   │   ├── Shot 1 { level: 4, parent_id: scene1_id }
    │   │   └── Shot 2
    │   └── Scene 2
    └── Sequence 2
```

### Serie (Traditional)
```
Project { template_id: 'series-traditional' }
└── Season 1 { level: 1, node_number: 1 }
    ├── Episode 1 { level: 2, parent_id: season1_id }
    │   ├── Scene 1 { level: 3, parent_id: ep1_id }
    │   │   ├── Shot 1 { level: 4, parent_id: scene1_id }
    │   │   └── Shot 2
    │   └── Scene 2
    └── Episode 2
```

**Gleiche Tabelle, unterschiedliche Interpretation!** 🎉

---

## ⚡ PERFORMANCE

### Indexes
```sql
-- All queries are optimized with indexes:
✅ idx_timeline_nodes_project     -- Query by project
✅ idx_timeline_nodes_parent      -- Query children
✅ idx_timeline_nodes_template    -- Query by template
✅ idx_timeline_nodes_level       -- Filter by level
✅ idx_timeline_nodes_order       -- Sort within parent
✅ idx_timeline_nodes_metadata    -- JSONB queries (GIN)
```

### Recursive Queries
```sql
-- Get all descendants (optimized CTE)
SELECT * FROM get_node_descendants('node-id');

-- Get node path (from root to leaf)
SELECT * FROM get_node_path('node-id');
```

---

## 📚 LINKS

- **Architektur**: `/TEMPLATE_ENGINE_ARCHITECTURE.md`
- **Deploy Guide**: `/TEMPLATE_ENGINE_DEPLOY_GUIDE.md`
- **Types**: `/lib/templates/types.ts`
- **Registry**: `/lib/templates/registry-v2.ts`
- **Migration**: `/supabase/migrations/013_timeline_nodes.sql`

---

**Happy Templating! 🎬**
