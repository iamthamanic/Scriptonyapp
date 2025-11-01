/**
 * 🚀 DEPLOY INSTRUCTIONS - Timeline V2 Characters Fix
 * 
 * PROBLEM: Characters aus Worldbuilding wurden nicht in der Film Timeline angezeigt
 * LÖSUNG: Die /timeline-characters Route holt jetzt Characters über world_id UND project_id
 * 
 * 📋 WAS WURDE GEÄNDERT:
 * - GET /timeline-characters?project_id=X findet jetzt auch Worldbuilding-Characters
 * - Sucht nach Characters mit matching project_id ODER (world_id + organization_id)
 * - Verbesserte Logging für Debugging
 * 
 * 🔧 DEPLOY SCHRITTE:
 * 
 * 1. Gehe ins Supabase Dashboard: https://supabase.com/dashboard/project/_/functions
 * 
 * 2. Öffne die "scriptony-timeline-v2" Edge Function
 * 
 * 3. SUCHE nach dieser Funktion (ca. Zeile 1429):
 *    app.get("/timeline-characters", async (c) => {
 * 
 * 4. ERSETZE den kompletten Block von Zeile 1438 bis 1467 mit dem Code unten
 * 
 * 5. Klicke auf "Deploy"
 * 
 * 6. Teste: Lade die Film Timeline neu und klicke auf "+" bei einem Shot
 * 
 * ============================================================================
 * NEUER CODE (ab Zeile 1438):
 * ============================================================================
 */

// ERSETZE AB HIER (Zeile 1438):
    const projectId = c.req.query("project_id");

    if (!projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }

    // First, get the project to find its world_id
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("world_id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      return c.json({ error: projectError.message }, 500);
    }

    // Now fetch characters - try both project_id and world_id/organization_id
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .or(
        project?.world_id 
          ? `project_id.eq.${projectId},and(world_id.eq.${project.world_id},organization_id.eq.${project.organization_id})`
          : `project_id.eq.${projectId},organization_id.eq.${project.organization_id}`
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching characters:", error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`[timeline-characters] Found ${data?.length || 0} characters for project ${projectId}`);

    // Transform to camelCase
    const transformedCharacters = (data || []).map(char => ({
      id: char.id,
      projectId: char.project_id || projectId, // Use projectId if not set
      worldId: char.world_id,
      name: char.name,
      description: char.description,
      imageUrl: char.image_url,
      color: char.color,
      createdAt: char.created_at,
      updatedAt: char.updated_at,
    }));

    return c.json({ characters: transformedCharacters });
// BIS HIER ERSETZEN (vor Zeile 1468: } catch (error: any) {)

/**
 * ============================================================================
 * WICHTIG:
 * - Die Zeilen DAVOR (try {, const authHeader = ..., const userId = ...) bleiben unverändert!
 * - Die Zeilen DANACH (} catch (error: any) { ...) bleiben unverändert!
 * - Nur den Inhalt zwischen Zeile 1438 und 1467 ersetzen!
 * ============================================================================
 */
