/**
 * Characters Routes für PostgreSQL
 */

import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createCharactersRoutes(
  supabase: SupabaseClient,
  getUserId: (authHeader: string | null) => Promise<string | null>
) {
  const app = new Hono();

  // Get all characters for a project
  app.get("/projects/:projectId/characters", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projectId = c.req.param("projectId");

      const { data: characters, error } = await supabase
        .from("characters")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = characters.map((char) => ({
        id: char.id,
        projectId: char.project_id,
        name: char.name,
        role: char.role,
        description: char.description,
        avatar: char.avatar_url,
        createdAt: char.created_at,
      }));

      return c.json({ characters: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch characters", details: error.message },
        500
      );
    }
  });

  // Get single character
  app.get("/projects/:projectId/characters/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { data: character, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return c.json({ error: "Character not found" }, 404);
      }

      const transformed = {
        id: character.id,
        projectId: character.project_id,
        name: character.name,
        role: character.role,
        description: character.description,
        avatar: character.avatar_url,
        createdAt: character.created_at,
      };

      return c.json({ character: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch character", details: error.message },
        500
      );
    }
  });

  // Create character
  app.post("/projects/:projectId/characters", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projectId = c.req.param("projectId");
      const body = await c.req.json();

      const { data: character, error } = await supabase
        .from("characters")
        .insert({
          project_id: projectId,
          name: body.name,
          role: body.role,
          description: body.description,
          avatar_url: body.avatar,
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: character.id,
        projectId: character.project_id,
        name: character.name,
        role: character.role,
        description: character.description,
        avatar: character.avatar_url,
        createdAt: character.created_at,
      };

      return c.json({ character: transformed }, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create character", details: error.message },
        500
      );
    }
  });

  // Update character
  app.put("/projects/:projectId/characters/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data: character, error } = await supabase
        .from("characters")
        .update({
          name: body.name,
          role: body.role,
          description: body.description,
          avatar_url: body.avatar,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: character.id,
        projectId: character.project_id,
        name: character.name,
        role: character.role,
        description: character.description,
        avatar: character.avatar_url,
        createdAt: character.created_at,
      };

      return c.json({ character: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to update character", details: error.message },
        500
      );
    }
  });

  // Delete character
  app.delete("/projects/:projectId/characters/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { error } = await supabase.from("characters").delete().eq("id", id);

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      return c.json(
        { error: "Failed to delete character", details: error.message },
        500
      );
    }
  });

  return app;
}
