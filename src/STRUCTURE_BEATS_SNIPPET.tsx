/**
 * 🎬 INTEGRATION SNIPPET für ProjectsPage.tsx
 * 
 * Füge diesen Code in die Project-Detail-View ein.
 * Suche nach der Stelle, wo die Collapsible-Sections gerendert werden.
 */

// 1. IMPORT oben in der Datei hinzufügen:
import { StructureBeatsSection } from '../StructureBeatsSection';

// 2. In der Project-Detail-View (wo project angezeigt wird):
// Füge die Section NACH der Projekt-Info ein, z.B.:

{/* Beispiel-Position in der Detail-View */}
{project && (
  <div className="space-y-6">
    {/* ... Andere Sections wie Projekt-Info, Cover, etc. ... */}
    
    {/* ⭐ NEUE SECTION: Structure & Beats */}
    <section className="space-y-3">
      <StructureBeatsSection 
        projectId={project.id}
        className=""
      />
    </section>

    {/* ... Andere Sections wie Szenen, Charaktere, Inspiration ... */}
  </div>
)}

/**
 * 📌 Alternative Positionen:
 * 
 * Option A: Direkt nach Projekt-Info (empfohlen)
 * Option B: Vor der Szenen-Section
 * Option C: Als eigener Tab (wenn Tabs verwendet werden)
 * 
 * Suche nach Elementen wie:
 * - <section className="...">
 * - <Collapsible ...>
 * - Szenen/Charaktere Sections
 * 
 * Und füge die StructureBeatsSection dort ein.
 */
