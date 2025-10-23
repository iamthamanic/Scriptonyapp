/**
 * Worlds Routes für PostgreSQL
 * Includes: Worlds, World Categories, World Items
 */

import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createWorldsRoutes(
  supabase: SupabaseClient,
  getUserId: (authHeader: string | null) => Promise<string | null>,
  getOrCreateUserOrganization: (userId: string) => Promise<string | null>
) {
  const app = new Hono();

  // =====================================================
  // WORLDS
  // =====================================================

  // Get all worlds
  app.get("/worlds", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const orgId = await getOrCreateUserOrganization(userId);
      if (!orgId) {
        return c.json({ error: "No organization found" }, 404);
      }

      const { data: worlds, error } = await supabase
        .from("worlds")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_deleted", false)
        .order("last_accessed_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = worlds.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        type: w.type,
        coverImage: w.cover_image_url,
        createdAt: w.created_at,
        lastEdited: w.updated_at,
        lastAccessed: w.last_accessed_at,
      }));

      return c.json({ worlds: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch worlds", details: error.message },
        500
      );
    }
  });

  // Get single world
  app.get("/worlds/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { data: world, error } = await supabase
        .from("worlds")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false)
        .single();

      if (error) {
        return c.json({ error: "World not found" }, 404);
      }

      // Update last_accessed_at
      await supabase
        .from("worlds")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", id);

      const transformed = {
        id: world.id,
        name: world.name,
        description: world.description,
        type: world.type,
        coverImage: world.cover_image_url,
        createdAt: world.created_at,
        lastEdited: world.updated_at,
      };

      return c.json({ world: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch world", details: error.message },
        500
      );
    }
  });

  // Create world
  app.post("/worlds", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const orgId = await getOrCreateUserOrganization(userId);
      if (!orgId) {
        return c.json({ error: "No organization found" }, 404);
      }

      const body = await c.req.json();

      const { data: world, error } = await supabase
        .from("worlds")
        .insert({
          organization_id: orgId,
          name: body.name,
          description: body.description,
          type: body.type,
          cover_image_url: body.coverImage,
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: world.id,
        name: world.name,
        description: world.description,
        type: world.type,
        coverImage: world.cover_image_url,
        createdAt: world.created_at,
        lastEdited: world.updated_at,
      };

      return c.json({ world: transformed }, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create world", details: error.message },
        500
      );
    }
  });

  // Update world
  app.put("/worlds/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data: world, error } = await supabase
        .from("worlds")
        .update({
          name: body.name,
          description: body.description,
          type: body.type,
          cover_image_url: body.coverImage,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: world.id,
        name: world.name,
        description: world.description,
        type: world.type,
        coverImage: world.cover_image_url,
        createdAt: world.created_at,
        lastEdited: world.updated_at,
      };

      return c.json({ world: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to update world", details: error.message },
        500
      );
    }
  });

  // Delete world (Soft Delete mit Passwort-Verification)
  app.delete("/worlds/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();
      const { password } = body;

      if (!password) {
        return c.json({ error: "Passwort ist erforderlich" }, 400);
      }

      // Hole User-Daten mit Service Role
      const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

      if (getUserError || !user) {
        return c.json({ error: "User nicht gefunden" }, 404);
      }

      // Verifiziere Passwort mit separatem Supabase Client (ohne RLS)
      const { createClient } = await import("npm:@supabase/supabase-js@2");
      const verifyClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );

      const { error: signInError } = await verifyClient.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        console.log("Password verification failed:", signInError.message);
        return c.json({ error: "Falsches Passwort" }, 403);
      }

      // Passwort korrekt - lösche Welt (Soft Delete) mit Service Role
      const { error } = await supabase
        .from("worlds")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("World delete error:", error);
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      console.error("Delete world exception:", error);
      return c.json(
        { error: "Failed to delete world", details: error.message },
        500
      );
    }
  });

  // =====================================================
  // WORLD CATEGORIES
  // =====================================================

  // Get all categories for a world
  app.get("/worlds/:worldId/categories", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const worldId = c.req.param("worldId");

      const { data: categories, error } = await supabase
        .from("world_categories")
        .select("*")
        .eq("world_id", worldId)
        .order("order_index", { ascending: true });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = categories.map((cat) => ({
        id: cat.id,
        worldId: cat.world_id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        orderIndex: cat.order_index,
        createdAt: cat.created_at,
      }));

      return c.json({ categories: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch categories", details: error.message },
        500
      );
    }
  });

  // Create category
  app.post("/worlds/:worldId/categories", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const worldId = c.req.param("worldId");
      const body = await c.req.json();

      const { data: category, error } = await supabase
        .from("world_categories")
        .insert({
          world_id: worldId,
          name: body.name,
          type: body.type,
          icon: body.icon,
          color: body.color,
          order_index: body.orderIndex || 0,
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: category.id,
        worldId: category.world_id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        orderIndex: category.order_index,
        createdAt: category.created_at,
      };

      return c.json({ category: transformed }, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create category", details: error.message },
        500
      );
    }
  });

  // Update category
  app.put("/worlds/:worldId/categories/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data: category, error } = await supabase
        .from("world_categories")
        .update({
          name: body.name,
          type: body.type,
          icon: body.icon,
          color: body.color,
          order_index: body.orderIndex,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: category.id,
        worldId: category.world_id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        orderIndex: category.order_index,
        createdAt: category.created_at,
      };

      return c.json({ category: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to update category", details: error.message },
        500
      );
    }
  });

  // Delete category
  app.delete("/worlds/:worldId/categories/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { error } = await supabase
        .from("world_categories")
        .delete()
        .eq("id", id);

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      return c.json(
        { error: "Failed to delete category", details: error.message },
        500
      );
    }
  });

  // =====================================================
  // WORLD ITEMS
  // =====================================================

  // Get all items for a world
  app.get("/worlds/:worldId/items", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const worldId = c.req.param("worldId");

      const { data: items, error } = await supabase
        .from("world_items")
        .select(`
          *,
          category:world_categories(id, name, type)
        `)
        .eq("world_id", worldId)
        .order("created_at", { ascending: false });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = items.map((item) => ({
        id: item.id,
        worldId: item.world_id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        category: item.category_type,
        categoryType: item.category_type,
        image: item.image_url,
        createdAt: item.created_at,
      }));

      return c.json({ items: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch items", details: error.message },
        500
      );
    }
  });

  // Get items for a specific category
  app.get("/worlds/:worldId/categories/:categoryId/items", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const categoryId = c.req.param("categoryId");

      const { data: items, error } = await supabase
        .from("world_items")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false });

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      // Transform für Frontend
      const transformed = items.map((item) => ({
        id: item.id,
        worldId: item.world_id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        category: item.category_type,
        categoryType: item.category_type,
        image: item.image_url,
        createdAt: item.created_at,
      }));

      return c.json({ items: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to fetch items", details: error.message },
        500
      );
    }
  });

  // Create item
  app.post("/worlds/:worldId/categories/:categoryId/items", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const worldId = c.req.param("worldId");
      const categoryId = c.req.param("categoryId");
      const body = await c.req.json();

      const { data: item, error } = await supabase
        .from("world_items")
        .insert({
          world_id: worldId,
          category_id: categoryId,
          name: body.name,
          description: body.description,
          category: body.category,
          category_type: body.categoryType,
          image_url: body.image,
        })
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: item.id,
        worldId: item.world_id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        category: item.category_type,
        categoryType: item.category_type,
        image: item.image_url,
        createdAt: item.created_at,
      };

      return c.json({ item: transformed }, 201);
    } catch (error: any) {
      return c.json(
        { error: "Failed to create item", details: error.message },
        500
      );
    }
  });

  // Update item
  app.put("/worlds/:worldId/categories/:categoryId/items/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");
      const body = await c.req.json();

      const { data: item, error } = await supabase
        .from("world_items")
        .update({
          name: body.name,
          description: body.description,
          category: body.category,
          category_type: body.categoryType,
          image_url: body.image,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      const transformed = {
        id: item.id,
        worldId: item.world_id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        category: item.category_type,
        categoryType: item.category_type,
        image: item.image_url,
        createdAt: item.created_at,
      };

      return c.json({ item: transformed });
    } catch (error: any) {
      return c.json(
        { error: "Failed to update item", details: error.message },
        500
      );
    }
  });

  // Delete item
  app.delete("/worlds/:worldId/categories/:categoryId/items/:id", async (c) => {
    try {
      const authHeader = c.req.header("Authorization");
      const userId = await getUserId(authHeader);

      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.param("id");

      const { error } = await supabase.from("world_items").delete().eq("id", id);

      if (error) {
        return c.json({ error: error.message }, 500);
      }

      return c.json({ success: true });
    } catch (error: any) {
      return c.json(
        { error: "Failed to delete item", details: error.message },
        500
      );
    }
  });

  return app;
}
