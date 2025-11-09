/**
 * 🎯 SCRIPTONY PROJECTS - Edge Function
 * 
 * 🕐 LAST UPDATED: 2025-11-08 (Added episode_layout & season_engine for Series)
 * 📝 UPDATED VERSION - Added episode/season structure for TV series
 * 
 * Handles all Project-related operations:
 * - Project CRUD (all types: Film, Series, Book, Theater, Game, ...)
 * - Project initialization with templates
 * - Project statistics
 * - Narrative Structure & Beat Template support
 * - Episode Layout & Season Engine (Series only)
 * 
 * UNABHÄNGIG DEPLOYBAR - Änderungen hier beeinflussen Timeline/Assistant/etc. nicht!
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// SETUP
// =============================================================================

// IMPORTANT: Supabase adds function name as prefix to all paths!
const app = new Hono().basePath("/scriptony-projects");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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
// AUTH HELPER
// =============================================================================

async function getUserIdFromAuth(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user.id;
}

async function getUserOrganization(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.organization_id;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    function: "scriptony-projects",
    version: "1.1.0",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// PROJECTS ROUTES
// =============================================================================

/**
 * GET /projects
 * Get all projects for user's organization
 */
app.get("/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orgId = await getUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "User has no organization" }, 403);
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ projects: data || [] });
  } catch (error: any) {
    console.error("Projects GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /projects/:id
 * Get single project by ID
 */
app.get("/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ project: data });
  } catch (error: any) {
    console.error("Project GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /projects
 * Create new project
 */
app.post("/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orgId = await getUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "User has no organization" }, 403);
    }

    const body = await c.req.json();
    const { 
      title, 
      description, 
      type, 
      logline, 
      genre, 
      duration, 
      world_id, 
      cover_image_url, 
      narrative_structure, 
      beat_template,
      episode_layout,
      season_engine,
    } = body;

    if (!title) {
      return c.json({ error: "title is required" }, 400);
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        title,
        logline: logline || description,
        genre,
        type: type || 'film',
        duration: duration || null,
        world_id: world_id || null,
        cover_image_url: cover_image_url || null,
        narrative_structure: narrative_structure || null,
        beat_template: beat_template || null,
        episode_layout: episode_layout || null,
        season_engine: season_engine || null,
        organization_id: orgId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ project: data }, 201);
  } catch (error: any) {
    console.error("Projects POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /projects/:id
 * Update project
 */
app.put("/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ project: data });
  } catch (error: any) {
    console.error("Projects PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /projects/:id
 * Delete project (cascades to timeline nodes, worlds, characters, etc.)
 */
app.delete("/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Projects DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /projects/:id/init
 * Initialize project structure based on template
 * Creates default timeline hierarchy
 */
app.post("/projects/:id/init", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");
    const body = await c.req.json();
    const { template_id, structure, predefined_nodes } = body;

    // This would typically call scriptony-timeline's /initialize-project endpoint
    // For now, we just return success and let the timeline function handle it
    
    return c.json({ 
      success: true,
      message: "Project initialization delegated to scriptony-timeline",
      project_id: projectId,
      template_id,
    }, 201);
  } catch (error: any) {
    console.error("Project init error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /projects/:id/stats
 * Get project statistics
 */
app.get("/projects/:id/stats", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");

    // Get counts from timeline_nodes if it exists, otherwise from old tables
    const { data: nodes, error: nodesError } = await supabase
      .from("timeline_nodes")
      .select("level")
      .eq("project_id", projectId);

    let stats;
    
    if (!nodesError && nodes) {
      // New timeline_nodes table
      stats = {
        level_1: nodes.filter(n => n.level === 1).length,
        level_2: nodes.filter(n => n.level === 2).length,
        level_3: nodes.filter(n => n.level === 3).length,
        level_4: nodes.filter(n => n.level === 4).length,
      };
    } else {
      // Fallback to old tables
      const [
        { count: acts },
        { count: sequences },
        { count: scenes },
        { count: shots },
      ] = await Promise.all([
        supabase.from("acts").select("*", { count: "exact", head: true }).eq("project_id", projectId),
        supabase.from("sequences").select("*", { count: "exact", head: true }).eq("project_id", projectId),
        supabase.from("scenes").select("*", { count: "exact", head: true }).eq("project_id", projectId),
        supabase.from("shots").select("*", { count: "exact", head: true }).eq("project_id", projectId),
      ]);

      stats = {
        acts: acts || 0,
        sequences: sequences || 0,
        scenes: scenes || 0,
        shots: shots || 0,
      };
    }

    // Get worlds count
    const { count: worlds } = await supabase
      .from("worlds")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    // Get characters count
    const { count: characters } = await supabase
      .from("characters")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    return c.json({ 
      stats: {
        ...stats,
        worlds: worlds || 0,
        characters: characters || 0,
      }
    });
  } catch (error: any) {
    console.error("Project stats error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("🎯 Scriptony Projects Function starting...");
Deno.serve(app.fetch);
