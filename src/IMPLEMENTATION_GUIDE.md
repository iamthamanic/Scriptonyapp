# Implementierungs-Guide: Neue Features für Scriptony

## Übersicht der neuen Features

### 1. Character-Badges in Szenen
Wenn Charaktere in Szenen erwähnt werden (@Character), erscheinen sie als Badges mit:
- Dunkel lila Schrift (#6E59A5)
- Hell lila Rahmen (primary/30)
- Charakter-Bild oder @ Icon

### 2. Welt-Verbindung in Projekten
Projekte können mit einer Welt verknüpft werden:
- Select-Dropdown in Projekt-Informationen
- Automatischer Zugriff auf alle Welt-Informationen
- Anzeige der verknüpften Welt im Read-Only Modus

### 3. World-Item Autocomplete mit `/`
In Szenen-Beschreibungen:
- `/` öffnet Autocomplete für Worldbuilding-Items
- Items gruppiert nach Kategorien (Geographie, Politik, etc.)
- Funktioniert nur wenn eine Welt verknüpft ist

## Neue Komponenten

### SceneCharacterBadge.tsx
Zeigt einen Charakter-Badge an mit:
- Primärfarbe für Text und Border
- Optional Charakter-Bild
- Kleines, kompaktes Design

### WorldReferenceAutocomplete.tsx
Autocomplete-Dropdown für World-Items:
- Gruppierung nach Kategorien
- Icons für jede Kategorie
- Suche über Namen und Kategorie

## Änderungen in ProjectsPage.tsx

### Datenstruktur-Erweiterungen

1. **Projects**:
```typescript
{
  id: string;
  title: string;
  // ... existing fields
  linkedWorldId?: string; // NEU
}
```

2. **Scenes**:
```typescript
{
  id: string;
  number: number;
  title: string;
  description: string;
  lastEdited: Date;
  image?: string;
  mentionedCharacters?: string[]; // NEU - IDs der erwähnten Charaktere
  worldReferences?: string[]; // NEU - IDs der erwähnten World-Items
}
```

3. **Mock Worldbuilding Items**:
```typescript
const worldbuildingItems = [
  { id: "1", name: "Mount Silkar", category: "Geographie", categoryType: "geography" },
  { id: "2", name: "Delta River", category: "Geographie", categoryType: "geography" },
  { id: "3", name: "The Council of Seven", category: "Politik", categoryType: "politics" },
  // ...
];
```

### DraggableScene Komponente

**Props erweitern**:
```typescript
interface DraggableSceneProps {
  // ... existing props
  worldItems: Array<{
    id: string;
    name: string;
    category: string;
    categoryType: string;
  }>;
  linkedWorldId?: string;
}
```

**State erweitern**:
```typescript
const [autocompleteType, setAutocompleteType] = useState<'character' | 'world'>('character');
```

**handleDescriptionChange erweitern**:
- Prüft sowohl `@` als auch `/`
- Setzt `autocompleteType` entsprechend
- Öffnet Autocomplete für den jeweils aktuellen Typ

**insertWorldTag Funktion hinzufügen**:
```typescript
const insertWorldTag = (itemName: string) => {
  const textBeforeCursor = editedDescription.substring(0, cursorPosition);
  const textAfterCursor = editedDescription.substring(cursorPosition);
  const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
  
  const tag = '/' + itemName;
  
  const newDescription = 
    editedDescription.substring(0, lastSlashIndex) + 
    tag + ' ' + 
    textAfterCursor;
  
  setEditedDescription(newDescription);
  setShowAutocomplete(false);
  
  setTimeout(() => {
    if (textareaRef.current) {
      const newCursorPos = lastSlashIndex + tag.length + 1;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  }, 0);
};
```

**Textarea Placeholder aktualisieren**:
```tsx
placeholder={linkedWorldId ? 
  "Szenen-Beschreibung (nutze @ für Charaktere, / für World-Items)" : 
  "Szenen-Beschreibung (nutze @ um Charaktere zu taggen)"
}
```

**Autocomplete Rendering**:
```tsx
{showAutocomplete && autocompleteType === 'character' && filteredCharacters.length > 0 && (
  // ... existing character autocomplete
)}
{showAutocomplete && autocompleteType === 'world' && linkedWorldId && (
  <WorldReferenceAutocomplete
    items={worldItems}
    search={autocompleteSearch}
    position={autocompletePosition}
    onSelect={insertWorldTag}
  />
)}
```

**Character Badges anzeigen**:
```tsx
{/* Nach der Szenen-Beschreibung */}
{!isEditing && taggedCharacters.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-3">
    {taggedCharacters.map(character => (
      <SceneCharacterBadge key={character.id} character={character} />
    ))}
  </div>
)}
```

### ProjectDetail Komponente

**Projekt-Informationen erweitern** (im Edit-Modus):
```tsx
<div>
  <Label htmlFor="project-world" className="text-sm mb-2 block">Verknüpfte Welt</Label>
  <div className="flex gap-2">
    <Select value={project.linkedWorldId || "none"}>
      <SelectTrigger id="project-world" className="h-9 flex-1">
        <SelectValue placeholder="Keine Welt verknüpft" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Keine Welt verknüpft</SelectItem>
        <SelectItem value="1">Kontinent Silkat</SelectItem>
      </SelectContent>
    </Select>
    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
      <Plus className="size-4" />
    </Button>
  </div>
  <p className="text-xs text-muted-foreground mt-1.5">
    {project.linkedWorldId ? 
      "Projekt greift auf alle Welt-Informationen zu" : 
      "Verknüpfe eine Welt für Worldbuilding-Referenzen"
    }
  </p>
</div>
```

**Projekt-Informationen anzeigen** (im Read-Only Modus):
```tsx
{project.linkedWorldId && (
  <div>
    <p className="text-xs text-muted-foreground mb-1">Verknüpfte Welt</p>
    <div className="flex items-center gap-2">
      <Globe className="size-4 text-primary" />
      <p className="text-sm">Kontinent Silkat</p>
    </div>
  </div>
)}
```

### Szenen-Liste Rendering

**DraggableScene aufrufen mit neuen Props**:
```tsx
{scenesState.map((scene, index) => (
  <DraggableScene
    key={scene.id}
    scene={scene}
    index={index}
    moveScene={moveScene}
    onImageUpload={updateSceneImage}
    onUpdateDetails={updateSceneDetails}
    characters={charactersState}
    worldItems={project.linkedWorldId ? worldbuildingItems : []}
    linkedWorldId={project.linkedWorldId}
  />
))}
```

## Verwendung

### Character-Tagging
1. In einer Szene-Beschreibung `@` tippen
2. Beginne den Charakternamen einzugeben
3. Wähle aus dem Autocomplete
4. Charaktere erscheinen als Badges unter der Beschreibung

### World-Item Tagging
1. Projekt muss mit einer Welt verknüpft sein
2. In einer Szene-Beschreibung `/` tippen
3. Suche nach Kategorie oder Item-Name
4. Items sind nach Kategorien gruppiert
5. Wähle aus dem Autocomplete

### Welt verknüpfen
1. Gehe zu Projekt-Informationen
2. Klicke "Bearbeiten"
3. Wähle eine Welt aus dem Dropdown
4. Projekt hat nun Zugriff auf alle Welt-Informationen
5. `/` Autocomplete ist in Szenen aktiviert

## Design-Spezifikationen

### Character Badge
- Background: `bg-primary/5`
- Text: `text-primary`
- Border: `border-primary/30`
- Hover: `hover:bg-primary/10`
- Icon: `AtSign` (size-3.5)
- Text: `text-xs`

### World-Item Autocomplete
- Gruppiert nach Kategorien
- Icons pro Kategorie-Typ:
  - Geographie: `Mountain`
  - Politik: `Landmark`
  - Gesellschaft: `Users`
  - Kultur: `Palette`
  - Default: `Globe`
- Max 3 Items pro Kategorie im Dropdown
- Breite: 280-350px
- Max Höhe: 300px mit Scroll

## Implementierungs-Status

1. ✅ SceneCharacterBadge Komponente erstellt
2. ✅ WorldReferenceAutocomplete Komponente erstellt
3. ✅ Imports in ProjectsPage.tsx hinzugefügt (Globe, SceneCharacterBadge, WorldReferenceAutocomplete)
4. ✅ autocompleteType State hinzugefügt
5. ✅ handleDescriptionChange erweitert (unterstützt jetzt `/` für World-Items)
6. ✅ insertWorldTag Funktion hinzugefügt
7. ✅ Autocomplete Rendering aktualisiert (bedingte Anzeige basierend auf Typ)
8. ✅ Character Badges werden angezeigt (unter Beschreibung im Read-Only Modus)
9. ✅ Projekt-Informationen erweitert (Welt-Auswahl im Edit-Modus, Anzeige im Read-Only)
10. ✅ DraggableScene Props aktualisiert (worldItems und linkedWorldId werden übergeben)
11. ✅ Dynamischer Textarea-Placeholder basierend auf linkedWorldId

## Fertig! 🎉

Alle drei Features sind vollständig implementiert und einsatzbereit:
- **Character-Badges in Szenen**: Werden als lila Badges unter der Beschreibung angezeigt
- **Welt-Verbindung in Projekten**: Wählbar in den Projekt-Informationen
- **World-Item Autocomplete**: Aktiviert mit `/` wenn eine Welt verknüpft ist