/**
 * 🚀 SCRIPTONY SERVER - DASHBOARD DEPLOY VERSION
 * 
 * Diese Datei enthält den KOMPLETTEN Server in EINER Datei
 * für das Supabase Dashboard (das nur 1 Datei unterstützt).
 * 
 * ANLEITUNG:
 * 1. Cmd+A → Cmd+C (alles kopieren)
 * 2. Supabase Dashboard → Functions → make-server-3b52693b
 * 3. Cmd+V (einfügen)
 * 4. Save & Deploy
 * 
 * WICHTIG: Setze vorher die Environment Variables:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Supabase Client mit Service Role Key
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
// HELPER FUNCTIONS
// =============================================================================

async function getUserIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

async function getOrCreateUserOrganization(userId: string): Promise<string | null> {
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return memberships[0].organization_id;
  }

  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user) return null;

  const orgName = `${user.user?.user_metadata?.name || "User"}'s Workspace`;
  const orgSlug = `user-${userId.substring(0, 8)}`;

  const { data: org } = await supabase
    .from("organizations")
    .insert({ name: orgName, slug: orgSlug, owner_id: userId })
    .select()
    .single();

  if (org) {
    await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: userId,
      role: "owner",
    });
    return org.id;
  }
  return null;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0-dashboard",
  });
});

// =============================================================================
// AUTH ROUTES
// =============================================================================

app.post("/make-server-3b52693b/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: "user" },
      email_confirm: true,
    });

    if (error) return c.json({ error: error.message }, 400);

    await getOrCreateUserOrganization(data.user.id);

    return c.json({
      success: true,
      user: { id: data.user.id, email: data.user.email, name },
    });
  } catch (error: any) {
    return c.json({ error: "Failed to sign up", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/auth/seed-test-user", async (c) => {
  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === "iamthamanic@gmail.com");

    if (userExists) {
      return c.json({ success: true, message: "Test user already exists" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: "iamthamanic@gmail.com",
      password: "123456",
      user_metadata: { name: "Test Admin", role: "superadmin" },
      email_confirm: true,
    });

    if (error) return c.json({ error: error.message }, 400);

    await getOrCreateUserOrganization(data.user.id);

    return c.json({
      success: true,
      message: "Test user created successfully",
      user: { id: data.user.id, email: data.user.email, role: "superadmin" },
    });
  } catch (error: any) {
    return c.json({ error: "Failed to seed test user", details: error.message }, 500);
  }
});

// =============================================================================
// ORGANIZATIONS
// =============================================================================

app.get("/make-server-3b52693b/organizations", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .from("organization_members")
      .select(`role, organizations (*)`)
      .eq("user_id", userId);

    if (error) return c.json({ error: error.message }, 500);

    const organizations = data.map(m => ({
      ...m.organizations,
      userRole: m.role,
    }));

    return c.json({ organizations });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch organizations", details: error.message }, 500);
  }
});

// =============================================================================
// PROJECTS
// =============================================================================

app.get("/make-server-3b52693b/projects", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) return c.json({ error: "No organization found" }, 404);

    const { data: projects, error } = await supabase
      .from("projects")
      .select(`*, world:worlds(id, name)`)
      .eq("organization_id", orgId)
      .eq("is_deleted", false)
      .order("last_edited", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);

    const transformedProjects = projects.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      logline: p.logline,
      genre: p.genre,
      duration: p.duration,
      coverImage: p.cover_image_url,
      linkedWorldId: p.world_id,
      linkedWorld: p.world,
      createdAt: p.created_at,
      lastEdited: p.last_edited,
    }));

    return c.json({ projects: transformedProjects });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch projects", details: error.message }, 500);
  }
});

app.get("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");

    const { data: project, error } = await supabase
      .from("projects")
      .select(`*, world:worlds(id, name)`)
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) return c.json({ error: "Project not found" }, 404);

    const transformed = {
      id: project.id,
      title: project.title,
      type: project.type,
      logline: project.logline,
      genre: project.genre,
      duration: project.duration,
      coverImage: project.cover_image_url,
      linkedWorldId: project.world_id,
      linkedWorld: project.world,
      createdAt: project.created_at,
      lastEdited: project.last_edited,
    };

    return c.json({ project: transformed });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch project", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) return c.json({ error: "No organization found" }, 404);

    const body = await c.req.json();

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        organization_id: orgId,
        title: body.title,
        type: body.type || "film",
        logline: body.logline,
        genre: body.genre,
        duration: body.duration,
        cover_image_url: body.coverImage,
        world_id: body.linkedWorldId,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const transformed = {
      id: project.id,
      title: project.title,
      type: project.type,
      logline: project.logline,
      genre: project.genre,
      duration: project.duration,
      coverImage: project.cover_image_url,
      linkedWorldId: project.world_id,
      createdAt: project.created_at,
      lastEdited: project.last_edited,
    };

    return c.json({ project: transformed }, 201);
  } catch (error: any) {
    return c.json({ error: "Failed to create project", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const body = await c.req.json();

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        title: body.title,
        type: body.type,
        logline: body.logline,
        genre: body.genre,
        duration: body.duration,
        cover_image_url: body.coverImage,
        world_id: body.linkedWorldId,
        last_edited: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const transformed = {
      id: project.id,
      title: project.title,
      type: project.type,
      logline: project.logline,
      genre: project.genre,
      duration: project.duration,
      coverImage: project.cover_image_url,
      linkedWorldId: project.world_id,
      createdAt: project.created_at,
      lastEdited: project.last_edited,
    };

    return c.json({ project: transformed });
  } catch (error: any) {
    return c.json({ error: "Failed to update project", details: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const body = await c.req.json();
    const { password } = body;

    if (!password) {
      return c.json({ error: "Passwort ist erforderlich" }, 400);
    }

    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (!user) return c.json({ error: "User nicht gefunden" }, 404);

    const verifyClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return c.json({ error: "Falsches Passwort" }, 403);
    }

    const { error } = await supabase
      .from("projects")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete project", details: error.message }, 500);
  }
});

// =============================================================================
// STORAGE
// =============================================================================

app.post("/make-server-3b52693b/storage/upload", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) return c.json({ error: "No file provided" }, 400);

    const bucketName = "make-3b52693b-storage";
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760,
      });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${userId}/${crypto.randomUUID()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) return c.json({ error: error.message }, 500);

    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(data.path, 31536000);

    return c.json({
      success: true,
      url: signedUrlData?.signedUrl,
      path: data.path,
    });
  } catch (error: any) {
    return c.json({ error: "Failed to upload file", details: error.message }, 500);
  }
});

// =============================================================================
// NOTE: AI Chat Routes, MCP Tools, RAG Sync sind NICHT in dieser Version!
// 
// Diese Dashboard-Version ist MINIMAL und enthält nur:
// - ✅ Health Check
// - ✅ Auth (Signup, Seed Test User)
// - ✅ Organizations
// - ✅ Projects CRUD
// - ✅ Storage Upload
// 
// Für VOLLSTÄNDIGE Features (AI Chat, MCP Tools, RAG):
// → Nutze die Supabase CLI! Siehe: quick-deploy.sh
// =============================================================================

// Start server
Deno.serve(app.fetch);
