/**
 * 🎬 COPY & PASTE SNIPPET für ProjectsPage.tsx
 * 
 * Schritt 1: Füge den Import oben hinzu
 * Schritt 2: Füge die Section in die Project-Detail-View ein
 */

// ════════════════════════════════════════════════════════════════
// SCHRITT 1: Import (ganz oben bei den anderen Imports)
// ════════════════════════════════════════════════════════════════

import { StructureBeatsSection } from '../StructureBeatsSection';


// ════════════════════════════════════════════════════════════════
// SCHRITT 2: Section einfügen (in der Project-Detail-View)
// ════════════════════════════════════════════════════════════════

// Suche nach: {project && (
// Füge DORT diese Section ein (z.B. nach Projekt-Info, vor Charaktere):

{/* ⭐ Structure & Beats Section ⭐ */}
<section className="space-y-3">
  <StructureBeatsSection 
    projectId={project.id}
    className=""
  />
</section>


// ════════════════════════════════════════════════════════════════
// VOLLSTÄNDIGES BEISPIEL (Kontext)
// ════════════════════════════════════════════════════════════════

{project && (
  <div className="p-6 space-y-6">
    
    {/* Projekt-Info (bestehend) */}
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">{project.title}</h2>
      {/* ... Logline, Duration, Genres ... */}
    </section>

    {/* ⭐ NEU: Structure & Beats ⭐ */}
    <section className="space-y-3">
      <StructureBeatsSection 
        projectId={project.id}
        className=""
      />
    </section>

    {/* Charaktere (bestehend) */}
    <Collapsible>
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <h2>Charaktere ({charactersState.length})</h2>
          </Button>
        </CollapsibleTrigger>
        <Button size="sm" onClick={() => setShowNewCharacter(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Neu
        </Button>
      </div>
      <CollapsibleContent>
        {/* ... Charaktere-Liste ... */}
      </CollapsibleContent>
    </Collapsible>

    {/* Inspiration (bestehend) */}
    <Collapsible>
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            <h2>Inspiration ({inspirations.length})</h2>
          </Button>
        </CollapsibleTrigger>
        <Button size="sm" onClick={() => setShowAddInspirationDialog(true)}>
          <Plus className="size-3.5 mr-1.5" />
          Neu
        </Button>
      </div>
      <CollapsibleContent>
        {/* ... Inspiration-Grid ... */}
      </CollapsibleContent>
    </Collapsible>

  </div>
)}


// ════════════════════════════════════════════════════════════════
// ERGEBNIS
// ════════════════════════════════════════════════════════════════

// Du solltest jetzt sehen:
// 
// ┌────────────────────────────────────────────────┐
// │ Structure & Beats         [∧]    [+ Act hinzu] │
// ├────┬───────────────────────────────────────────┤
// │    │ > Akt I - Einführung                      │
// │ 0% │   > Sequence 1 - Status Quo               │
// │    │     > Scene 1 - Opening                   │
// │    │       - Shot 1 - Establishing             │
// │STC │       - Shot 2 - Close-up                 │
// │25% │   > Sequence 2 - Inciting Incident        │
// │    │ > Akt II - Konfrontation                  │
// │    │   > Sequence 3 - Rising Action            │
// │STC │                                            │
// │50% │                                            │
// │    │                                            │
// │75% │                                            │
// │    │                                            │
// │100%│                                            │
// └────┴───────────────────────────────────────────┘
//
// Lila Beat-Rail (80px breit) mit dynamischen Beat-Bands! 🎉
