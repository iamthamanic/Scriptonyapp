/**
 * 🚀 SCRIPTONY SERVER - TIMELINE ONLY (DASHBOARD VERSION)
 * 
 * ✅ NUR Timeline-Funktionalität:
 * - Projects Init (3-Act Structure)
 * - Acts
 * - Sequences  
 * - Scenes
 * - Shots (MIT CAMELCASE FIX!)
 * 
 * ❌ NICHT enthalten:
 * - AI Chat
 * - Worlds
 * - Characters
 * - Episodes
 * 
 * 📋 DEPLOY ANLEITUNG:
 * 1. Cmd+A → Cmd+C (alles kopieren)
 * 2. Supabase Dashboard → Edge Functions → make-server-3b52693b
 * 3. Cmd+V (einfügen) → Save & Deploy
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// SUPABASE CLIENT & APP SETUP
// =============================================================================

const app = new Hono();

const getAdminSupabaseClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const getSupabaseClient = (authHeader?: string) => {
  const token = authHeader?.replace('Bearer ', '');
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    token || Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
};

// Enable logger & CORS
app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getUserIdFromAuth(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = getAdminSupabaseClient();
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('[AUTH] Error getting user:', error);
    return null;
  }
  
  return user.id;
}

// =============================================================================
// ROUTES: HEALTH CHECK
// =============================================================================

app.get("/make-server-3b52693b/health", async (c) => {
  return c.json({ 
    status: "healthy",
    version: "timeline-only-v1",
    timestamp: new Date().toISOString() 
  });
});

// =============================================================================
// ROUTES: PROJECTS (3-Act Initialization)
// =============================================================================

app.post("/make-server-3b52693b/projects/:projectId/init-3act", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const supabase = getAdminSupabaseClient();

    // Check if already initialized
    const { data: existing } = await supabase
      .from("acts")
      .select("id")
      .eq("project_id", projectId)
      .limit(1);

    if (existing && existing.length > 0) {
      return c.json({ 
        message: "Project already has acts",
        alreadyInitialized: true 
      });
    }

    // Create 3 acts
    const actsToCreate = [
      { act_number: 1, title: "Akt I - Setup", description: "Einführung der Charaktere und Welt", color: "#10b981", order_index: 0 },
      { act_number: 2, title: "Akt II - Confrontation", description: "Entwicklung und Konflikte", color: "#3b82f6", order_index: 1 },
      { act_number: 3, title: "Akt III - Resolution", description: "Höhepunkt und Auflösung", color: "#8b5cf6", order_index: 2 },
    ];

    const { data: acts, error } = await supabase
      .from("acts")
      .insert(
        actsToCreate.map(act => ({
          project_id: projectId,
          ...act,
        }))
      )
      .select();

    if (error) {
      console.error("[INIT] Error creating acts:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedActs = (acts || []).map((act: any) => ({
      id: act.id,
      projectId: act.project_id,
      actNumber: act.act_number,
      title: act.title,
      description: act.description,
      color: act.color,
      orderIndex: act.order_index,
      createdAt: act.created_at,
      updatedAt: act.updated_at,
    }));

    console.log("[INIT] Created 3-act structure for project:", projectId);
    return c.json({ 
      acts: transformedActs,
      message: "3-act structure initialized" 
    }, 201);
  } catch (err) {
    console.error("[INIT] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================================================
// ROUTES: ACTS
// =============================================================================

app.get("/make-server-3b52693b/acts", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.query("project_id");
    if (!projectId) {
      return c.json({ error: "project_id required" }, 400);
    }

    const supabase = getSupabaseClient(c.req.header("Authorization"));
    const { data, error } = await supabase
      .from("acts")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching acts:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = (data || []).map((act: any) => ({
      id: act.id,
      projectId: act.project_id,
      actNumber: act.act_number,
      title: act.title,
      description: act.description,
      color: act.color,
      orderIndex: act.order_index,
      createdAt: act.created_at,
      updatedAt: act.updated_at,
    }));

    return c.json({ acts: transformedData });
  } catch (err) {
    console.error("Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-3b52693b/acts", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    // Accept both camelCase and snake_case
    const project_id = body.project_id || body.projectId;
    const act_number = body.act_number ?? body.actNumber;
    const { title, description, color } = body;

    if (!project_id || act_number === undefined) {
      return c.json({ error: "project_id and act_number required" }, 400);
    }

    const supabase = getAdminSupabaseClient();

    // Get current max order_index
    const { data: existing } = await supabase
      .from("acts")
      .select("order_index")
      .eq("project_id", project_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = existing && existing.length > 0
      ? existing[0].order_index + 1
      : 0;

    const { data, error } = await supabase
      .from("acts")
      .insert({
        project_id,
        act_number,
        title: title || `Akt ${act_number}`,
        description,
        color,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating act:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = {
      id: data.id,
      projectId: data.project_id,
      actNumber: data.act_number,
      title: data.title,
      description: data.description,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ act: transformedData }, 201);
  } catch (err) {
    console.error("Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================================================
// ROUTES: SEQUENCES
// =============================================================================

app.get("/make-server-3b52693b/sequences", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const actId = c.req.query("act_id");
    if (!actId) {
      return c.json({ error: "act_id required" }, 400);
    }

    const supabase = getSupabaseClient(c.req.header("Authorization"));
    const { data, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("act_id", actId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[SEQUENCES] Error fetching:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = (data || []).map((seq: any) => ({
      id: seq.id,
      actId: seq.act_id,
      sequenceNumber: seq.sequence_number,
      title: seq.title,
      description: seq.description,
      orderIndex: seq.order_index,
      createdAt: seq.created_at,
      updatedAt: seq.updated_at,
    }));

    return c.json({ sequences: transformedData });
  } catch (err) {
    console.error("[SEQUENCES] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-3b52693b/sequences", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const act_id = body.act_id || body.actId;
    const sequence_number = body.sequence_number ?? body.sequenceNumber;
    const { title, description } = body;

    if (!act_id || sequence_number === undefined) {
      return c.json({ error: "act_id and sequence_number required" }, 400);
    }

    const supabase = getAdminSupabaseClient();

    // Get current max order_index
    const { data: existing } = await supabase
      .from("sequences")
      .select("order_index")
      .eq("act_id", act_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = existing && existing.length > 0
      ? existing[0].order_index + 1
      : 0;

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        act_id,
        sequence_number,
        title: title || `Sequenz ${sequence_number}`,
        description,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("[SEQUENCES] Error creating:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = {
      id: data.id,
      actId: data.act_id,
      sequenceNumber: data.sequence_number,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ sequence: transformedData }, 201);
  } catch (err) {
    console.error("[SEQUENCES] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================================================
// ROUTES: SCENES
// =============================================================================

app.get("/make-server-3b52693b/scenes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const sequenceId = c.req.query("sequence_id");
    if (!sequenceId) {
      return c.json({ error: "sequence_id required" }, 400);
    }

    const supabase = getSupabaseClient(c.req.header("Authorization"));
    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[SCENES] Error fetching:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = (data || []).map((scene: any) => ({
      id: scene.id,
      sequenceId: scene.sequence_id,
      projectId: scene.project_id,
      sceneNumber: scene.scene_number,
      title: scene.title,
      description: scene.description,
      location: scene.location,
      timeOfDay: scene.time_of_day,
      orderIndex: scene.order_index,
      createdAt: scene.created_at,
      updatedAt: scene.updated_at,
    }));

    return c.json({ scenes: transformedData });
  } catch (err) {
    console.error("[SCENES] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-3b52693b/scenes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const sequence_id = body.sequence_id || body.sequenceId;
    const scene_number = body.scene_number ?? body.sceneNumber;
    const { title, description, location, time_of_day, timeOfDay } = body;

    if (!sequence_id || scene_number === undefined) {
      return c.json({ error: "sequence_id and scene_number required" }, 400);
    }

    // Get project_id from sequence
    const supabase = getAdminSupabaseClient();
    const { data: sequence, error: seqError } = await supabase
      .from("sequences")
      .select("act_id")
      .eq("id", sequence_id)
      .single();

    if (seqError || !sequence) {
      console.error("[SCENES] Sequence not found:", seqError);
      return c.json({ error: "Sequence not found" }, 404);
    }

    const { data: act } = await supabase
      .from("acts")
      .select("project_id")
      .eq("id", sequence.act_id)
      .single();

    if (!act?.project_id) {
      return c.json({ error: "Could not find project_id" }, 500);
    }

    // Get current max order_index
    const { data: existing } = await supabase
      .from("scenes")
      .select("order_index")
      .eq("sequence_id", sequence_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = existing && existing.length > 0
      ? existing[0].order_index + 1
      : 0;

    const { data, error } = await supabase
      .from("scenes")
      .insert({
        sequence_id,
        project_id: act.project_id,
        scene_number,
        title: title || `Szene ${scene_number}`,
        description,
        location,
        time_of_day: time_of_day || timeOfDay,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("[SCENES] Error creating:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = {
      id: data.id,
      sequenceId: data.sequence_id,
      projectId: data.project_id,
      sceneNumber: data.scene_number,
      title: data.title,
      description: data.description,
      location: data.location,
      timeOfDay: data.time_of_day,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ scene: transformedData }, 201);
  } catch (err) {
    console.error("[SCENES] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================================================
// ROUTES: SHOTS (MIT CAMELCASE FIX!)
// =============================================================================

app.get("/make-server-3b52693b/shots/:sceneId", async (c) => {
  try {
    const sceneId = c.req.param("sceneId");
    const supabase = getSupabaseClient(c.req.header("Authorization"));

    const { data: shotsData, error } = await supabase
      .from("shots")
      .select("*")
      .eq("scene_id", sceneId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[SHOTS] Error fetching:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedShots = (shotsData || []).map((shot: any) => ({
      id: shot.id,
      sceneId: shot.scene_id,
      projectId: shot.project_id,
      shotNumber: shot.shot_number,
      description: shot.description,
      cameraAngle: shot.camera_angle,
      cameraMovement: shot.camera_movement,
      lens: shot.lens,
      duration: shot.duration,
      composition: shot.composition,
      lightingNotes: shot.lighting_notes,
      soundNotes: shot.sound_notes,
      storyboardUrl: shot.storyboard_url,
      referenceImageUrl: shot.reference_image_url,
      framing: shot.framing,
      dialog: shot.dialog,
      notes: shot.notes,
      shotlengthMinutes: shot.shotlength_minutes,
      shotlengthSeconds: shot.shotlength_seconds,
      imageUrl: shot.image_url,
      orderIndex: shot.order_index,
      createdAt: shot.created_at,
      updatedAt: shot.updated_at,
      characters: [], // Simplified - no character join
      audioFiles: [], // Simplified - no audio join
    }));

    return c.json({ shots: transformedShots });
  } catch (err) {
    console.error("[SHOTS] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-3b52693b/shots", async (c) => {
  try {
    const body = await c.req.json();

    // Accept BOTH camelCase AND snake_case
    const scene_id = body.scene_id || body.sceneId;
    const shot_number = body.shot_number || body.shotNumber;
    const description = body.description;
    const camera_angle = body.camera_angle || body.cameraAngle;
    const camera_movement = body.camera_movement || body.cameraMovement;
    const lens = body.lens;
    const duration = body.duration;
    const composition = body.composition;
    const lighting_notes = body.lighting_notes || body.lightingNotes;
    const sound_notes = body.sound_notes || body.soundNotes;
    const storyboard_url = body.storyboard_url || body.storyboardUrl;
    const reference_image_url = body.reference_image_url || body.referenceImageUrl;
    const framing = body.framing;
    const dialog = body.dialog;
    const notes = body.notes;
    const shotlength_minutes = body.shotlength_minutes ?? body.shotlengthMinutes ?? 0;
    const shotlength_seconds = body.shotlength_seconds ?? body.shotlengthSeconds ?? 0;
    const image_url = body.image_url || body.imageUrl;

    if (!scene_id || !shot_number) {
      return c.json({ error: "scene_id and shot_number are required" }, 400);
    }

    const supabase = getAdminSupabaseClient();

    // Get project_id from scene
    const { data: scene, error: sceneError } = await supabase
      .from("scenes")
      .select("project_id")
      .eq("id", scene_id)
      .single();

    if (sceneError || !scene) {
      console.error("[SHOTS] Scene not found:", sceneError);
      return c.json({ error: "Scene not found" }, 404);
    }

    const project_id = scene.project_id;
    if (!project_id) {
      console.error("[SHOTS] Could not determine project_id");
      return c.json({ error: "Could not determine project_id" }, 500);
    }

    // Get current max order_index
    const { data: existingShots } = await supabase
      .from("shots")
      .select("order_index")
      .eq("scene_id", scene_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = existingShots && existingShots.length > 0
      ? existingShots[0].order_index + 1
      : 0;

    const { data, error } = await supabase
      .from("shots")
      .insert({
        scene_id,
        project_id,
        shot_number,
        description,
        camera_angle,
        camera_movement,
        lens,
        duration,
        composition,
        lighting_notes,
        sound_notes,
        storyboard_url,
        reference_image_url,
        framing,
        dialog,
        notes,
        shotlength_minutes,
        shotlength_seconds,
        image_url,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("[SHOTS] Error creating:", error);
      return c.json({ error: error.message }, 500);
    }

    console.log("[SHOTS] Created shot:", data.id);

    // Transform to camelCase for frontend
    const transformedData = {
      id: data.id,
      sceneId: data.scene_id,
      projectId: data.project_id,
      shotNumber: data.shot_number,
      description: data.description,
      cameraAngle: data.camera_angle,
      cameraMovement: data.camera_movement,
      lens: data.lens,
      duration: data.duration,
      composition: data.composition,
      lightingNotes: data.lighting_notes,
      soundNotes: data.sound_notes,
      storyboardUrl: data.storyboard_url,
      referenceImageUrl: data.reference_image_url,
      framing: data.framing,
      dialog: data.dialog,
      notes: data.notes,
      shotlengthMinutes: data.shotlength_minutes,
      shotlengthSeconds: data.shotlength_seconds,
      imageUrl: data.image_url,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ shot: transformedData }, 201);
  } catch (err) {
    console.error("[SHOTS] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/make-server-3b52693b/shots/:id", async (c) => {
  try {
    const shotId = c.req.param("id");
    const body = await c.req.json();

    // Accept both camelCase and snake_case
    const updateData: any = {};
    if (body.shotNumber !== undefined || body.shot_number !== undefined) {
      updateData.shot_number = body.shotNumber ?? body.shot_number;
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.cameraAngle !== undefined || body.camera_angle !== undefined) {
      updateData.camera_angle = body.cameraAngle ?? body.camera_angle;
    }
    if (body.cameraMovement !== undefined || body.camera_movement !== undefined) {
      updateData.camera_movement = body.cameraMovement ?? body.camera_movement;
    }
    if (body.lens !== undefined) updateData.lens = body.lens;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.composition !== undefined) updateData.composition = body.composition;
    if (body.lightingNotes !== undefined || body.lighting_notes !== undefined) {
      updateData.lighting_notes = body.lightingNotes ?? body.lighting_notes;
    }
    if (body.soundNotes !== undefined || body.sound_notes !== undefined) {
      updateData.sound_notes = body.soundNotes ?? body.sound_notes;
    }
    if (body.storyboardUrl !== undefined || body.storyboard_url !== undefined) {
      updateData.storyboard_url = body.storyboardUrl ?? body.storyboard_url;
    }
    if (body.referenceImageUrl !== undefined || body.reference_image_url !== undefined) {
      updateData.reference_image_url = body.referenceImageUrl ?? body.reference_image_url;
    }
    if (body.framing !== undefined) updateData.framing = body.framing;
    if (body.dialog !== undefined) updateData.dialog = body.dialog;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.shotlengthMinutes !== undefined || body.shotlength_minutes !== undefined) {
      updateData.shotlength_minutes = body.shotlengthMinutes ?? body.shotlength_minutes;
    }
    if (body.shotlengthSeconds !== undefined || body.shotlength_seconds !== undefined) {
      updateData.shotlength_seconds = body.shotlengthSeconds ?? body.shotlength_seconds;
    }
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      updateData.image_url = body.imageUrl ?? body.image_url;
    }

    const supabase = getSupabaseClient(c.req.header("Authorization"));
    const { data, error } = await supabase
      .from("shots")
      .update(updateData)
      .eq("id", shotId)
      .select()
      .single();

    if (error) {
      console.error("[SHOTS] Error updating:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedData = {
      id: data.id,
      sceneId: data.scene_id,
      projectId: data.project_id,
      shotNumber: data.shot_number,
      description: data.description,
      cameraAngle: data.camera_angle,
      cameraMovement: data.camera_movement,
      lens: data.lens,
      duration: data.duration,
      composition: data.composition,
      lightingNotes: data.lighting_notes,
      soundNotes: data.sound_notes,
      storyboardUrl: data.storyboard_url,
      referenceImageUrl: data.reference_image_url,
      framing: data.framing,
      dialog: data.dialog,
      notes: data.notes,
      shotlengthMinutes: data.shotlength_minutes,
      shotlengthSeconds: data.shotlength_seconds,
      imageUrl: data.image_url,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ shot: transformedData });
  } catch (err) {
    console.error("[SHOTS] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/make-server-3b52693b/shots/:id", async (c) => {
  try {
    const shotId = c.req.param("id");
    const supabase = getSupabaseClient(c.req.header("Authorization"));

    const { error } = await supabase
      .from("shots")
      .delete()
      .eq("id", shotId);

    if (error) {
      console.error("[SHOTS] Error deleting:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error("[SHOTS] Unexpected error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("🚀 Scriptony Timeline Server starting...");
Deno.serve(app.fetch);
