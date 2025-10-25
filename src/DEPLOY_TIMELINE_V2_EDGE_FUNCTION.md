# 🚀 DEPLOY TIMELINE V2 EDGE FUNCTION

## ✅ WAS IST NEU?

Du hast jetzt:
```
✅ /lib/templates/types.ts (TypeScript Types)
✅ /lib/templates/registry-v2.ts (7 Templates)
✅ /lib/api/timeline-api-v2.ts (Frontend API Client)
✅ /supabase/functions/scriptony-timeline-v2/index.ts (NEUE Edge Function!)
✅ /supabase/migrations/013_timeline_nodes.sql (Database)
✅ /supabase/migrations/014_add_template_to_projects.sql (Database)
```

**Die neue Edge Function ist GENERISCH und funktioniert mit ALLEN Templates!** 🎉

---

## 🎯 EDGE FUNCTION FEATURES

### **scriptony-timeline-v2** unterstützt:

#### **CRUD Operations (Generisch!)**
```
GET    /nodes                    → Get nodes with filters
GET    /nodes/:id                → Get single node
GET    /nodes/:id/children       → Get children (recursive optional)
GET    /nodes/:id/path           → Get node path (breadcrumb)
POST   /nodes                    → Create node
PUT    /nodes/:id                → Update node
DELETE /nodes/:id                → Delete node (cascades!)
```

#### **Bulk Operations**
```
POST   /nodes/bulk               → Bulk create nodes
POST   /nodes/reorder            → Reorder nodes (drag & drop)
POST   /initialize-project       → Initialize project structure
```

#### **Template Support**
```
✅ Film: Acts → Sequences → Scenes → Shots
✅ Serie: Seasons → Episodes → Scenes → Shots
✅ Buch: Parts → Chapters → Sections
✅ Theater: Acts → Scenes → Beats
✅ Game: Chapters → Levels → Missions → Cutscenes
✅ ... ALLE Templates aus registry-v2.ts!
```

---

## 📋 DEPLOYMENT (Step-by-Step)

### **SCHRITT 1: Database Migrations (ERST DIESE!)**

**Öffne Supabase Dashboard → SQL Editor**

```sql
-- ============================================================================
-- MIGRATION 013: timeline_nodes Tabelle
-- ============================================================================

-- Kopiere KOMPLETTEN Inhalt von:
-- /supabase/migrations/013_timeline_nodes.sql
-- → Paste in SQL Editor
-- → Run

-- ✅ Checken:
SELECT COUNT(*) FROM timeline_nodes;
-- → Sollte 0 sein

-- ============================================================================
-- MIGRATION 014: template_id in projects
-- ============================================================================

-- Kopiere KOMPLETTEN Inhalt von:
-- /supabase/migrations/014_add_template_to_projects.sql
-- → Paste in SQL Editor
-- → Run

-- ✅ Checken:
SELECT id, title, template_id FROM projects LIMIT 5;
-- → Sollte 'film-3act' zeigen
```

---

### **SCHRITT 2: Edge Function Deployen**

**Öffne Supabase Dashboard → Edge Functions**

#### **A) Neue Function erstellen**
```
1. Click: "+ New Edge Function"
2. Name: "scriptony-timeline-v2"
3. Template: "Blank Function"
4. Click: "Create Function"
```

#### **B) Code kopieren**
```typescript
// Öffne: /supabase/functions/scriptony-timeline-v2/index.ts

// KOMPLETTEN Inhalt kopieren (800+ Zeilen)
// → Paste in Supabase Editor
// → Save
```

#### **C) Deployen**
```
1. Click: "Deploy"
2. Wait: ~30-60 Sekunden
3. ✅ Status sollte "Deployed" zeigen
```

---

### **SCHRITT 3: Function Testen**

#### **Health Check**
```bash
# Test ob Function online ist
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-timeline-v2/health

# Expected Response:
{
  "status": "ok",
  "function": "scriptony-timeline-v2",
  "version": "2.0.0",
  "features": ["generic-templates", "jsonb-metadata", "all-project-types"],
  "timestamp": "2025-10-25T..."
}
```

#### **Create Node Test**
```bash
# Test Node Creation
curl -X POST \
  https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-timeline-v2/nodes \
  -H "Authorization: Bearer YOUR-ACCESS-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "templateId": "film-3act",
    "level": 1,
    "nodeNumber": 1,
    "title": "Act 1"
  }'

# Expected Response:
{
  "node": {
    "id": "uuid...",
    "projectId": "...",
    "templateId": "film-3act",
    "level": 1,
    "parentId": null,
    "nodeNumber": 1,
    "title": "Act 1",
    ...
  }
}
```

#### **Get Nodes Test**
```bash
# Test Query
curl "https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-timeline-v2/nodes?project_id=YOUR-PROJECT-ID&level=1" \
  -H "Authorization: Bearer YOUR-ACCESS-TOKEN"

# Expected Response:
{
  "nodes": [
    {
      "id": "...",
      "level": 1,
      "title": "Act 1",
      ...
    }
  ]
}
```

---

## 🧪 FRONTEND INTEGRATION

### **Option A: Direkt API verwenden**

```typescript
import { getNodes, createNode } from './lib/api/timeline-api-v2';
import TemplateRegistry from './lib/templates/registry-v2';

// Get template
const template = TemplateRegistry.get('film-3act');

// Get all Acts (Level 1)
const acts = await getNodes({ 
  projectId: 'project-id',
  level: 1 
});

// Create new Act
const newAct = await createNode({
  projectId: 'project-id',
  templateId: 'film-3act',
  level: 1,
  nodeNumber: 2,
  title: 'Act 2',
});

// Get Sequences for Act
const sequences = await getNodes({
  projectId: 'project-id',
  level: 2,
  parentId: acts[0].id,
});
```

### **Option B: Template-spezifische Helper**

```typescript
import { 
  getActs, 
  getSequences, 
  getScenes, 
  getShots 
} from './lib/api/timeline-api-v2';

// Film
const acts = await getActs('project-id');
const sequences = await getSequences('project-id', actId);
const scenes = await getScenes('project-id', sequenceId);
const shots = await getShots('project-id', sceneId);

// Serie
import { getSeasons, getEpisodes } from './lib/api/timeline-api-v2';

const seasons = await getSeasons('project-id');
const episodes = await getEpisodes('project-id', seasonId);

// Buch
import { getParts, getChapters, getSections } from './lib/api/timeline-api-v2';

const parts = await getParts('project-id');
const chapters = await getChapters('project-id', partId);
const sections = await getSections('project-id', chapterId);
```

### **Option C: Initialize Project**

```typescript
import { initializeProject } from './lib/api/timeline-api-v2';
import TemplateRegistry from './lib/templates/registry-v2';

const template = TemplateRegistry.get('film-3act');

// Initialize komplette Projekt-Struktur
const nodes = await initializeProject({
  projectId: 'project-id',
  templateId: 'film-3act',
  structure: template.defaultStructure,
});

// Erstellt automatisch:
// - 3 Acts
// - 9 Sequences (3 per Act)
// - 36 Scenes (4 per Sequence)
// - 180 Shots (5 per Scene)
```

---

## 🔄 MIGRATION VON ALTEN TABELLEN

### **Option 1: Auto-Migration (EINFACH!)**

```sql
-- Supabase Dashboard → SQL Editor

-- Migriert ALLE existierenden Acts/Sequences/Scenes/Shots
SELECT migrate_to_timeline_nodes();

-- ✅ Checken:
SELECT 
  level,
  COUNT(*) as count,
  (SELECT name FROM (VALUES 
    (1, 'Level 1'), 
    (2, 'Level 2'), 
    (3, 'Level 3'), 
    (4, 'Level 4')
  ) AS l(level, name) WHERE l.level = timeline_nodes.level) as level_name
FROM timeline_nodes
GROUP BY level
ORDER BY level;
```

### **Option 2: Schrittweise Migration**

```typescript
// Frontend Migration Tool
import { bulkCreateNodes } from './lib/api/timeline-api-v2';
import { getActs as getOldActs } from './lib/api/timeline-api';

async function migrateProject(projectId: string) {
  // Get old acts
  const oldActs = await getOldActs(projectId);
  
  // Convert to new nodes
  const newNodes = oldActs.map((act, index) => ({
    projectId,
    templateId: 'film-3act',
    level: 1 as const,
    parentId: null,
    nodeNumber: act.actNumber,
    title: act.title,
    description: act.description,
    metadata: {},
  }));
  
  // Bulk create
  await bulkCreateNodes({ nodes: newNodes });
  
  // Repeat for sequences, scenes, shots...
}
```

---

## 📊 API ENDPOINTS REFERENCE

### **GET /nodes**
```
Query Params:
  - project_id (required)
  - level (optional): 1, 2, 3, 4
  - parent_id (optional): UUID oder "null"
  - template_id (optional)

Response:
  { nodes: TimelineNode[] }
```

### **GET /nodes/:id**
```
Response:
  { node: TimelineNode }
```

### **GET /nodes/:id/children**
```
Query Params:
  - recursive (optional): "true" oder "false"

Response:
  { children: TimelineNode[] }
```

### **GET /nodes/:id/path**
```
Response:
  { path: Array<{ id, level, title, depth }> }
```

### **POST /nodes**
```
Body:
  {
    projectId: string,
    templateId: string,
    level: 1 | 2 | 3 | 4,
    parentId?: string | null,
    nodeNumber: number,
    title: string,
    description?: string,
    color?: string,
    metadata?: Record<string, any>
  }

Response:
  { node: TimelineNode }
```

### **PUT /nodes/:id**
```
Body:
  {
    nodeNumber?: number,
    title?: string,
    description?: string,
    color?: string,
    orderIndex?: number,
    metadata?: Record<string, any>
  }

Response:
  { node: TimelineNode }
```

### **DELETE /nodes/:id**
```
Response:
  { success: true }
```

### **POST /nodes/bulk**
```
Body:
  {
    nodes: CreateNodeRequest[]
  }

Response:
  { nodes: TimelineNode[], count: number }
```

### **POST /nodes/reorder**
```
Body:
  {
    nodeIds: string[]
  }

Response:
  { success: true, count: number }
```

### **POST /initialize-project**
```
Body:
  {
    projectId: string,
    templateId: string,
    structure: {
      level_1_count: number,
      level_2_per_parent?: number,
      level_3_per_parent?: number,
      level_4_per_parent?: number
    },
    predefinedNodes?: {
      level_1?: Array<{ number, title, description? }>,
      ...
    }
  }

Response:
  { success: true, count: number, nodes: TimelineNode[] }
```

---

## 🐛 TROUBLESHOOTING

### **Function nicht erreichbar**
```bash
# Checke Function Status
curl https://YOUR-PROJECT-ID.supabase.co/functions/v1/scriptony-timeline-v2/health

# Wenn 404:
→ Function nicht deployed
→ Name falsch (muss exakt "scriptony-timeline-v2" sein)

# Wenn 500:
→ Code Fehler
→ Checke Supabase Dashboard → Edge Functions → Logs
```

### **"timeline_nodes does not exist"**
```sql
-- Checke ob Tabelle existiert
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'timeline_nodes';

-- Wenn leer:
→ Migration 013 noch nicht ausgeführt
→ Run Migration nochmal
```

### **"Unauthorized" Error**
```typescript
// Checke ob Auth Token korrekt
import { getAuthToken } from './lib/auth/getAuthToken';

const token = await getAuthToken();
console.log('Token:', token);

// Token sollte nicht leer sein
// Wenn leer → User nicht eingeloggt
```

### **RLS Policy Error**
```sql
-- Checke RLS Policies
SELECT * FROM pg_policies WHERE tablename = 'timeline_nodes';

-- Sollte 4 Policies zeigen
-- Wenn nicht → Migration 013 nochmal ausführen
```

---

## ✅ DEPLOYMENT CHECKLIST

Vor Go-Live:

### **Database**
- [ ] Migration 013 ausgeführt (timeline_nodes)
- [ ] Migration 014 ausgeführt (template_id)
- [ ] RLS Policies aktiv (4 Stück)
- [ ] Indexes erstellt (6 Stück)
- [ ] Helper Functions vorhanden (2 Stück)

### **Edge Function**
- [ ] scriptony-timeline-v2 deployed
- [ ] Health Check funktioniert
- [ ] Create Node Test funktioniert
- [ ] Get Nodes Test funktioniert
- [ ] Logs sauber (keine Errors)

### **Frontend**
- [ ] timeline-api-v2.ts importierbar
- [ ] Template Registry funktioniert
- [ ] API Calls funktionieren
- [ ] Error Handling vorhanden

### **Optional**
- [ ] Alte Daten migriert
- [ ] Parallel-Betrieb getestet
- [ ] Performance getestet

---

## 🎉 FERTIG!

Du hast jetzt:
- ✅ Generische Timeline Edge Function (scriptony-timeline-v2)
- ✅ Frontend API Client (timeline-api-v2.ts)
- ✅ 7 Templates out-of-the-box
- ✅ Unbegrenzt erweiterbar

**Neue Templates = Nur registry-v2.ts ändern!** 🚀

---

## 📚 NEXT STEPS

1. **Deploy Edge Function** (dieser Guide)
2. **Test API Calls** (Postman / curl)
3. **Build Frontend UI** (GenericTimelineView Component)
4. **Migrate alte Daten** (optional)
5. **Add neue Templates** (registry-v2.ts)

**Ready? Los geht's!** 🎬
