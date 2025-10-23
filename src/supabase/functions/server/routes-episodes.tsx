/**
 * Episodes Routes für PostgreSQL
 */

import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createEpisodesRoutes(
  supabase: SupabaseClient,
  getUserId: (authHeader: string | null) => Promise<string | null>
) {
  const app = new Hono();

  // Get all episodes for a project
  app.get("/projects/:projectId/episodes", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projectId = c.req.param("projectId");

      const { data: episodes, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("project_id", projectId)
        .order("number", { ascending: true });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = episodes.map((ep) => ({
        id: ep.id,
        projectId: ep.project_id,
        title: ep.title,
        number: ep.number,
        description: ep.description,
        coverImage: ep.cover_image_url,
        createdAt: ep.created_at,
      }));

      return c.json({ episodes: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch episodes", details: error.message },
        500
      );
    }
  });

  // Get single episode
  app.get("/projects/:projectId/episodes/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { data: episode, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return c.json({ error: "Episode not found" }, 404);
      }

      const transformed = {
        id: episode.id,
        projectId: episode.project_id,
        title: episode.title,
        number: episode.number,
        description: episode.description,
        coverImage: episode.cover_image_url,
        createdAt: episode.created_at,
      };

      return c.json({ episode: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch episode", details: error.message },
        500
      );
    }
  });

  // Create episode
  app.post("/projects/:projectId/episodes", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projectId = c.req.param("projectId");
      const body = await c.req.json();

      const { data: episode, error } = await supabase
        .from("episodes")
        .insert({
          project_id: projectId,
          title: body.title,
          number: body.number,
          description: body.description,
          cover_image_url: body.coverImage,
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: episode.id,
        projectId: episode.project_id,
        title: episode.title,
        number: episode.number,
        description: episode.description,
        coverImage: episode.cover_image_url,
        createdAt: episode.created_at,
      };

      return c.json({ episode: transformed }, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create episode", details: error.message },
        500
      );
    }
  });

  // Update episode
  app.put("/projects/:projectId/episodes/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data: episode, error } = await supabase
        .from("episodes")
        .update({
          title: body.title,
          number: body.number,
          description: body.description,
          cover_image_url: body.coverImage,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: episode.id,
        projectId: episode.project_id,
        title: episode.title,
        number: episode.number,
        description: episode.description,
        coverImage: episode.cover_image_url,
        createdAt: episode.created_at,
      };

      return c.json({ episode: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to update episode", details: error.message },
        500
      );
    }
  });

  // Delete episode
  app.delete("/projects/:projectId/episodes/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { error } = await supabase.from("episodes").delete().eq("id", id);

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      return c.json(
        { error: "Failed to delete episode", details: error.message },
        500
      );
    }
  });

  return app;
}
