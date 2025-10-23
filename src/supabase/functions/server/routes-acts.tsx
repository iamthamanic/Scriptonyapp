/**
 * 🎬 ACTS ROUTES
 * API endpoints für Acts (Film-Akte)
 */

import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createActsRoutes(
  getSupabaseClient: () => SupabaseClient,
  getUserIdFromAuth: (authHeader: string | undefined) => Promise<string | null>
) {
  const app = new Hono();

  // =====================================================
  // GET /?project_id=xxx
  // =====================================================
  app.get("/", async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header("Authorization"));
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const projectId = c.req.query("project_id");
      if (!projectId) {
        return c.json({ error: "project_id required" }, 400);
      }

      const supabase = getSupabaseClient();
      const { data, error} = await supabase
        .from("acts")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching acts:", error);
        return c.json({ error: error.message }, 500);
      }

      // Transform snake_case to camelCase for frontend
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

      return c.json(transformedData);
    } catch (error: any) {
      console.error("Acts GET error:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // =====================================================
  // POST /
  // =====================================================
  app.post("/", async (c) => {
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

      const supabase = getSupabaseClient();
      
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
          title,
          description,
          color: color || '#6E59A5', // Default Scriptony violet
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating act:", error);
        return c.json({ error: error.message }, 500);
      }

      // Transform snake_case to camelCase for frontend
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

      return c.json(transformedData);
    } catch (error: any) {
      console.error("Acts POST error:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // =====================================================
  // PUT /:id
  // =====================================================
  app.put("/:id", async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header("Authorization"));
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const actId = c.req.param("id");
      const updates = await c.req.json();

      // Transform camelCase to snake_case for DB
      const dbUpdates: any = {};
      if (updates.actNumber !== undefined) dbUpdates.act_number = updates.actNumber;
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

      const supabase = getSupabaseClient();
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

      // Transform snake_case to camelCase for frontend
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

      return c.json(transformedData);
    } catch (error: any) {
      console.error("Acts PUT error:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // =====================================================
  // DELETE /:id
  // =====================================================
  app.delete("/:id", async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header("Authorization"));
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const actId = c.req.param("id");

      const supabase = getSupabaseClient();
      // Delete act (scenes will have act_id set to NULL due to ON DELETE SET NULL)
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

  // =====================================================
  // POST /acts/reorder
  // Reorder acts in a project
  // =====================================================
  app.post("/reorder", async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header("Authorization"));
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const { project_id, act_ids } = await c.req.json();

      if (!project_id || !act_ids || !Array.isArray(act_ids)) {
        return c.json({ error: "project_id and act_ids[] required" }, 400);
      }

      const supabase = getSupabaseClient();
      // Call DB function
      const { error } = await supabase.rpc("reorder_acts", {
        p_project_id: project_id,
        p_act_ids: act_ids,
      });

      if (error) {
        console.error("Error reordering acts:", error);
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error("Acts reorder error:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // =====================================================
  // POST /scenes/reorder
  // Reorder scenes within an act (or move to different act)
  // =====================================================
  app.post("/scenes/reorder", async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header("Authorization"));
      if (!userId) return c.json({ error: "Unauthorized" }, 401);

      const { act_id, scene_ids } = await c.req.json();

      if (!act_id || !scene_ids || !Array.isArray(scene_ids)) {
        return c.json({ error: "act_id and scene_ids[] required" }, 400);
      }

      const supabase = getSupabaseClient();
      // Call DB function
      const { error } = await supabase.rpc("reorder_scenes_in_act", {
        p_act_id: act_id,
        p_scene_ids: scene_ids,
      });

      if (error) {
        console.error("Error reordering scenes:", error);
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error("Scenes reorder error:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  return app;
}
