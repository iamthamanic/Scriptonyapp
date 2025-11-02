/**
 * 📝 SCRIPTONY LOGS - Edge Function
 * 
 * ✅ PHASE 2: COMPLETE IMPLEMENTATION (SCHEMA FIXED)
 * 📅 Created: 2025-11-02
 * 🔄 Updated: 2025-11-02 (Schema Fix - created_at vs timestamp)
 * 
 * Activity Logging & Audit Trail System
 * 
 * FEATURES:
 * - Read Activity Logs from database (auto-generated via DB triggers)
 * - Entity-Specific Logs (timeline_node, character, world, project)
 * - User Activity Tracking
 * - Action Types (created, updated, deleted, reordered)
 * - Change Details (old vs new values)
 * - Pagination support
 * 
 * NOTE: Logs are created automatically via database triggers in Migration 021
 * SCHEMA FIX: activity_logs uses 'created_at', not 'timestamp'
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// SETUP
// =============================================================================

const app = new Hono().basePath("/scriptony-logs");

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
    function: "scriptony-logs",
    version: "2.1.0",
    phase: "2 (Schema Fixed)",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// GET RECENT LOGS FOR PROJECT
// =============================================================================

/**
 * GET /logs/project/:id/recent
 * Get recent activity logs for a specific project
 * Query params:
 * - limit: number of logs to return (default: 50, max: 100)
 * - entity_type: filter by entity type (optional)
 * - action: filter by action type (optional)
 */
app.get("/logs/project/:id/recent", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
    const entityTypeFilter = c.req.query("entity_type");
    const actionFilter = c.req.query("action");

    console.log(`[Logs] Fetching recent logs for project ${projectId} (limit: ${limit})`);

    // Build query (use created_at, not timestamp)
    let query = supabase
      .from("activity_logs")
      .select(`
        id,
        created_at,
        user_id,
        entity_type,
        entity_id,
        action,
        details
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters
    if (entityTypeFilter) {
      query = query.eq("entity_type", entityTypeFilter);
    }
    if (actionFilter) {
      query = query.eq("action", actionFilter);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("[Logs] Error fetching logs:", logsError);
      return c.json({ error: logsError.message }, 500);
    }

    // Fetch user info for each unique user_id
    const uniqueUserIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean) || [])];
    
    let usersMap: Record<string, any> = {};
    if (uniqueUserIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      if (users?.users) {
        usersMap = Object.fromEntries(
          users.users
            .filter(u => uniqueUserIds.includes(u.id))
            .map(u => [u.id, {
              id: u.id,
              email: u.email,
              name: u.user_metadata?.name || u.email,
            }])
        );
      }
    }

    // Enrich logs with user data (map created_at to timestamp for frontend)
    const enrichedLogs = (logs || []).map(log => ({
      id: log.id,
      timestamp: log.created_at,
      user: log.user_id ? usersMap[log.user_id] || null : null,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      action: log.action,
      details: log.details,
    }));

    return c.json({
      logs: enrichedLogs,
      count: enrichedLogs.length,
    });
  } catch (error: any) {
    console.error("[Logs] Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// GET LOGS FOR SPECIFIC ENTITY
// =============================================================================

/**
 * GET /logs/entity/:type/:id
 * Get activity logs for a specific entity
 * Query params:
 * - limit: number of logs to return (default: 20, max: 50)
 */
app.get("/logs/entity/:type/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const entityType = c.req.param("type");
    const entityId = c.req.param("id");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50);

    console.log(`[Logs] Fetching logs for ${entityType}/${entityId}`);

    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select(`
        id,
        created_at,
        user_id,
        entity_type,
        entity_id,
        action,
        details
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error("[Logs] Error fetching entity logs:", logsError);
      return c.json({ error: logsError.message }, 500);
    }

    // Fetch user info
    const uniqueUserIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean) || [])];
    
    let usersMap: Record<string, any> = {};
    if (uniqueUserIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      if (users?.users) {
        usersMap = Object.fromEntries(
          users.users
            .filter(u => uniqueUserIds.includes(u.id))
            .map(u => [u.id, {
              id: u.id,
              email: u.email,
              name: u.user_metadata?.name || u.email,
            }])
        );
      }
    }

    // Enrich logs with user data
    const enrichedLogs = (logs || []).map(log => ({
      id: log.id,
      timestamp: log.created_at,
      user: log.user_id ? usersMap[log.user_id] || null : null,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      action: log.action,
      details: log.details,
    }));

    return c.json({
      logs: enrichedLogs,
      count: enrichedLogs.length,
    });
  } catch (error: any) {
    console.error("[Logs] Entity logs error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// GET USER ACTIVITY
// =============================================================================

/**
 * GET /logs/user/activity
 * Get current user's recent activity across all projects
 * Query params:
 * - limit: number of logs to return (default: 50, max: 100)
 */
app.get("/logs/user/activity", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);

    console.log(`[Logs] Fetching activity for user ${userId}`);

    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select(`
        id,
        created_at,
        project_id,
        entity_type,
        entity_id,
        action,
        details
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (logsError) {
      console.error("[Logs] Error fetching user activity:", logsError);
      return c.json({ error: logsError.message }, 500);
    }

    return c.json({
      logs: logs || [],
      count: logs?.length || 0,
    });
  } catch (error: any) {
    console.error("[Logs] User activity error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("📝 Scriptony Logs Function starting (PHASE 2 - Schema Fixed)...");
Deno.serve(app.fetch);
