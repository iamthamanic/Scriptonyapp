/**
 * 🎬 SCRIPTONY TIMELINE V2 - GENERISCHE EDGE FUNCTION
 * 
 * Template Engine - Generisch für ALLE Project Templates!
 * 
 * Unterstützt:
 * - Film: 3-Akt, Heldenreise, Save the Cat, ...
 * - Serie: Traditional (Seasons → Episodes → Scenes → Shots)
 * - Buch: Roman (Parts → Chapters → Sections)
 * - Theater: Klassisch (Acts → Scenes → Beats)
 * - Game: Story-Driven (Chapters → Levels → Missions → Cutscenes)
 * 
 * NEUE TEMPLATES = NUR Frontend Code, kein Backend Deploy! ✅
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// =============================================================================
// TYPES
// =============================================================================

interface TimelineNode {
  id: string;
  project_id: string;
  template_id: string;
  level: number;
  parent_id: string | null;
  node_number: number;
  title: string;
  description?: string;
  color?: string;
  order_index: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreateNodeRequest {
  project_id: string;
  template_id: string;
  level: number;
  parent_id?: string | null;
  node_number: number;
  title: string;
  description?: string;
  color?: string;
  metadata?: Record<string, any>;
}

interface UpdateNodeRequest {
  node_number?: number;
  title?: string;
  description?: string;
  color?: string;
  order_index?: number;
  metadata?: Record<string, any>;
}

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
// TRANSFORM HELPERS
// =============================================================================

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

function toCamelCase(obj: Record<string, any>): Record<string, any> {
  return {
    id: obj.id,
    projectId: obj.project_id,
    templateId: obj.template_id,
    level: obj.level,
    parentId: obj.parent_id,
    nodeNumber: obj.node_number,
    title: obj.title,
    description: obj.description,
    color: obj.color,
    orderIndex: obj.order_index,
    metadata: obj.metadata,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  };
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/health", (c) => {
  return c.json({ 
    status: "ok", 
    function: "scriptony-timeline-v2",
    version: "2.0.0",
    features: ["generic-templates", "jsonb-metadata", "all-project-types"],
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// NODES ROUTES (GENERISCH!)
// =============================================================================

/**
 * GET /nodes
 * Query nodes with filters
 * 
 * Query params:
 * - project_id (required): Filter by project
 * - level (optional): Filter by level (1, 2, 3, 4)
 * - parent_id (optional): Filter by parent (use "null" for root nodes)
 * - template_id (optional): Filter by template
 */
app.get("/nodes", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.query("project_id");
    const level = c.req.query("level");
    const parentId = c.req.query("parent_id");
    const templateId = c.req.query("template_id");

    if (!projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }

    // Build query
    let query = supabase
      .from("timeline_nodes")
      .select("*")
      .eq("project_id", projectId);

    if (level) {
      query = query.eq("level", parseInt(level));
    }

    if (parentId) {
      if (parentId === "null") {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", parentId);
      }
    }

    if (templateId) {
      query = query.eq("template_id", templateId);
    }

    query = query.order("order_index", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching nodes:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase
    const transformedNodes = (data || []).map(toCamelCase);

    return c.json({ nodes: transformedNodes });
  } catch (error: any) {
    console.error("Nodes GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /nodes/:id
 * Get single node by ID
 */
app.get("/nodes/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const nodeId = c.req.param("id");

    const { data, error } = await supabase
      .from("timeline_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    if (error) {
      console.error("Error fetching node:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ node: toCamelCase(data) });
  } catch (error: any) {
    console.error("Node GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /nodes/:id/children
 * Get all children of a node (recursive optional)
 */
app.get("/nodes/:id/children", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const nodeId = c.req.param("id");
    const recursive = c.req.query("recursive") === "true";

    if (recursive) {
      // Use helper function for recursive query
      const { data, error } = await supabase
        .rpc("get_node_descendants", { node_id: nodeId });

      if (error) {
        console.error("Error fetching descendants:", error);
        return c.json({ error: error.message }, 500);
      }

      return c.json({ children: data || [] });
    } else {
      // Direct children only
      const { data, error } = await supabase
        .from("timeline_nodes")
        .select("*")
        .eq("parent_id", nodeId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching children:", error);
        return c.json({ error: error.message }, 500);
      }

      const transformedChildren = (data || []).map(toCamelCase);
      return c.json({ children: transformedChildren });
    }
  } catch (error: any) {
    console.error("Children GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /nodes/:id/path
 * Get node path (from root to this node)
 */
app.get("/nodes/:id/path", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const nodeId = c.req.param("id");

    const { data, error } = await supabase
      .rpc("get_node_path", { node_id: nodeId });

    if (error) {
      console.error("Error fetching node path:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ path: data || [] });
  } catch (error: any) {
    console.error("Path GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /nodes
 * Create new node
 */
app.post("/nodes", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body: CreateNodeRequest = await c.req.json();

    // Validate required fields
    if (!body.project_id && !body.projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }
    if (!body.template_id && !body.templateId) {
      return c.json({ error: "template_id is required" }, 400);
    }
    if (!body.level) {
      return c.json({ error: "level is required" }, 400);
    }
    if (!body.node_number && body.node_number !== 0 && !body.nodeNumber && body.nodeNumber !== 0) {
      return c.json({ error: "node_number is required" }, 400);
    }
    if (!body.title) {
      return c.json({ error: "title is required" }, 400);
    }

    // Convert camelCase to snake_case
    const projectId = body.project_id || body.projectId;
    const templateId = body.template_id || body.templateId;
    const parentId = body.parent_id || body.parentId || null;
    const nodeNumber = body.node_number || body.nodeNumber;

    // Get highest order_index for this parent
    let query = supabase
      .from("timeline_nodes")
      .select("order_index")
      .eq("project_id", projectId);

    if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.is("parent_id", null);
    }

    const { data: existingNodes } = await query
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingNodes?.[0]?.order_index ?? -1) + 1;

    // Insert node
    const { data, error } = await supabase
      .from("timeline_nodes")
      .insert({
        project_id: projectId,
        template_id: templateId,
        level: body.level,
        parent_id: parentId,
        node_number: nodeNumber,
        title: body.title,
        description: body.description,
        color: body.color,
        order_index: nextOrderIndex,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating node:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ node: toCamelCase(data) }, 201);
  } catch (error: any) {
    console.error("Nodes POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /nodes/:id
 * Update node
 */
app.put("/nodes/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const nodeId = c.req.param("id");
    const updates: UpdateNodeRequest = await c.req.json();

    // Build update object
    const dbUpdates: any = {};
    if (updates.nodeNumber !== undefined || updates.node_number !== undefined) {
      dbUpdates.node_number = updates.nodeNumber || updates.node_number;
    }
    if (updates.title !== undefined) {
      dbUpdates.title = updates.title;
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }
    if (updates.color !== undefined) {
      dbUpdates.color = updates.color;
    }
    if (updates.orderIndex !== undefined || updates.order_index !== undefined) {
      dbUpdates.order_index = updates.orderIndex ?? updates.order_index;
    }
    if (updates.metadata !== undefined) {
      dbUpdates.metadata = updates.metadata;
    }

    const { data, error } = await supabase
      .from("timeline_nodes")
      .update(dbUpdates)
      .eq("id", nodeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating node:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ node: toCamelCase(data) });
  } catch (error: any) {
    console.error("Nodes PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * DELETE /nodes/:id
 * Delete node (cascades to children via DB constraint)
 */
app.delete("/nodes/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const nodeId = c.req.param("id");

    const { error } = await supabase
      .from("timeline_nodes")
      .delete()
      .eq("id", nodeId);

    if (error) {
      console.error("Error deleting node:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Nodes DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /nodes/reorder
 * Reorder nodes within a parent
 */
app.post("/nodes/reorder", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const nodeIds: string[] = body.nodeIds || body.node_ids || [];

    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return c.json({ error: "nodeIds array is required" }, 400);
    }

    // Update order_index for each node
    const updates = nodeIds.map((nodeId, index) => 
      supabase
        .from("timeline_nodes")
        .update({ order_index: index })
        .eq("id", nodeId)
    );

    await Promise.all(updates);

    return c.json({ success: true, count: nodeIds.length });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /nodes/bulk
 * Bulk create nodes (useful for initializing project structure)
 */
app.post("/nodes/bulk", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const nodes: CreateNodeRequest[] = body.nodes || [];

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return c.json({ error: "nodes array is required" }, 400);
    }

    // Convert to snake_case and add order_index
    const dbNodes = nodes.map((node, index) => ({
      project_id: node.project_id || node.projectId,
      template_id: node.template_id || node.templateId,
      level: node.level,
      parent_id: node.parent_id || node.parentId || null,
      node_number: node.node_number || node.nodeNumber,
      title: node.title,
      description: node.description,
      color: node.color,
      order_index: index,
      metadata: node.metadata || {},
    }));

    const { data, error } = await supabase
      .from("timeline_nodes")
      .insert(dbNodes)
      .select();

    if (error) {
      console.error("Error bulk creating nodes:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedNodes = (data || []).map(toCamelCase);
    return c.json({ nodes: transformedNodes, count: transformedNodes.length }, 201);
  } catch (error: any) {
    console.error("Bulk create error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// PROJECT INITIALIZATION HELPER
// =============================================================================

/**
 * POST /initialize-project
 * Initialize project structure based on template
 * Creates default hierarchy based on template's defaultStructure
 */
app.post("/initialize-project", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const projectId = body.project_id || body.projectId;
    const templateId = body.template_id || body.templateId;
    const structure = body.structure; // { level_1_count, level_2_per_parent, ... }
    const predefinedNodes = body.predefined_nodes || body.predefinedNodes; // Optional

    if (!projectId || !templateId) {
      return c.json({ error: "project_id and template_id are required" }, 400);
    }

    if (!structure || !structure.level_1_count) {
      return c.json({ error: "structure with level_1_count is required" }, 400);
    }

    const createdNodes: any[] = [];

    // Create Level 1 nodes
    for (let i = 1; i <= structure.level_1_count; i++) {
      const predefined = predefinedNodes?.level_1?.find((n: any) => n.number === i);
      
      const { data: level1Node, error: error1 } = await supabase
        .from("timeline_nodes")
        .insert({
          project_id: projectId,
          template_id: templateId,
          level: 1,
          parent_id: null,
          node_number: i,
          title: predefined?.title || `Node ${i}`,
          description: predefined?.description,
          order_index: i - 1,
          metadata: {},
        })
        .select()
        .single();

      if (error1) {
        console.error("Error creating level 1 node:", error1);
        continue;
      }

      createdNodes.push(level1Node);

      // Create Level 2 nodes if specified
      if (structure.level_2_per_parent) {
        for (let j = 1; j <= structure.level_2_per_parent; j++) {
          const { data: level2Node, error: error2 } = await supabase
            .from("timeline_nodes")
            .insert({
              project_id: projectId,
              template_id: templateId,
              level: 2,
              parent_id: level1Node.id,
              node_number: j,
              title: `Node ${j}`,
              order_index: j - 1,
              metadata: {},
            })
            .select()
            .single();

          if (error2) {
            console.error("Error creating level 2 node:", error2);
            continue;
          }

          createdNodes.push(level2Node);

          // Create Level 3 nodes if specified
          if (structure.level_3_per_parent) {
            for (let k = 1; k <= structure.level_3_per_parent; k++) {
              const { data: level3Node, error: error3 } = await supabase
                .from("timeline_nodes")
                .insert({
                  project_id: projectId,
                  template_id: templateId,
                  level: 3,
                  parent_id: level2Node.id,
                  node_number: k,
                  title: `Node ${k}`,
                  order_index: k - 1,
                  metadata: {},
                })
                .select()
                .single();

              if (error3) {
                console.error("Error creating level 3 node:", error3);
                continue;
              }

              createdNodes.push(level3Node);

              // Create Level 4 nodes if specified
              if (structure.level_4_per_parent) {
                for (let l = 1; l <= structure.level_4_per_parent; l++) {
                  const { data: level4Node, error: error4 } = await supabase
                    .from("timeline_nodes")
                    .insert({
                      project_id: projectId,
                      template_id: templateId,
                      level: 4,
                      parent_id: level3Node.id,
                      node_number: l,
                      title: `Node ${l}`,
                      order_index: l - 1,
                      metadata: {},
                    })
                    .select()
                    .single();

                  if (error4) {
                    console.error("Error creating level 4 node:", error4);
                    continue;
                  }

                  createdNodes.push(level4Node);
                }
              }
            }
          }
        }
      }
    }

    return c.json({ 
      success: true, 
      count: createdNodes.length,
      nodes: createdNodes.map(toCamelCase),
    }, 201);
  } catch (error: any) {
    console.error("Initialize project error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("🎬 Scriptony Timeline V2 (Generic Template Engine) starting...");
Deno.serve(app.fetch);
