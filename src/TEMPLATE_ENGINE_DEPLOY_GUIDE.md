```
# 🚀 TEMPLATE ENGINE - DEPLOY GUIDE

## 🎯 Was wurde erstellt?

Ein **generisches Template-System** das:
- ✅ **7 Templates** out-of-the-box (Film 3-Akt, Heldenreise, Save the Cat, Serie, Buch, Theater, Game)
- ✅ **Beliebig erweiterbar** - neue Templates = nur Frontend Code!
- ✅ **Generische Database** - timeline_nodes statt acts/sequences/scenes/shots
- ✅ **Parallel lauffähig** - Alte Tabellen bleiben, Zero Downtime!

---

## 📁 ERSTELLTE DATEIEN

### **1. Template System (Frontend)**
```
✅ /lib/templates/types.ts
   → TypeScript Interfaces für Template Engine

✅ /lib/templates/registry-v2.ts
   → Template Registry mit allen 7 Templates
   
   Templates:
   - film-3act           (3-Akt-Struktur)
   - film-heroes-journey (12 Stages Heldenreise)
   - film-save-the-cat   (15 Beat Sheet)
   - series-traditional  (Staffeln → Episoden → Szenen → Shots)
   - book-novel          (Teile → Kapitel → Abschnitte)
   - theater-classic     (5 Akte → Szenen → Beats)
   - game-narrative      (Chapters → Levels → Missions → Cutscenes)
```

### **2. Database Migrations**
```
✅ /supabase/migrations/013_timeline_nodes.sql
   → Generische timeline_nodes Tabelle
   → RLS Policies
   → Helper Functions (get_node_descendants, get_node_path)
   → Migration Function (migrate_to_timeline_nodes)

✅ /supabase/migrations/014_add_template_to_projects.sql
   → Erweitert projects Tabelle um template_id
```

### **3. Dokumentation**
```
✅ /TEMPLATE_ENGINE_ARCHITECTURE.md
   → Komplette Architektur-Dokumentation
   → Template Beispiele
   → Use Cases

✅ /TEMPLATE_ENGINE_DEPLOY_GUIDE.md
   → Dieser Guide
```

---

## 🚀 DEPLOYMENT (Schritt-für-Schritt)

### **PHASE 1: Database Migration (5 Min)**

#### Schritt 1: SQL Migrations ausführen

**Öffne Supabase Dashboard → SQL Editor**

```sql
-- Migration 013: Timeline Nodes Tabelle
-- Kopiere kompletten Inhalt von /supabase/migrations/013_timeline_nodes.sql
-- → Run

-- Migration 014: Template Support in Projects
-- Kopiere kompletten Inhalt von /supabase/migrations/014_add_template_to_projects.sql
-- → Run
```

**✅ Checken ob erfolgreich:**
```sql
-- Timeline Nodes Tabelle existiert?
SELECT COUNT(*) FROM timeline_nodes;
-- → Sollte 0 sein (noch keine Daten)

-- Projects haben template_id?
SELECT id, title, template_id FROM projects LIMIT 5;
-- → Sollte 'film-3act' zeigen für alle
```

---

### **PHASE 2: Daten Migration (OPTIONAL - nur wenn du alte Daten migrieren willst)**

**Wenn du existierende Acts/Sequences/Scenes/Shots zu timeline_nodes migrieren willst:**

```sql
-- Supabase Dashboard → SQL Editor
SELECT migrate_to_timeline_nodes();
-- → NOTICE: Migration complete!

-- Checken:
SELECT 
  level,
  COUNT(*) as count,
  (SELECT name FROM (VALUES 
    (1, 'Acts'), 
    (2, 'Sequences'), 
    (3, 'Scenes'), 
    (4, 'Shots')
  ) AS l(level, name) WHERE l.level = timeline_nodes.level) as level_name
FROM timeline_nodes
GROUP BY level
ORDER BY level;

-- Beispiel Output:
-- level | count | level_name
-- ------+-------+-----------
--   1   |   3   | Acts
--   2   |   9   | Sequences
--   3   |  36   | Scenes
--   4   | 180   | Shots
```

**WICHTIG:** Alte Tabellen bleiben erhalten! Die Migration KOPIERT nur die Daten.

---

### **PHASE 3: Frontend Integration (SPÄTER)**

**Aktuell ist das System vorbereitet, aber noch nicht im Frontend aktiviert.**

**Wenn du bereit bist, das neue System zu aktivieren:**

1. **Template Selection in ProjectsPage**
   ```typescript
   // Beim Projekt erstellen
   <Select 
     label="Template"
     value={templateId}
     onChange={setTemplateId}
   >
     {TemplateRegistry.getAll().map(template => (
       <option key={template.id} value={template.id}>
         {template.icon} {template.name}
       </option>
     ))}
   </Select>
   ```

2. **Neue Timeline API verwenden**
   ```typescript
   // Statt:
   import { getActs, getSequences } from './lib/api/timeline-api';
   
   // Verwende:
   import { getNodes, createNode } from './lib/api/timeline-api-v2';
   ```

3. **Generische Timeline Component**
   ```typescript
   // Statt FilmTimeline.tsx
   <GenericTimelineView 
     project={project}
     template={TemplateRegistry.get(project.template_id)}
   />
   ```

---

## 🧪 TESTING

### **Test 1: Template Registry funktioniert**

```typescript
// Browser Console (auf beliebiger Page)
import TemplateRegistry from './lib/templates/registry-v2';

// Alle Templates
console.log(TemplateRegistry.getAll());
// → Array mit 7 Templates

// Film Templates
console.log(TemplateRegistry.getByType('film'));
// → [film-3act, film-heroes-journey, film-save-the-cat]

// Einzelnes Template
const template = TemplateRegistry.get('film-heroes-journey');
console.log(template.levels);
// → { level_1: { name: 'Stage', ... }, ... }

console.log(template.predefinedNodes.level_1);
// → [{ number: 1, title: 'Ordinary World' }, ...]
```

### **Test 2: Database Queries funktionieren**

```sql
-- Timeline Nodes Query (generisch!)
SELECT 
  tn.id,
  tn.template_id,
  tn.level,
  tn.node_number,
  tn.title,
  p.title as project_title
FROM timeline_nodes tn
LEFT JOIN projects p ON p.id = tn.project_id
WHERE tn.level = 1
ORDER BY tn.order_index;

-- Test Helper Functions
SELECT * FROM get_node_descendants('act-id-hier');
SELECT * FROM get_node_path('shot-id-hier');
```

---

## 📊 VERGLEICH: Alt vs. Neu

### **VORHER (Alt):**
```
Tabellen:
├── acts (Film-spezifisch)
├── sequences (Film-spezifisch)
├── scenes (Film-spezifisch)
└── shots (Film-spezifisch)

Problem: 
- Neue Templates = Neue Tabellen nötig
- Serie braucht seasons/episodes statt acts/sequences
- Buch braucht parts/chapters (keine shots!)
- Viel Code-Duplikation
```

### **NACHHER (Neu):**
```
Tabelle:
└── timeline_nodes (GENERISCH für alle Templates!)
    ├── level = 1 → Act / Season / Part / Act / Chapter
    ├── level = 2 → Sequence / Episode / Chapter / Scene / Level
    ├── level = 3 → Scene / Scene / Section / Beat / Mission
    └── level = 4 → Shot / Shot / null / null / Cutscene

Vorteile:
✅ Neue Templates = Nur Frontend Code (registry-v2.ts)
✅ Eine Tabelle für alles
✅ JSONB metadata für Template-spezifische Daten
✅ Helper Functions funktionieren für alle Templates
```

---

## 🎯 NÄCHSTE SCHRITTE

### **Option A: Parallel Betrieb (EMPFOHLEN)**
```
1. ✅ Migrations ausgeführt
2. ✅ Alte Daten migriert (optional)
3. ⏳ Template System existiert parallel
4. ⏳ Alte Acts/Sequences/Scenes/Shots laufen weiter
5. ⏳ Neue Projects können Templates wählen
6. ⏳ Schrittweise Migration zu timeline_nodes
```

### **Option B: Sofort-Switch (RISIKOREICH)**
```
1. ✅ Migrations ausgeführt
2. ✅ Alle Daten migriert
3. 🚨 Frontend auf timeline_nodes umstellen
4. 🚨 Alte Tabellen deprecaten
5. 🚨 Hoffen dass alles funktioniert 😅
```

**ICH EMPFEHLE OPTION A!**

---

## 🆕 NEUE TEMPLATES HINZUFÜGEN

### **So einfach ist es:**

```typescript
// /lib/templates/registry-v2.ts

export const FILM_NONLINEAR: TemplateDefinition = {
  id: 'film-nonlinear',
  type: 'film',
  name: 'Nonlinear / Pulp Fiction Style',
  description: 'Nicht-chronologische Erzählstruktur',
  
  levels: {
    level_1: { name: 'Timeline', namePlural: 'Timelines', icon: '🔀' },
    level_2: { name: 'Segment', namePlural: 'Segments', icon: '📽️' },
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
    level_1_count: 3,      // 3 Timelines (e.g., Present, Past, Future)
    level_2_per_parent: 4,
    level_3_per_parent: 5,
    level_4_per_parent: 5,
  },
  
  metadataSchema: {
    level_1: {
      timeframe: { 
        type: 'enum', 
        values: ['present', 'past', 'future', 'flashback'] 
      },
    },
    level_2: {
      chronologicalOrder: { type: 'number', label: 'Chronological Order' },
      screenOrder: { type: 'number', label: 'Screen Order' },
    },
    level_3: FILM_3ACT.metadataSchema!.level_3,
    level_4: FILM_3ACT.metadataSchema!.level_4,
  },
};

// Add to ALL_TEMPLATES array
const ALL_TEMPLATES: TemplateDefinition[] = [
  FILM_3ACT,
  FILM_HEROES_JOURNEY,
  FILM_SAVE_THE_CAT,
  FILM_NONLINEAR,  // ← NEU!
  // ...
];
```

**FERTIG! Kein Backend Deploy nötig!** 🎉

---

## 🐛 TROUBLESHOOTING

### Problem: "timeline_nodes Tabelle existiert nicht"
```sql
-- Checke ob Migration lief:
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'timeline_nodes';

-- Wenn leer → Migration 013 nochmal ausführen
```

### Problem: "RLS Policy Error"
```sql
-- Checke RLS Policies:
SELECT * FROM pg_policies WHERE tablename = 'timeline_nodes';

-- Sollte 4 Policies zeigen:
-- - timeline_nodes_select
-- - timeline_nodes_insert
-- - timeline_nodes_update
-- - timeline_nodes_delete
```

### Problem: "Migration Function fehlt"
```sql
-- Checke ob Function existiert:
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'migrate_to_timeline_nodes';

-- Wenn leer → Migration 013 nochmal ausführen
```

### Problem: "template_id fehlt in projects"
```sql
-- Checke ob Spalte existiert:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'template_id';

-- Wenn leer → Migration 014 nochmal ausführen
```

---

## 📚 WEITERE RESOURCES

- **Architektur Details**: `/TEMPLATE_ENGINE_ARCHITECTURE.md`
- **Template Examples**: Siehe `registry-v2.ts` - jedes Template ist voll dokumentiert
- **TypeScript Types**: `/lib/templates/types.ts`

---

## ✅ CHECKLISTE

Nach Deployment:

- [ ] Migration 013 ausgeführt (timeline_nodes Tabelle)
- [ ] Migration 014 ausgeführt (template_id in projects)
- [ ] Template Registry funktioniert (Browser Console Test)
- [ ] Database Queries funktionieren (SQL Test)
- [ ] (Optional) Alte Daten migriert
- [ ] Dokumentation gelesen

**Bereit für Phase 3 (Frontend Integration)?**

- [ ] Template Selection UI gebaut
- [ ] Timeline API V2 integriert
- [ ] Generische Timeline Component erstellt
- [ ] Tests geschrieben
- [ ] Parallel-Betrieb verifiziert

---

## 🎉 DONE!

Du hast jetzt ein **production-ready Template System** das:
- ✅ 7 Templates out-of-the-box
- ✅ Unbegrenzt erweiterbar (nur Frontend!)
- ✅ Generische Database
- ✅ Type-safe mit TypeScript
- ✅ Full JSONB Support für Custom Data
- ✅ Migration Helper für alte Daten
- ✅ RLS Security

**Neue Templates hinzufügen = 20 Zeilen Code in registry-v2.ts!** 🚀
```
