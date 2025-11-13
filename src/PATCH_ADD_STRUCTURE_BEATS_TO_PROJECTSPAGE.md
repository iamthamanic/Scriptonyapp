# 🎬 PATCH: Structure & Beats zu ProjectsPage hinzufügen

## Problem
Die **Structure & Beats** Section wurde erstellt, aber noch NICHT in die ProjectsPage integriert!
Deshalb siehst du im Screenshot die Acts, aber **keine lila Beat-Rail links**!

---

## Lösung: 3-Schritt-Integration

### SCHRITT 1: Import hinzufügen

Füge ganz oben in `/components/pages/ProjectsPage.tsx` (bei den anderen Imports) hinzu:

```typescript
import { StructureBeatsSection } from '../StructureBeatsSection';
```

---

### SCHRITT 2: Section einfügen

Suche in der ProjectsPage nach der Stelle, wo die **Project-Detail-View** gerendert wird.

**Merkmale zum Finden:**
- Dort wo `{project && (...)}`  steht
- Dort wo **"Charaktere"**, **"Inspiration"** als Sections angezeigt werden
- Unterhalb der **Projekt-Info** (Logline, Duration, Genres, etc.)

**Füge DORT diese Section ein:**

```typescript
{/* Structure & Beats Section */}
<section className="space-y-3">
  <StructureBeatsSection 
    projectId={project.id}
    className=""
  />
</section>
```

---

### SCHRITT 3: Platzierung

**Empfohlene Position:**

```typescript
{project && (
  <div className="p-6 space-y-6">
    {/* Projekt-Info Section */}
    <section>
      {/* ... Logline, Duration, Genres, Cover ... */}
    </section>

    {/* ⭐ NEU: Structure & Beats Section ⭐ */}
    <section className="space-y-3">
      <StructureBeatsSection 
        projectId={project.id}
        className=""
      />
    </section>

    {/* Szenen Section (falls vorhanden) */}
    <section>
      {/* ... Szenen-Liste ... */}
    </section>

    {/* Charaktere Section */}
    <Collapsible>
      <CollapsibleTrigger>
        <h2>Charaktere ({charactersState.length})</h2>
      </CollapsibleTrigger>
      {/* ... */}
    </Collapsible>

    {/* Inspiration Section */}
    <Collapsible>
      <CollapsibleTrigger>
        <h2>Inspiration ({inspirations.length})</h2>
      </CollapsibleTrigger>
      {/* ... */}
    </Collapsible>
  </div>
)}
```

---

## Was dann passiert:

✅ Die **lila Beat-Rail** (80px breit) erscheint links  
✅ Die **Acts/Sequences/Scenes/Shots** werden rechts als Dropdown angezeigt  
✅ **Beats** werden als lila Bänder in der Rail angezeigt  
✅ **Klick auf Beat** → expandiert → Edit-Form erscheint direkt im Beat  
✅ **Container collapse/expand** → Beats passen sich dynamisch an  

---

## Visuelle Kontrolle:

Nach der Integration solltest du sehen:

```
┌────────────────────────────────────────────┐
│  Structure & Beats              [∧]  [+ Act]│
├───────┬────────────────────────────────────┤
│ Beat  │ > Akt I - Einleitung              │
│ Rail  │ > Akt I - Einführung               │
│ 0%    │ > Akt III - Auflösung              │
│       │                                     │
│ [STC] │  (Acts als Collapsible Cards)      │
│ 25%   │                                     │
│       │                                     │
│ [STC] │                                     │
│ 50%   │                                     │
│       │                                     │
│ 75%   │                                     │
│       │                                     │
│ 100%  │                                     │
└───────┴────────────────────────────────────┘
```

---

## Troubleshooting:

### Problem: "StructureBeatsSection is not defined"
→ Import fehlt! Siehe Schritt 1

### Problem: "project is not defined"
→ Section ist außerhalb des `{project && (...)}` Blocks!

### Problem: Beat-Rail ist leer
→ Normal! Mock-Daten sind vorhanden (MOCK_BEATS in StructureBeatsSection.tsx)

### Problem: Keine Acts sichtbar
→ Mock-Daten sind vorhanden (MOCK_CONTAINERS in StructureBeatsSection.tsx)

---

## Nächste Schritte (nach Integration):

1. **Teste die Beat-Rail:**
   - Klick auf lila Beat-Band → sollte expandieren
   - Container-Dropdown ändern → Beat sollte sich neu positionieren

2. **API Integration (später):**
   - Mock-Daten durch echte Timeline-Nodes ersetzen
   - Beats aus Datenbank laden
   - CRUD-Operations implementieren

---

## 🚀 Los geht's!

Öffne `/components/pages/ProjectsPage.tsx` und führe die 3 Schritte aus! 💜
