/**
 * 🎬 SCRIPTONY TIMELINE - Edge Function
 * 
 * Handles all Timeline-related operations:
 * - Acts
 * - Sequences
 * - Scenes
 * - Shots
 * 
 * This is a separate Edge Function to allow independent deployment
 * and scaling of Timeline features.
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
    function: "scriptony-timeline",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// ACTS ROUTES
// =============================================================================

// Get acts for a project
app.get("/acts", async (c) => {
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
      .from("acts")
      .select("*")
      .eq("project_id", projectId)
      .order("act_number", { ascending: true });

    if (error) {
      console.error("Error fetching acts:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedActs = (data || []).map(act => ({
      id: act.id,
      projectId: act.project_id,
      actNumber: act.act_number,
      title: act.title,
      description: act.description,
      orderIndex: act.order_index,
      createdAt: act.created_at,
      updatedAt: act.updated_at,
    }));

    return c.json({ acts: transformedActs });
  } catch (error: any) {
    console.error("Acts GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create act
app.post("/acts", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const project_id = body.project_id || body.projectId;
    const act_number = body.act_number || body.actNumber;

    if (!project_id || !act_number) {
      return c.json({ error: "project_id and act_number are required" }, 400);
    }

    // Get highest order_index
    const { data: existingActs } = await supabase
      .from("acts")
      .select("order_index")
      .eq("project_id", project_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingActs?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from("acts")
      .insert({
        project_id,
        act_number,
        title: body.title || `Akt ${act_number}`,
        description: body.description,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating act:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedAct = {
      id: data.id,
      projectId: data.project_id,
      actNumber: data.act_number,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ act: transformedAct }, 201);
  } catch (error: any) {
    console.error("Acts POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update act
app.put("/acts/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const actId = c.req.param("id");
    const updates = await c.req.json();

    const dbUpdates: any = {};
    if (updates.actNumber !== undefined) dbUpdates.act_number = updates.actNumber;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from("acts")
      .update(dbUpdates)
      .eq("id", actId)
      .select()
      .single();

    if (error) {
      console.error("Error updating act:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedAct = {
      id: data.id,
      projectId: data.project_id,
      actNumber: data.act_number,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ act: transformedAct });
  } catch (error: any) {
    console.error("Acts PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete act
app.delete("/acts/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const actId = c.req.param("id");

    const { error } = await supabase
      .from("acts")
      .delete()
      .eq("id", actId);

    if (error) {
      console.error("Error deleting act:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Acts DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// IMPORT OTHER ROUTES
// =============================================================================

// TODO: Import sequences, scenes, shots routes
// For now, this is a minimal implementation showing the pattern

console.log("🎬 Scriptony Timeline Function starting...");
Deno.serve(app.fetch);
