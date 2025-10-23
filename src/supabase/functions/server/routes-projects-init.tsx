import { Hono } from 'npm:hono';

export function createProjectsInitRoutes(
  supabase: any,
  getUserIdFromAuth: (authHeader: string | null) => Promise<string | null>
) {
  const projectsInit = new Hono();

// =====================================================
// POST /projects/:projectId/init-three-act - Initialize 3-act structure
// =====================================================
// Creates:
// - 3 Acts (Setup, Confrontation, Resolution)
// - Each Act gets 1 Sequence
// - Each Sequence gets 1 Scene
// - Each Scene gets 1 Shot
// =====================================================

  projectsInit.post('/:projectId/init-three-act', async (c) => {
    try {
      const projectId = c.req.param('projectId');
      const authHeader = c.req.header('Authorization');
      
      // Verify user has access
      const userId = await getUserIdFromAuth(authHeader);
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log('[PROJECT-INIT] Starting 3-act initialization for project:', projectId);

    // Define 3-act structure
    const actDefinitions = [
      { number: 1, title: 'Act 1 - Setup', description: 'Introduction to the world and characters', color: '#00CCC0' },
      { number: 2, title: 'Act 2 - Confrontation', description: 'Rising action and challenges', color: '#98E5B4' },
      { number: 3, title: 'Act 3 - Resolution', description: 'Climax and conclusion', color: '#FF8FB1' },
    ];

    const createdStructure = [];

    // Create each act with its nested structure
    for (let i = 0; i < actDefinitions.length; i++) {
      const actDef = actDefinitions[i];

      // 1. Create Act
      const { data: act, error: actError } = await supabase
        .from('acts')
        .insert({
          project_id: projectId,
          act_number: actDef.number,
          title: actDef.title,
          description: actDef.description,
          color: actDef.color,
          order_index: i,
        })
        .select()
        .single();

      if (actError) {
        console.error('[PROJECT-INIT] Error creating act:', actError);
        return c.json({ error: `Failed to create act ${actDef.number}: ${actError.message}` }, 500);
      }

      console.log('[PROJECT-INIT] Created act:', act.id);

      // 2. Create Sequence for this Act
      const { data: sequence, error: seqError } = await supabase
        .from('sequences')
        .insert({
          act_id: act.id,
          sequence_number: 1,
          title: `Sequence ${actDef.number}.1`,
          description: `First sequence of ${actDef.title}`,
          color: actDef.color,
          order_index: 0,
        })
        .select()
        .single();

      if (seqError) {
        console.error('[PROJECT-INIT] Error creating sequence:', seqError);
        return c.json({ error: `Failed to create sequence for act ${actDef.number}: ${seqError.message}` }, 500);
      }

      console.log('[PROJECT-INIT] Created sequence:', sequence.id);

      // 3. Create Scene for this Sequence
      const { data: scene, error: sceneError } = await supabase
        .from('scenes')
        .insert({
          project_id: projectId,
          sequence_id: sequence.id,
          act_id: act.id,
          scene_number: `${actDef.number}.1.1`,
          title: `Scene ${actDef.number}.1.1`,
          description: `First scene of sequence ${actDef.number}.1`,
          order_index: 0,
        })
        .select()
        .single();

      if (sceneError) {
        console.error('[PROJECT-INIT] Error creating scene:', sceneError);
        return c.json({ error: `Failed to create scene for sequence ${actDef.number}.1: ${sceneError.message}` }, 500);
      }

      console.log('[PROJECT-INIT] Created scene:', scene.id);

      // 4. Create Shot for this Scene
      const { data: shot, error: shotError } = await supabase
        .from('shots')
        .insert({
          scene_id: scene.id,
          shot_number: `${actDef.number}.1.1.1`,
          description: `First shot of scene ${actDef.number}.1.1`,
          camera_angle: 'Eye Level',
          camera_movement: 'Static',
          framing: 'MS',
          lens: '50mm',
          shotlength_minutes: 0,
          shotlength_seconds: 5,
          order_index: 0,
        })
        .select()
        .single();

      if (shotError) {
        console.error('[PROJECT-INIT] Error creating shot:', shotError);
        return c.json({ error: `Failed to create shot for scene ${actDef.number}.1.1: ${shotError.message}` }, 500);
      }

      console.log('[PROJECT-INIT] Created shot:', shot.id);

      // Add to result
      createdStructure.push({
        act,
        sequence,
        scene,
        shot,
      });
    }

    console.log('[PROJECT-INIT] ✅ Successfully initialized 3-act structure for project:', projectId);

    // Transform acts to camelCase for frontend
    const acts = createdStructure.map(item => ({
      id: item.act.id,
      projectId: item.act.project_id,
      actNumber: item.act.act_number,
      title: item.act.title,
      description: item.act.description,
      color: item.act.color,
      orderIndex: item.act.order_index,
      createdAt: item.act.created_at,
      updatedAt: item.act.updated_at,
    }));

    return c.json({
      success: true,
      message: '3-act structure initialized successfully',
      acts,
      structure: createdStructure,
    });
  } catch (err) {
    console.error('[PROJECT-INIT] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

  return projectsInit;
}
