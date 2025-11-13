/**
 * 🎬 READY-TO-PASTE: Structure & Beats Integration für ProjectsPage
 * 
 * WICHTIG: Der Import ist bereits hinzugefügt!
 * Du musst nur noch die Section in die Project-Detail-View einfügen.
 */

// ═══════════════════════════════════════════════════════════════
// ✅ IMPORT BEREITS HINZUGEFÜGT (Zeile 26):
// ═══════════════════════════════════════════════════════════════

// import { StructureBeatsSection } from "../StructureBeatsSection";


// ═══════════════════════════════════════════════════════════════
// 📍 WO EINFÜGEN?
// ═══════════════════════════════════════════════════════════════

// Suche in ProjectsPage.tsx nach einer Stelle die so aussieht:

// {selectedProject && (
//   <div className="...">
//     {/* Projekt-Header */}
//     {/* Projekt-Info */}
//     
//     {/* ⭐ HIER EINFÜGEN ⭐ */}
//     
//     {/* Charaktere */}
//     {/* Inspiration */}
//   </div>
// )}


// ═══════════════════════════════════════════════════════════════
// 📋 CODE ZUM EINFÜGEN:
// ═══════════════════════════════════════════════════════════════

{/* Structure & Beats Section */}
<section className="mb-6">
  <StructureBeatsSection
    projectId={selectedProject.id}
    className=""
  />
</section>


// ═══════════════════════════════════════════════════════════════
// 📝 VOLLSTÄNDIGES BEISPIEL (MIT KONTEXT):
// ═══════════════════════════════════════════════════════════════

{selectedProject && (
  <div className="p-6 space-y-6">
    
    {/* ============================================ */}
    {/* PROJEKT-HEADER (bestehend) */}
    {/* ============================================ */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setSelectedProject(null)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">{selectedProject.title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowStatsDialog(true)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Stats & Logs
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* ... Menu Items ... */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* ============================================ */}
    {/* PROJEKT-INFO (bestehend) */}
    {/* ============================================ */}
    <div className="space-y-4">
      {/* Cover, Logline, Duration, Genres, etc. */}
      {/* ... */}
    </div>

    {/* ============================================ */}
    {/* ⭐⭐⭐ NEU: STRUCTURE & BEATS ⭐⭐⭐ */}
    {/* ============================================ */}
    <section className="mb-6">
      <StructureBeatsSection
        projectId={selectedProject.id}
        className=""
      />
    </section>

    {/* ============================================ */}
    {/* CHARAKTERE (bestehend) */}
    {/* ============================================ */}
    <Collapsible defaultOpen={true}>
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Charaktere ({charactersState.length})
              <ChevronDown className="h-4 w-4" />
            </h2>
          </Button>
        </CollapsibleTrigger>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => setShowNewCharacter(true)}
        >
          <Plus className="size-3.5 mr-1.5" />
          Neu
        </Button>
      </div>
      <CollapsibleContent>
        {/* ... Charaktere-Grid ... */}
      </CollapsibleContent>
    </Collapsible>

    {/* ============================================ */}
    {/* INSPIRATION (bestehend) */}
    {/* ============================================ */}
    <Collapsible defaultOpen={true}>
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Inspiration ({inspirations.length})
              <ChevronDown className="h-4 w-4" />
            </h2>
          </Button>
        </CollapsibleTrigger>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => setShowAddInspirationDialog(true)}
        >
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


// ═══════════════════════════════════════════════════════════════
// 🎯 WAS DU JETZT SIEHST:
// ═══════════════════════════════════════════════════════════════

/*
┌──────────────────────────────────────────────────────────┐
│  Projekt: Dein Film Titel           [Stats] [⋮]         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Cover, Logline, Duration, Genres...                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Structure & Beats    [∧]  [Dropdown][Timeline]  [+Act] │
├────┬─────────────────────────────────────────────────────┤
│    │                                                      │
│ 0% │  [🎬] > Akt I - Einführung              [⋮]        │
│    │                                                      │
│[STC│  [🎬] > Akt II - Konfrontation          [⋮]        │
│25%]│                                                      │
│    │  [🎬] > Akt III - Auflösung             [⋮]        │
│    │                                                      │
│[STC│                                                      │
│50%]│                                                      │
│    │                                                      │
│75% │                                                      │
│    │                                                      │
│100%│                                                      │
└────┴─────────────────────────────────────────────────────┘
│                                                          │
│  Charaktere (5)                                [+ Neu]  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │
│  │ 👤 │ │ 👤 │ │ 👤 │ │ 👤 │ │ 👤 │                   │
│  └────┘ └────┘ └────┘ └────┘ └────┘                   │
│                                                          │
│  Inspiration (8)                              [+ Neu]  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                          │
│  │ 🖼️ │ │ 🖼️ │ │ 🖼️ │ │ 🖼️ │                          │
│  └────┘ └────┘ └────┘ └────┘                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Die lila Beat-Rail (80px) erscheint links,
die Acts/Sequences/Scenes/Shots rechts!
*/


// ═══════════════════════════════════════════════════════════════
// ✅ FERTIG!
// ═══════════════════════════════════════════════════════════════

// Nach dem Einfügen sollte die Beat-Rail sofort funktionieren:
// - Lila Rail links (80px)
// - Beat-Bands (klickbar, editierbar)
// - Acts/Sequences/Scenes/Shots rechts
// - Dropdown/Timeline Toggle
// - "+ Act hinzufügen" Button
