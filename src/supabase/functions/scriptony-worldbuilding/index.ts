/**
 * 🌍 SCRIPTONY WORLDBUILDING - Edge Function
 * 
 * Handles all Worldbuilding operations:
 * - Worlds CRUD
 * - Characters CRUD
 * - Locations CRUD
 * - Relationships & References
 * 
 * UNABHÄNGIG DEPLOYBAR - Worldbuilding-Änderungen beeinflussen Timeline/Assistant nicht!
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// SETUP
// =============================================================================

const app = new Hono();

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

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    function: "scriptony-worldbuilding",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// WORLDS ROUTES
// =============================================================================

/**
 * GET /worlds
 * Get all worlds for a project
 */
app.get("/worlds", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.query("project_id");

    if (!projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }

    const { data, error } = await supabase
      .from("worlds")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching worlds:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ worlds: data || [] });
  } catch (error: any) {
    console.error("Worlds GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /worlds/:id
 * Get single world by ID
 */
app.get("/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const worldId = c.req.param("id");

    const { data, error } = await supabase
      .from("worlds")
      .select("*")
      .eq("id", worldId)
      .single();

    if (error) {
      console.error("Error fetching world:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ world: data });
  } catch (error: any) {
    console.error("World GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /worlds
 * Create new world
 */
app.post("/worlds", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { project_id, name, description, lore, image_url } = body;

    if (!project_id || !name) {
      return c.json({ error: "project_id and name are required" }, 400);
    }

    const { data, error } = await supabase
      .from("worlds")
      .insert({
        project_id,
        name,
        description,
        lore,
        image_url,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating world:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ world: data }, 201);
  } catch (error: any) {
    console.error("Worlds POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /worlds/:id
 * Update world
 */
app.put("/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const worldId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("worlds")
      .update(updates)
      .eq("id", worldId)
      .select()
      .single();

    if (error) {
      console.error("Error updating world:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ world: data });
  } catch (error: any) {
    console.error("Worlds PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /worlds/:id
 * Delete world
 */
app.delete("/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const worldId = c.req.param("id");

    const { error } = await supabase
      .from("worlds")
      .delete()
      .eq("id", worldId);

    if (error) {
      console.error("Error deleting world:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Worlds DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// CHARACTERS ROUTES
// =============================================================================

/**
 * GET /characters
 * Get all characters for a project
 */
app.get("/characters", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.query("project_id");
    const worldId = c.req.query("world_id");

    if (!projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }

    let query = supabase
      .from("characters")
      .select("*")
      .eq("project_id", projectId);

    if (worldId) {
      query = query.eq("world_id", worldId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching characters:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ characters: data || [] });
  } catch (error: any) {
    console.error("Characters GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /characters/:id
 * Get single character by ID
 */
app.get("/characters/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const characterId = c.req.param("id");

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (error) {
      console.error("Error fetching character:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ character: data });
  } catch (error: any) {
    console.error("Character GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /characters
 * Create new character
 */
app.post("/characters", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { 
      project_id, 
      world_id, 
      name, 
      description, 
      backstory, 
      personality,
      image_url,
      color 
    } = body;

    if (!project_id || !name) {
      return c.json({ error: "project_id and name are required" }, 400);
    }

    const { data, error } = await supabase
      .from("characters")
      .insert({
        project_id,
        world_id,
        name,
        description,
        backstory,
        personality,
        image_url,
        color,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating character:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ character: data }, 201);
  } catch (error: any) {
    console.error("Characters POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /characters/:id
 * Update character
 */
app.put("/characters/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const characterId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("characters")
      .update(updates)
      .eq("id", characterId)
      .select()
      .single();

    if (error) {
      console.error("Error updating character:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ character: data });
  } catch (error: any) {
    console.error("Characters PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /characters/:id
 * Delete character
 */
app.delete("/characters/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const characterId = c.req.param("id");

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterId);

    if (error) {
      console.error("Error deleting character:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Characters DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// LOCATIONS ROUTES (Future)
// =============================================================================

/**
 * GET /locations
 * Get all locations for a project
 */
app.get("/locations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // TODO: Implement locations table
    return c.json({ 
      locations: [],
      message: "Locations feature coming soon"
    });
  } catch (error: any) {
    console.error("Locations GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("🌍 Scriptony Worldbuilding Function starting...");
Deno.serve(app.fetch);
