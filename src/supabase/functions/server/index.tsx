/**
 * Scriptony Server - FIXED für Organization-based Multi-Tenancy
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// AI Chat Routes - MINIMAL VERSION (for testing)
// Full version in routes-ai-chat.tsx has import issues
import aiChatRoutes from "./routes-ai-minimal.tsx";

// Timeline Routes (Acts, Sequences, Scenes, Shots)
import shotsRoutes from "./routes-shots.tsx";
import { createProjectsInitRoutes } from "./routes-projects-init.tsx";
import { createActsRoutes } from "./routes-acts.tsx";
import { createSequencesRoutes } from "./routes-sequences.tsx";
import { createScenesRoutes } from "./routes-scenes.tsx";
import { createDebugRoutes } from "./routes-debug.tsx";

const app = new Hono();

// Supabase Client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Logger
app.use('*', logger(console.log));

// CORS
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey'],
}));

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Factory function to get Supabase Client (for timeline routes)
function getSupabaseClient() {
  return supabase;
}

// Get User ID from Auth Token
async function getUserIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user.id;
}

// Get User's Organizations
async function getUserOrganizations(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);
  
  if (error || !data) {
    console.error("Error fetching user organizations:", error);
    return [];
  }

  return data.map(m => m.organization_id);
}

// Get or Create Default Organization for User
async function getOrCreateUserOrganization(userId: string): Promise<string | null> {
  // Check if user already has an organization
  const { data: existingMemberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (existingMemberships && existingMemberships.length > 0) {
    return existingMemberships[0].organization_id;
  }

  // Create new organization for user
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  
  const orgName = user?.user_metadata?.name || user?.email?.split('@')[0] || "My Organization";
  const orgSlug = `org-${userId.substring(0, 8)}`;

  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug: orgSlug,
      owner_id: userId,
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    console.error("Error creating organization:", orgError);
    return null;
  }

  // Add user as member
  await supabase
    .from("organization_members")
    .insert({
      organization_id: newOrg.id,
      user_id: userId,
      role: "owner",
    });

  return newOrg.id;
}

// =====================================================
// HEALTH CHECK
// =====================================================
app.get("/make-server-3b52693b/health", async (c) => {
  try {
    const { data, error } = await supabase.from("projects").select("id").limit(1);
    
    // Check if timeline tables exist
    const tables: Record<string, boolean> = {};
    for (const table of ['acts', 'sequences', 'scenes', 'shots']) {
      const { error: tableError } = await supabase.from(table).select('id').limit(1);
      tables[table] = !tableError;
    }
    
    return c.json({
      status: "ok",
      database: error ? "error" : "connected",
      tables,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({
      status: "error",
      database: "disconnected",
      error: error.message,
    }, 500);
  }
});

// =====================================================
// PROJECTS ROUTES
// =====================================================
app.get("/make-server-3b52693b/projects", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Get user's organizations
    const orgIds = await getUserOrganizations(userId);
    
    if (orgIds.length === 0) {
      // User has no organizations - return empty array
      return c.json([]);
    }

    // Get projects from all user's organizations
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .in("organization_id", orgIds)
      .eq("is_deleted", false)
      .order("last_edited", { ascending: false });

    if (error) throw error;
    return c.json(data || []);
  } catch (error: any) {
    console.error("Projects error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Get or create user's organization
    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "Could not create organization" }, 500);
    }

    const body = await c.req.json();
    
    // Extract only valid project fields (ignore extra fields like inspirations)
    const {
      title,
      type,
      logline,
      genre,
      duration,
      cover_image_url,
      coverImage, // Frontend uses camelCase
      linkedWorldId, // Frontend uses camelCase
      world_id,
    } = body;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        organization_id: orgId,
        title,
        type: type || 'film',
        logline,
        genre,
        duration,
        cover_image_url: cover_image_url || coverImage,
        world_id: world_id || linkedWorldId,
      })
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error("Create project error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("id");
    const body = await c.req.json();

    // Verify user has access to this project
    const orgIds = await getUserOrganizations(userId);
    
    const { data, error } = await supabase
      .from("projects")
      .update(body)
      .eq("id", projectId)
      .in("organization_id", orgIds)
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error("Update project error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("id");

    // Verify user has access to this project
    const orgIds = await getUserOrganizations(userId);
    
    const { data, error } = await supabase
      .from("projects")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", projectId)
      .in("organization_id", orgIds)
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error("Delete project error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// WORLDS ROUTES
// =====================================================
app.get("/make-server-3b52693b/worlds", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.query("project_id");
    
    // Get user's organizations
    const orgIds = await getUserOrganizations(userId);
    
    if (orgIds.length === 0) {
      return c.json([]);
    }

    let query = supabase
      .from("worlds")
      .select("*")
      .in("organization_id", orgIds)
      .eq("is_deleted", false)
      .order("last_accessed_at", { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) throw error;
    return c.json(data || []);
  } catch (error: any) {
    console.error("Worlds error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/worlds", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    // Get or create user's organization
    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "Could not create organization" }, 500);
    }

    const body = await c.req.json();
    
    const { data, error } = await supabase
      .from("worlds")
      .insert({
        organization_id: orgId,
        ...body,
      })
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (error: any) {
    console.error("Create world error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// TIMELINE - Get Full Hierarchy for Project
// =====================================================
app.get("/make-server-3b52693b/projects/:projectId/acts", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    // Fetch all acts for project
    const { data: acts, error: actsError } = await supabase
      .from("acts")
      .select("*")
      .eq("project_id", projectId)
      .order("act_number", { ascending: true });

    if (actsError) throw actsError;

    // For each act, fetch sequences
    const actsWithSequences = await Promise.all(
      (acts || []).map(async (act) => {
        const { data: sequences } = await supabase
          .from("sequences")
          .select("*")
          .eq("act_id", act.id)
          .order("sequence_number", { ascending: true });

        // For each sequence, fetch scenes
        const sequencesWithScenes = await Promise.all(
          (sequences || []).map(async (sequence) => {
            const { data: scenes } = await supabase
              .from("scenes")
              .select("*")
              .eq("sequence_id", sequence.id)
              .order("scene_number", { ascending: true });

            // For each scene, fetch shots
            const scenesWithShots = await Promise.all(
              (scenes || []).map(async (scene) => {
                const { data: shots } = await supabase
                  .from("shots")
                  .select("*")
                  .eq("scene_id", scene.id)
                  .order("shot_number", { ascending: true });

                return {
                  id: scene.id,
                  scene_number: scene.scene_number,
                  name: scene.title || "",
                  description: scene.description,
                  location: scene.location,
                  sequence_id: sequence.id,
                  project_id: projectId,
                  shots: (shots || []).map((shot) => ({
                    id: shot.id,
                    shot_number: shot.shot_number,
                    name: shot.title || "",
                    description: shot.description,
                    camera_movement: shot.camera_movement,
                    duration: shot.duration,
                    scene_id: scene.id,
                    project_id: projectId,
                  })),
                };
              })
            );

            return {
              id: sequence.id,
              sequence_number: sequence.sequence_number,
              name: sequence.title || "",
              description: sequence.description,
              act_id: act.id,
              project_id: projectId,
              scenes: scenesWithShots,
            };
          })
        );

        return {
          id: act.id,
          act_number: act.act_number,
          name: act.title || "",
          description: act.description,
          project_id: projectId,
          sequences: sequencesWithScenes,
        };
      })
    );

    return c.json({ acts: actsWithSequences });
  } catch (error: any) {
    console.error("Timeline hierarchy error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =====================================================
// TIMELINE ROUTES (from separate route files with proper camelCase/snake_case conversion)
// =====================================================
app.route("/make-server-3b52693b/acts", createActsRoutes(getSupabaseClient, getUserIdFromAuth));
app.route("/make-server-3b52693b/sequences", createSequencesRoutes(getSupabaseClient, getUserIdFromAuth));
app.route("/make-server-3b52693b/scenes", createScenesRoutes(getSupabaseClient, getUserIdFromAuth));
app.route("/make-server-3b52693b/shots", shotsRoutes);
app.route("/make-server-3b52693b/projects", createProjectsInitRoutes(supabase, getUserIdFromAuth));
app.route("/make-server-3b52693b/debug", createDebugRoutes());

// =====================================================
// AI CHAT ROUTES - MINIMAL VERSION
// =====================================================
app.route("/make-server-3b52693b", aiChatRoutes);

// =====================================================
// STORAGE ROUTES
// =====================================================
app.get("/make-server-3b52693b/storage/usage", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const bucketName = "make-3b52693b-storage";

    // List all files for user
    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list(`uploads/${userId}`, {
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.warn("[STORAGE] No files found or bucket doesn't exist, returning empty usage");
      return c.json({ 
        totalSize: 0,
        fileCount: 0,
        files: [],
      });
    }

    const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

    return c.json({
      totalSize,
      fileCount: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        createdAt: f.created_at,
      })),
    });
  } catch (error: any) {
    console.error("[STORAGE] Error getting storage usage:", error);
    // Return empty usage instead of error to prevent UI breaking
    return c.json({ 
      totalSize: 0,
      fileCount: 0,
      files: [],
    });
  }
});

// =====================================================
// START SERVER
// =====================================================

console.log("🎉 Scriptony Server (Organization-based) is ready!");
console.log("📍 Base Path: /make-server-3b52693b");
console.log("✅ Routes: /projects, /worlds, /acts, /sequences, /shots");
console.log("🎬 Enhanced: Shot uploads, characters, audio files");
console.log("🎭 3-Act Init: POST /projects/:projectId/init-three-act");
console.log("🤖 AI Chat: MINIMAL (settings, conversations) - Chat disabled");
console.log("💾 Storage: Usage tracking enabled");
console.log("🏢 Multi-Tenancy: Organization-based with auto-creation");

Deno.serve(app.fetch);
