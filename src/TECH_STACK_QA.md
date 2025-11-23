# 📚 Scriptony Tech Stack - Q&A

## ❓ Frage 1: Editor-Tech
**Was nutzt du für den Text-Editor?**

### ✅ Antwort: **Tiptap (ProseMirror-basiert)**

**Details:**
```typescript
// /components/RichTextEditorModal.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
```

**Extensions:**
- `StarterKit` (Bold, Italic, Lists, Headings, etc.)
- `Mention` (Custom Character Mentions: @CharacterName)
- `Underline`
- Character Counter

**Warum Tiptap?**
- ✅ ProseMirror-basiert (robust, production-ready)
- ✅ React-Integration out-of-the-box
- ✅ Extensible (Custom Mentions für Characters)
- ✅ JSON-Output (strukturierte Daten statt HTML)
- ✅ Real-time Updates

**Datenformat:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hello " },
        {
          "type": "characterMention",
          "attrs": {
            "id": "char-123",
            "label": "John Doe"
          }
        }
      ]
    }
  ]
}
```

**NICHT genutzt:**
- ❌ `<textarea>` - Zu basic, kein Rich Text
- ❌ `contentEditable` direkt - Zu kompliziert, Cross-Browser-Probleme
- ❌ Slate.js - Zu low-level, mehr Arbeit
- ❌ Lexical - Zu neu (Meta's Editor), weniger Extensions

---

## ❓ Frage 2: State Management
**Wie werden die Daten gehalten?**

### ✅ Antwort: **React State (useState) - KEIN Redux/Zustand**

**Details:**
```typescript
// /components/BookDropdown.tsx
const [acts, setActs] = useState<Act[]>([]);
const [sequences, setSequences] = useState<Sequence[]>([]); // Kapitel
const [scenes, setScenes] = useState<Scene[]>([]);          // Abschnitte

// /App.tsx
const [currentPage, setCurrentPage] = useState('home');
const [selectedId, setSelectedId] = useState<string>();
```

**State-Struktur:**
```
App.tsx
├─ currentPage (string)
├─ selectedId (string)
└─ theme (light/dark)

ProjectsPage.tsx
├─ projects (Project[])
├─ characters (Character[])
└─ timelineCache (TimelineData)

FilmDropdown.tsx / BookDropdown.tsx
├─ acts (Act[])
├─ sequences (Sequence[])
├─ scenes (Scene[])
└─ shots (Shot[]) - nur Film/Series
```

**Warum KEIN Redux/Zustand?**
1. ✅ **Einfachheit** - React State reicht für diese App-Größe
2. ✅ **Component-Scoped** - Jede Page hat eigenen State
3. ✅ **Performance** - Mit unserem Cache-System (neu!) ist es schnell genug
4. ✅ **Weniger Dependencies** - Kleiner Bundle Size

**State Lifting Pattern:**
```typescript
// ProjectsPage lädt Timeline
const [timelineCache, setTimelineCache] = useState<TimelineData>();

// Gibt Daten an FilmDropdown weiter
<FilmDropdown 
  projectId={id}
  initialData={timelineCache}
  onDataChange={setTimelineCache}
/>

// FilmDropdown nutzt initialData für instant render
// Bei Änderungen: onDataChange() → Update Parent Cache
```

**Optimistic UI Pattern:**
```typescript
// 1. Sofort UI updaten (optimistic)
setScenes(scenes => scenes.map(sc => 
  sc.id === id ? { ...sc, title: newTitle } : sc
));

// 2. API Call im Hintergrund
await api.updateScene(id, { title: newTitle });

// 3. Bei Fehler: Rollback
catch (error) {
  loadTimeline(); // Reload from server
}
```

---

## ❓ Frage 3: Datenbank/Sync
**Speichert die App bei jedem Keystroke im Backend?**

### ✅ Antwort: **JA, aber mit Debouncing + Optimistic UI**

**Details:**

### Speicher-Strategie:

**1. Tiptap Editor - SOFORTIGES Speichern (bei jedem onUpdate)**
```typescript
// /components/RichTextEditorModal.tsx
onUpdate: ({ editor }) => {
  const json = editor.getJSON();
  onChangeRef.current(json); // → Triggert Save
}

// /components/BookDropdown.tsx
onChange={async (jsonDoc) => {
  // Optimistic update (instant UI)
  setScenes(scenes => scenes.map(sc => 
    sc.id === editingSceneForModal.id 
      ? { ...sc, content: jsonDoc } 
      : sc
  ));

  // Backend save (nicht geblockt)
  await TimelineAPIV2.updateNode(sceneId, {
    metadata: { content: jsonDoc }
  }, token);
}}
```

**⚠️ PROBLEM:** Das ist aktuell **bei jedem Keystroke ein API Call!**

**Keine Debouncing im Code gefunden!**
```typescript
// /components/BookDropdown.tsx:283
// 🔥 FIX: Debounced save for scene content
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// ⚠️ ABER: Dieser Ref wird NICHT verwendet im Code!
// TODO: Debouncing implementieren!
```

### Wie es SEIN SOLLTE (Empfehlung):

```typescript
// Debounced Save (500ms delay)
const debouncedSave = useCallback(
  debounce(async (sceneId, content) => {
    await TimelineAPIV2.updateNode(sceneId, {
      metadata: { content }
    }, token);
  }, 500),
  []
);

onChange={async (jsonDoc) => {
  // Optimistic update (instant)
  setScenes(...);
  
  // Debounced save (500ms nach letztem Keystroke)
  debouncedSave(sceneId, jsonDoc);
}}
```

**Database:**
- Backend: **Supabase (PostgreSQL)**
- Connection: **HTTP REST API** (NICHT Websockets)
- Pattern: **"Optimistic First" mit Background Sync**

**NICHT genutzt:**
- ❌ Websockets/Realtime - Keine Echtzeit-Collaboration
- ❌ Local-First (Offline) - App braucht Internet
- ❌ IndexedDB - Nur localStorage für Cache

---

## ❓ Frage 4: Listen-Länge & Rendering
**Rendert die App wirklich 600 Seiten auf einmal?**

### ✅ Antwort: **NEIN - Collapsible UI mit Lazy Loading**

**Details:**

### Current Implementation: **Collapsible Dropdowns**

```typescript
// /components/BookDropdown.tsx
{acts.map(act => (
  <Collapsible open={expandedActs.has(act.id)}>
    <CollapsibleTrigger>
      Act {act.actNumber} {/* Immer sichtbar */}
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      {/* NUR gerendert wenn expanded! */}
      {actChapters.map(chapter => (
        <Collapsible open={expandedSequences.has(chapter.id)}>
          <CollapsibleTrigger>
            {chapter.title}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {/* NUR gerendert wenn expanded! */}
            {chapterSections.map(section => (
              <div>
                {/* Text-Content als ReadonlyTiptapView */}
                <ReadonlyTiptapView content={section.content} />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </CollapsibleContent>
  </Collapsible>
))}
```

### Was wird IMMER gerendert:
- ✅ Act Headers (3-5 Acts)
- ✅ Collapsed Chapter Headers (wenn Act expanded)

### Was wird NUR bei Expand gerendert:
- 📖 Chapter Content (nur wenn Chapter expanded)
- 📖 Section Content (nur wenn Section expanded)
- 📖 Full Tiptap Content (nur sichtbare Sections)

### Performance bei 600 Seiten Buch:

**Annahme:**
- 600 Seiten = ~150,000 Wörter
- 3 Acts
- ~50 Chapters
- ~200 Sections (Abschnitte)

**DOM Nodes bei "ALLES COLLAPSED":**
```
3 Acts (collapsed)
= ~3 DOM Elements
= < 1ms Render Time ✅
```

**DOM Nodes bei "EIN ACT EXPANDED":**
```
1 Act (expanded)
├─ 15 Chapters (collapsed)
= ~18 DOM Elements
= ~5ms Render Time ✅
```

**DOM Nodes bei "EIN CHAPTER EXPANDED":**
```
1 Chapter (expanded)
├─ 5-10 Sections mit Text
├─ Tiptap Rendering (~500 words per section)
= ~200-500 DOM Elements
= ~50-100ms Render Time ✅
```

**WORST CASE (Alles expanded):**
```
200 Sections mit je 750 Wörtern
= ~50,000+ DOM Elements
= ~2-5 SEKUNDEN Render Time ⚠️
```

**Aber:** User expandiert NIEMALS alles auf einmal!

### NICHT implementiert:
- ❌ Virtual Scrolling (react-window, react-virtualized)
- ❌ Windowing
- ❌ Lazy Loading von API (alle Daten werden initial geladen)
- ❌ Pagination

### SOLLTE implementiert werden (Empfehlung):

```typescript
// Virtual Scrolling für lange Listen
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={800}
  itemCount={sections.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <Section data={sections[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 📊 Performance-Zusammenfassung

| Aspekt | Current State | Optimization Potential |
|--------|---------------|------------------------|
| **Editor** | ✅ Tiptap (Production-Ready) | - |
| **State** | ✅ React State (Einfach) | ⚠️ Zustand bei > 100 Projects |
| **Sync** | ⚠️ Save bei JEDEM Keystroke | 🔥 DEBOUNCING (500ms) |
| **Rendering** | ✅ Collapsible (Smart) | ⚠️ Virtual Scrolling bei > 100 items |
| **Caching** | ✅ NEU: localStorage + Memory | ✅ Perfekt! |

---

## 🔥 Critical Issues gefunden:

### 1. **KEIN Debouncing bei Text-Editing!**
```typescript
// PROBLEM: API Call bei jedem Keystroke
onUpdate: ({ editor }) => {
  onChange(editor.getJSON()); // → Save to DB
}

// LÖSUNG: Debounce 500ms
const debouncedSave = useDebounce(onChange, 500);
onUpdate: ({ editor }) => {
  debouncedSave(editor.getJSON());
}
```

### 2. **Alle Timeline-Daten werden initial geladen**
```typescript
// PROBLEM: Lädt ALLE Acts/Chapters/Sections auf einmal
const [allSequences, allScenes, allShots] = await Promise.all([
  TimelineAPI.getAllSequencesByProject(projectId, token),
  TimelineAPI.getAllScenesByProject(projectId, token),
  ShotsAPI.getAllShotsByProject(projectId, token),
]);

// Bei 600 Seiten = ~200 Sections = GROSSER Initial Load!
```

**Lösung:** Lazy Loading (Acts laden, Chapters on-demand)

### 3. **Kein Virtual Scrolling bei langen Listen**
```typescript
// PROBLEM: Wenn User 50+ Chapters expanded
// = 50+ DOM Subtrees = Langsam

// LÖSUNG: react-window für Listen > 20 Items
```

---

## 🚀 Recommendations

### Short-term (Sofort):
1. ✅ **Debouncing implementieren** (500ms für Text-Editor)
2. ✅ **Cache-System nutzen** (schon implementiert! 🎉)

### Medium-term:
3. ⚠️ **Virtual Scrolling** für Chapter/Section Listen
4. ⚠️ **Lazy Loading** von Timeline-Daten (on-demand)

### Long-term:
5. 💡 **Zustand** für Global State (bei > 100 Projects)
6. 💡 **Websockets** für Realtime Collaboration (optional)
7. 💡 **IndexedDB** für Offline-Mode (optional)

---

**Fazit:** 
Die App ist **gut strukturiert** mit modernen Tools (Tiptap, React State, Optimistic UI).
Die größten Performance-Gewinne kommen durch:
1. ✅ **Cache-System** (NEU - schon implementiert!)
2. 🔥 **Debouncing** (TODO - kritisch!)
3. ⚠️ **Virtual Scrolling** (TODO - bei langen Listen)
