/**
 * Scriptony Server mit PostgreSQL Support
 * Ersetzt KV-Store durch echte PostgreSQL-Tabellen
 * Multi-Tenancy mit Organizations und RLS
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { migrateKVToPostgres } from "./migrate-to-postgres.tsx";

const app = new Hono();

// Supabase Client mit Service Role Key (für Server-seitige Operationen)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Extrahiert User-ID aus Authorization Header
 */
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

/**
 * Holt die Default-Organization eines Users
 * Falls keine existiert, wird eine erstellt
 */
async function getOrCreateUserOrganization(userId: string): Promise<string | null> {
  // Hole Organizations des Users
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return memberships[0].organization_id;
  }

  // Erstelle Default-Organization
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user) return null;

  const orgName = `${user.user?.user_metadata?.name || "User"}'s Workspace`;
  const orgSlug = `user-${userId.substring(0, 8)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug: orgSlug,
      owner_id: userId,
    })
    .select()
    .single();

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return null;
  }

  // Füge User als Owner hinzu
  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  return org.id;
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/make-server-3b52693b/health", async (c) => {
  try {
    // Test DB connection
    const { error } = await supabase.from("organizations").select("count").limit(1);
    
    return c.json({ 
      status: error ? "degraded" : "ok",
      database: error ? "error" : "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return c.json({ 
      status: "error", 
      database: "disconnected",
      error: error.message 
    }, 503);
  }
});

// =====================================================
// MIGRATION ENDPOINT (Einmalig ausführen)
// =====================================================

app.post("/make-server-3b52693b/migrate", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    console.log(`Starting migration for user ${userId}...`);
    const result = await migrateKVToPostgres(userId);

    return c.json(result);
  } catch (error: any) {
    console.error("Migration error:", error);
    return c.json({ 
      success: false,
      error: "Migration failed", 
      details: error.message 
    }, 500);
  }
});

// =====================================================
// AUTH ROUTES
// =====================================================

// Sign up
app.post("/make-server-3b52693b/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role: "user",
      },
      email_confirm: true,
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Erstelle Default-Organization für neuen User
    await getOrCreateUserOrganization(data.user.id);

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
      }
    });
  } catch (error: any) {
    return c.json({ error: "Failed to sign up", details: error.message }, 500);
  }
});

// Seed test user
app.post("/make-server-3b52693b/auth/seed-test-user", async (c) => {
  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === "iamthamanic@gmail.com");

    if (userExists) {
      return c.json({ 
        success: true,
        message: "Test user already exists",
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: "iamthamanic@gmail.com",
      password: "123456",
      user_metadata: { 
        name: "Test Admin",
        role: "superadmin",
      },
      email_confirm: true,
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Erstelle Default-Organization
    await getOrCreateUserOrganization(data.user.id);

    return c.json({ 
      success: true,
      message: "Test user created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: "superadmin",
      }
    });
  } catch (error: any) {
    return c.json({ error: "Failed to seed test user", details: error.message }, 500);
  }
});

// =====================================================
// ORGANIZATIONS
// =====================================================

// Get user's organizations
app.get("/make-server-3b52693b/organizations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        role,
        organizations (*)
      `)
      .eq("user_id", userId);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const organizations = data.map(m => ({
      ...m.organizations,
      userRole: m.role,
    }));

    return c.json({ organizations });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch organizations", details: error.message }, 500);
  }
});

// =====================================================
// PROJECTS
// =====================================================

// Get all projects (für User's Organization)
app.get("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "No organization found" }, 404);
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        *,
        world:worlds(id, name)
      `)
      .eq("organization_id", orgId)
      .eq("is_deleted", false)
      .order("last_edited", { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // Transformiere für Frontend-Kompatibilität
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

// Get single project
app.get("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");

    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        world:worlds(id, name)
      `)
      .eq("id", id)
      .eq("is_deleted", false)
      .single();

    if (error) {
      return c.json({ error: "Project not found" }, 404);
    }

    // Transformiere für Frontend
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

// Create project
app.post("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) {
      return c.json({ error: "No organization found" }, 404);
    }

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

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // Transformiere für Frontend
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

// Update project
app.put("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

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

    if (error) {
      return c.json({ error: error.message }, 500);
    }

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

// Delete project (Soft Delete)
app.delete("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");

    const { error } = await supabase
      .from("projects")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete project", details: error.message }, 500);
  }
});

// =====================================================
// IMPORT ROUTE MODULES
// =====================================================

import { createScenesRoutes } from "./routes-scenes.tsx";
import { createCharactersRoutes } from "./routes-characters.tsx";
import { createEpisodesRoutes } from "./routes-episodes.tsx";
import { createWorldsRoutes } from "./routes-worlds.tsx";

// =====================================================
// MOUNT SUB-ROUTES
// =====================================================

// Scenes Routes
const scenesRoutes = createScenesRoutes(supabase, getUserIdFromAuth);
app.route("/make-server-3b52693b", scenesRoutes);

// Characters Routes
const charactersRoutes = createCharactersRoutes(supabase, getUserIdFromAuth);
app.route("/make-server-3b52693b", charactersRoutes);

// Episodes Routes
const episodesRoutes = createEpisodesRoutes(supabase, getUserIdFromAuth);
app.route("/make-server-3b52693b", episodesRoutes);

// Worlds Routes
const worldsRoutes = createWorldsRoutes(supabase, getUserIdFromAuth, getOrCreateUserOrganization);
app.route("/make-server-3b52693b", worldsRoutes);

// =====================================================
// STORAGE ROUTES
// =====================================================

// Upload file to Supabase Storage
app.post("/make-server-3b52693b/storage/upload", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Create bucket if it doesn't exist
    const bucketName = "make-3b52693b-storage";
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }

    // Upload file
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${userId}/${crypto.randomUUID()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(data.path, 31536000); // 1 year

    return c.json({ 
      success: true,
      url: signedUrlData?.signedUrl,
      path: data.path,
    });
  } catch (error: any) {
    return c.json({ error: "Failed to upload file", details: error.message }, 500);
  }
});

// Get storage usage
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
        size: f.metadata?.size,
        createdAt: f.created_at,
      })),
    });
  } catch (error: any) {
    return c.json({ error: "Failed to get storage usage", details: error.message }, 500);
  }
});

// =====================================================
// START SERVER
// =====================================================

console.log("🚀 Scriptony PostgreSQL Server starting...");

Deno.serve(app.fetch);
