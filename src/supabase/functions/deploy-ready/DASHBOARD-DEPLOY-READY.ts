/**
 * 🚀 SCRIPTONY SERVER - COMPLETE DASHBOARD DEPLOY VERSION
 * 
 * ✅ AKTUALISIERT MIT NEUEN TABELLENNAMEN:
 * - ai_chat_settings (statt user_ai_settings)
 * - ai_conversations (statt chat_conversations)
 * - ai_chat_messages (statt chat_messages)
 * - rag_knowledge (user_id statt organization_id)
 * 
 * 📋 DEPLOY ANLEITUNG:
 * 1. Cmd+A → Cmd+C (alles kopieren)
 * 2. Supabase Dashboard → Edge Functions → make-server-3b52693b
 * 3. Cmd+V (einfügen) → Save & Deploy
 * 
 * WICHTIG: Stelle sicher dass diese Environment Variables gesetzt sind:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY  
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encode } from "npm:gpt-tokenizer@2.1.1";

// =============================================================================
// SUPABASE CLIENT & APP SETUP
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
// TOKEN COUNTER UTILITY (INLINE)
// =============================================================================

function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0;
  
  try {
    const supportsAccurate = (
      model.includes('gpt-4') ||
      model.includes('gpt-3.5') ||
      model.includes('o1-')
    );
    
    if (supportsAccurate) {
      const tokens = encode(text);
      return tokens.length;
    }
    
    // Estimation for other models
    return Math.ceil(text.length / 3.5);
  } catch (error) {
    return Math.ceil(text.length / 3.5);
  }
}

function countConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): { input_tokens: number; output_tokens: number; total_tokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  
  for (const msg of messages) {
    const tokens = countTokens(msg.content, model) + countTokens(msg.role, model) + 4;
    if (msg.role === 'assistant') {
      outputTokens += tokens;
    } else {
      inputTokens += tokens;
    }
  }
  
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug: orgSlug,
      created_by: userId,
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error("Error creating organization:", orgError);
    return null;
  }

  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  return org.id;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
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
      user_metadata: { 
        name,
        role: "user",
      },
      email_confirm: true,
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;
    const organizationId = await getOrCreateUserOrganization(userId);

    if (!organizationId) {
      return c.json({ error: "Failed to create organization" }, 500);
    }

    return c.json({ 
      message: "User created successfully",
      user: { id: userId, email: data.user.email },
      organizationId,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed", details: error.message }, 500);
  }
});

// =============================================================================
// AI CHAT ROUTES (UPDATED WITH NEW TABLE NAMES)
// =============================================================================

// Get AI Chat Settings
app.get("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: settings, error } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching AI settings:", error);
      return c.json({ error: error.message }, 500);
    }

    if (!settings) {
      const defaultSettings = {
        user_id: userId,
        active_provider: 'openai',
        active_model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        system_prompt: 'Du bist ein hilfreicher KI-Assistent für Scriptwriting.',
        use_rag: true,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("ai_chat_settings")  // ✅ NEUE TABELLE
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        return c.json({ error: insertError.message }, 500);
      }

      return c.json(newSettings);
    }

    return c.json(settings);
  } catch (error: any) {
    console.error("AI settings fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update AI Chat Settings
app.put("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get Conversations
app.get("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create Conversation
app.post("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { title, system_prompt } = await c.req.json();

    const { data, error } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .insert({
        user_id: userId,
        title: title || "Neue Konversation",
        system_prompt: system_prompt || null,
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get Messages
app.get("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const conversationId = c.req.param("id");

    const { data, error } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Send Message (with AI response)
app.post("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const convId = c.req.param("id");
    const { message, use_rag } = await c.req.json();

    // Get user settings
    const { data: settings } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      return c.json({ error: "AI settings not found" }, 404);
    }

    // Get API key
    const providerKey = `${settings.active_provider.toUpperCase()}_API_KEY`;
    const apiKey = Deno.env.get(providerKey);

    if (!apiKey) {
      return c.json({ error: `${settings.active_provider} API key not configured` }, 500);
    }

    // Save user message
    const { data: userMessage } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .insert({
        conversation_id: convId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    // Get RAG context if enabled
    let ragContext = '';
    if (use_rag || settings.use_rag) {
      const { data: ragData } = await supabase
        .from("rag_knowledge")
        .select("content, reference_name, content_type")
        .eq("user_id", userId)  // ✅ USER_ID statt ORGANIZATION_ID
        .textSearch('content', message, { type: 'websearch' })
        .limit(5);

      if (ragData && ragData.length > 0) {
        ragContext = '\n\nRelevanter Kontext:\n' + 
          ragData.map(r => `[${r.content_type}: ${r.reference_name}]\n${r.content}`).join('\n\n');
      }
    }

    // Get conversation system prompt or use global
    const { data: conversation } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .select("system_prompt")
      .eq("id", convId)
      .single();

    const systemPrompt = conversation?.system_prompt || settings.system_prompt;

    // Get conversation history
    const { data: history } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(10);

    const messages = [
      { role: "system", content: systemPrompt + ragContext },
      ...(history || []).reverse(),
    ];

    // Call AI provider (OpenAI example)
    let aiResponse = '';
    let tokensUsed = 0;

    if (settings.active_provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: settings.active_model,
          messages,
          temperature: settings.temperature,
          max_tokens: settings.max_tokens,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return c.json({ error: data.error?.message || 'OpenAI API error' }, 500);
      }

      aiResponse = data.choices[0].message.content;
      tokensUsed = data.usage?.total_tokens || 0;
    }

    // Save AI response
    const { data: assistantMessage } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: aiResponse,
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    // Update conversation
    await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .update({ 
        updated_at: new Date().toISOString(),
        message_count: (conversation?.message_count || 0) + 2,
      })
      .eq("id", convId);

    return c.json({
      userMessage,
      assistantMessage,
      tokensUsed,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// PROJECTS ROUTES
// =============================================================================

app.get("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organizationId = await getOrCreateUserOrganization(userId);

    if (!organizationId) {
      return c.json({ error: "No organization found" }, 404);
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organizationId = await getOrCreateUserOrganization(userId);
    const projectData = await c.req.json();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...projectData,
        organization_id: organizationId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ message: "Project deleted" });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// ACTS ROUTES (Timeline)
// =============================================================================

// Get acts for a project
app.get("/make-server-3b52693b/acts", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.query("project_id");
    if (!projectId) {
      return c.json({ error: "project_id required" }, 400);
    }

    const { data, error } = await supabase
      .from("acts")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching acts:", error);
      return c.json({ error: error.message }, 500);
    }

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

// Create act
app.post("/make-server-3b52693b/acts", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const project_id = body.project_id || body.projectId;
    const act_number = body.act_number ?? body.actNumber;
    const { title, description, color } = body;

    if (!project_id || act_number === undefined) {
      return c.json({ error: "project_id and act_number required" }, 400);
    }

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
        color: color || '#6E59A5',
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating act:", error);
      return c.json({ error: error.message }, 500);
    }

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

// Update act
app.put("/make-server-3b52693b/acts/:id", async (c) => {
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
    if (updates.color !== undefined) dbUpdates.color = updates.color;
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

// Delete act
app.delete("/make-server-3b52693b/acts/:id", async (c) => {
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
// SEQUENCES ROUTES (Timeline)
// =============================================================================

// Get sequences for an act
app.get("/make-server-3b52693b/sequences/:actId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const actId = c.req.param("actId");

    const { data, error } = await supabase
      .from("sequences")
      .select("*")
      .eq("act_id", actId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching sequences:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = (data || []).map((seq: any) => ({
      id: seq.id,
      actId: seq.act_id,
      sequenceNumber: seq.sequence_number,
      title: seq.title,
      description: seq.description,
      color: seq.color,
      orderIndex: seq.order_index,
      createdAt: seq.created_at,
      updatedAt: seq.updated_at,
    }));

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Sequences GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create sequence
app.post("/make-server-3b52693b/sequences", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const act_id = body.act_id || body.actId;
    const sequence_number = body.sequence_number ?? body.sequenceNumber;
    const { title, description, color } = body;

    if (!act_id || sequence_number === undefined) {
      return c.json({ error: "act_id and sequence_number required" }, 400);
    }

    const { data: existingSeqs } = await supabase
      .from("sequences")
      .select("order_index")
      .eq("act_id", act_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingSeqs?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from("sequences")
      .insert({
        act_id,
        sequence_number,
        title,
        description,
        color: color || '#6E59A5',
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating sequence:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = {
      id: data.id,
      actId: data.act_id,
      sequenceNumber: data.sequence_number,
      title: data.title,
      description: data.description,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Sequences POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update sequence
app.put("/make-server-3b52693b/sequences/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const seqId = c.req.param("id");
    const updates = await c.req.json();

    const dbUpdates: any = {};
    if (updates.sequenceNumber !== undefined) dbUpdates.sequence_number = updates.sequenceNumber;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from("sequences")
      .update(dbUpdates)
      .eq("id", seqId)
      .select()
      .single();

    if (error) {
      console.error("Error updating sequence:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = {
      id: data.id,
      actId: data.act_id,
      sequenceNumber: data.sequence_number,
      title: data.title,
      description: data.description,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Sequences PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete sequence
app.delete("/make-server-3b52693b/sequences/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const seqId = c.req.param("id");

    const { error } = await supabase
      .from("sequences")
      .delete()
      .eq("id", seqId);

    if (error) {
      console.error("Error deleting sequence:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Sequences DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// SCENES ROUTES (Timeline)
// =============================================================================

// Get scenes for a sequence
app.get("/make-server-3b52693b/scenes/:sequenceId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const sequenceId = c.req.param("sequenceId");

    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching scenes:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = (data || []).map((scene: any) => ({
      id: scene.id,
      sequenceId: scene.sequence_id,
      sceneNumber: scene.scene_number,
      title: scene.title,
      description: scene.description,
      location: scene.location,
      timeOfDay: scene.time_of_day,
      color: scene.color,
      orderIndex: scene.order_index,
      createdAt: scene.created_at,
      updatedAt: scene.updated_at,
    }));

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Scenes GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create scene
app.post("/make-server-3b52693b/scenes", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const sequence_id = body.sequence_id || body.sequenceId;
    const scene_number = body.scene_number || body.sceneNumber;
    const { title, description, location, time_of_day, color } = body;

    if (!sequence_id) {
      return c.json({ error: "sequence_id is required" }, 400);
    }

    // Get the sequence to get project_id and act_id
    const { data: sequence, error: seqError } = await supabase
      .from("sequences")
      .select("act_id, acts(project_id)")
      .eq("id", sequence_id)
      .single();

    if (seqError || !sequence) {
      console.error("Sequence not found:", seqError);
      return c.json({ error: "Sequence not found" }, 404);
    }

    const project_id = (sequence.acts as any)?.project_id;
    if (!project_id) {
      console.error("Could not determine project_id from sequence");
      return c.json({ error: "Could not determine project_id" }, 500);
    }

    // Get highest order_index
    const { data: existingScenes } = await supabase
      .from("scenes")
      .select("order_index")
      .eq("sequence_id", sequence_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingScenes?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from("scenes")
      .insert({
        project_id,
        sequence_id,
        act_id: sequence.act_id,
        scene_number,
        title,
        description,
        location,
        time_of_day,
        color: color || '#6E59A5',
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating scene:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = {
      id: data.id,
      sequenceId: data.sequence_id,
      sceneNumber: data.scene_number,
      title: data.title,
      description: data.description,
      location: data.location,
      timeOfDay: data.time_of_day,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Scenes POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update scene
app.put("/make-server-3b52693b/scenes/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const sceneId = c.req.param("id");
    const updates = await c.req.json();

    const dbUpdates: any = {};
    if (updates.sceneNumber !== undefined) dbUpdates.scene_number = updates.sceneNumber;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.timeOfDay !== undefined) dbUpdates.time_of_day = updates.timeOfDay;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from("scenes")
      .update(dbUpdates)
      .eq("id", sceneId)
      .select()
      .single();

    if (error) {
      console.error("Error updating scene:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedData = {
      id: data.id,
      sequenceId: data.sequence_id,
      sceneNumber: data.scene_number,
      title: data.title,
      description: data.description,
      location: data.location,
      timeOfDay: data.time_of_day,
      color: data.color,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json(transformedData);
  } catch (error: any) {
    console.error("Scenes PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete scene
app.delete("/make-server-3b52693b/scenes/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const sceneId = c.req.param("id");

    const { error } = await supabase
      .from("scenes")
      .delete()
      .eq("id", sceneId);

    if (error) {
      console.error("Error deleting scene:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Scenes DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// SHOTS ROUTES (Timeline)
// =============================================================================

// Get shots for a scene
app.get("/make-server-3b52693b/shots/:sceneId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const sceneId = c.req.param("sceneId");

    const { data: shotsData, error } = await supabase
      .from("shots")
      .select("*")
      .eq("scene_id", sceneId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching shots:", error);
      return c.json({ error: error.message }, 500);
    }

    // For each shot, get characters and transform to camelCase
    const shotsWithDetails = await Promise.all(
      (shotsData || []).map(async (shot) => {
        const { data: characters } = await supabase.rpc("get_shot_characters", {
          p_shot_id: shot.id,
        });

        const { data: audioFiles } = await supabase
          .from("shot_audio")
          .select("*")
          .eq("shot_id", shot.id);

        return {
          id: shot.id,
          sceneId: shot.scene_id,
          projectId: shot.project_id,
          shotNumber: shot.shot_number,
          description: shot.description,
          cameraAngle: shot.camera_angle,
          cameraMovement: shot.camera_movement,
          lens: shot.lens,
          duration: shot.duration,
          composition: shot.composition,
          lightingNotes: shot.lighting_notes,
          soundNotes: shot.sound_notes,
          storyboardUrl: shot.storyboard_url,
          referenceImageUrl: shot.reference_image_url,
          framing: shot.framing,
          dialog: shot.dialog,
          notes: shot.notes,
          shotlengthMinutes: shot.shotlength_minutes,
          shotlengthSeconds: shot.shotlength_seconds,
          imageUrl: shot.image_url,
          orderIndex: shot.order_index,
          createdAt: shot.created_at,
          updatedAt: shot.updated_at,
          characters: characters || [],
          audioFiles: audioFiles || [],
        };
      })
    );

    return c.json({ shots: shotsWithDetails });
  } catch (error: any) {
    console.error("Shots GET error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create shot
app.post("/make-server-3b52693b/shots", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const scene_id = body.scene_id || body.sceneId;
    const shot_number = body.shot_number || body.shotNumber;

    if (!scene_id || !shot_number) {
      return c.json({ error: "scene_id and shot_number are required" }, 400);
    }

    // Get project_id from scene
    const { data: scene, error: sceneError } = await supabase
      .from("scenes")
      .select("project_id")
      .eq("id", scene_id)
      .single();

    if (sceneError || !scene) {
      console.error("Scene not found:", sceneError);
      return c.json({ error: "Scene not found" }, 404);
    }

    const project_id = scene.project_id;

    // Get highest order_index
    const { data: existingShots } = await supabase
      .from("shots")
      .select("order_index")
      .eq("scene_id", scene_id)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingShots?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
      .from("shots")
      .insert({
        scene_id,
        project_id,
        shot_number,
        description: body.description,
        camera_angle: body.camera_angle || body.cameraAngle,
        camera_movement: body.camera_movement || body.cameraMovement,
        framing: body.framing,
        lens: body.lens,
        shotlength_minutes: body.shotlength_minutes ?? body.shotlengthMinutes ?? 0,
        shotlength_seconds: body.shotlength_seconds ?? body.shotlengthSeconds ?? 5,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shot:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase for frontend
    const transformedData = {
      id: data.id,
      sceneId: data.scene_id,
      projectId: data.project_id,
      shotNumber: data.shot_number,
      description: data.description,
      cameraAngle: data.camera_angle,
      cameraMovement: data.camera_movement,
      lens: data.lens,
      duration: data.duration,
      composition: data.composition,
      lightingNotes: data.lighting_notes,
      soundNotes: data.sound_notes,
      storyboardUrl: data.storyboard_url,
      referenceImageUrl: data.reference_image_url,
      framing: data.framing,
      dialog: data.dialog,
      notes: data.notes,
      shotlengthMinutes: data.shotlength_minutes,
      shotlengthSeconds: data.shotlength_seconds,
      imageUrl: data.image_url,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ shot: transformedData }, 201);
  } catch (error: any) {
    console.error("Shots POST error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update shot
app.put("/make-server-3b52693b/shots/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const shotId = c.req.param("id");
    const updates = await c.req.json();

    const dbUpdates: any = {};
    if (updates.shotNumber !== undefined) dbUpdates.shot_number = updates.shotNumber;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.cameraAngle !== undefined) dbUpdates.camera_angle = updates.cameraAngle;
    if (updates.cameraMovement !== undefined) dbUpdates.camera_movement = updates.cameraMovement;
    if (updates.framing !== undefined) dbUpdates.framing = updates.framing;
    if (updates.lens !== undefined) dbUpdates.lens = updates.lens;
    if (updates.shotlengthMinutes !== undefined) dbUpdates.shotlength_minutes = updates.shotlengthMinutes;
    if (updates.shotlengthSeconds !== undefined) dbUpdates.shotlength_seconds = updates.shotlengthSeconds;
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

    const { data, error } = await supabase
      .from("shots")
      .update(dbUpdates)
      .eq("id", shotId)
      .select()
      .single();

    if (error) {
      console.error("Error updating shot:", error);
      return c.json({ error: error.message }, 500);
    }

    // Transform to camelCase for frontend
    const transformedData = {
      id: data.id,
      sceneId: data.scene_id,
      projectId: data.project_id,
      shotNumber: data.shot_number,
      description: data.description,
      cameraAngle: data.camera_angle,
      cameraMovement: data.camera_movement,
      lens: data.lens,
      duration: data.duration,
      composition: data.composition,
      lightingNotes: data.lighting_notes,
      soundNotes: data.sound_notes,
      storyboardUrl: data.storyboard_url,
      referenceImageUrl: data.reference_image_url,
      framing: data.framing,
      dialog: data.dialog,
      notes: data.notes,
      shotlengthMinutes: data.shotlength_minutes,
      shotlengthSeconds: data.shotlength_seconds,
      imageUrl: data.image_url,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return c.json({ shot: transformedData });
  } catch (error: any) {
    console.error("Shots PUT error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete shot
app.delete("/make-server-3b52693b/shots/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const shotId = c.req.param("id");

    const { error } = await supabase
      .from("shots")
      .delete()
      .eq("id", shotId);

    if (error) {
      console.error("Error deleting shot:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Shots DELETE error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// PROJECT INIT ROUTES (3-Act Structure)
// =============================================================================

// Initialize 3-act structure for a project
app.post("/make-server-3b52693b/projects/:projectId/init-three-act", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("projectId");
    console.log("[PROJECT-INIT] Starting 3-act initialization for project:", projectId);

    const actDefinitions = [
      { number: 1, title: "Act 1 - Setup", description: "Introduction to the world and characters", color: "#00CCC0" },
      { number: 2, title: "Act 2 - Confrontation", description: "Rising action and challenges", color: "#98E5B4" },
      { number: 3, title: "Act 3 - Resolution", description: "Climax and conclusion", color: "#FF8FB1" },
    ];

    const createdStructure = [];

    for (let i = 0; i < actDefinitions.length; i++) {
      const actDef = actDefinitions[i];

      // 1. Create Act
      const { data: act, error: actError } = await supabase
        .from("acts")
        .insert({
          project_id: projectId,
          act_number: actDef.number,
          title: actDef.title,
          description: actDef.description,
          color: actDef.color,
          order_index: i,
        })
        .select()
        .single();

      if (actError) {
        console.error("[PROJECT-INIT] Error creating act:", actError);
        return c.json({ error: `Failed to create act ${actDef.number}: ${actError.message}` }, 500);
      }

      console.log("[PROJECT-INIT] Created act:", act.id);

      // 2. Create Sequence
      const { data: sequence, error: seqError } = await supabase
        .from("sequences")
        .insert({
          act_id: act.id,
          sequence_number: 1,
          title: `Sequence ${actDef.number}.1`,
          description: `First sequence of ${actDef.title}`,
          color: actDef.color,
          order_index: 0,
        })
        .select()
        .single();

      if (seqError) {
        console.error("[PROJECT-INIT] Error creating sequence:", seqError);
        return c.json({ error: `Failed to create sequence for act ${actDef.number}: ${seqError.message}` }, 500);
      }

      console.log("[PROJECT-INIT] Created sequence:", sequence.id);

      // 3. Create Scene
      const { data: scene, error: sceneError } = await supabase
        .from("scenes")
        .insert({
          project_id: projectId,
          sequence_id: sequence.id,
          act_id: act.id,
          scene_number: `${actDef.number}.1.1`,
          title: `Scene ${actDef.number}.1.1`,
          description: `First scene of sequence ${actDef.number}.1`,
          order_index: 0,
        })
        .select()
        .single();

      if (sceneError) {
        console.error("[PROJECT-INIT] Error creating scene:", sceneError);
        return c.json({ error: `Failed to create scene for sequence ${actDef.number}.1: ${sceneError.message}` }, 500);
      }

      console.log("[PROJECT-INIT] Created scene:", scene.id);

      // 4. Create Shot
      const { data: shot, error: shotError } = await supabase
        .from("shots")
        .insert({
          scene_id: scene.id,
          shot_number: `${actDef.number}.1.1.1`,
          description: `First shot of scene ${actDef.number}.1.1`,
          camera_angle: "Eye Level",
          camera_movement: "Static",
          framing: "MS",
          lens: "50mm",
          shotlength_minutes: 0,
          shotlength_seconds: 5,
          order_index: 0,
        })
        .select()
        .single();

      if (shotError) {
        console.error("[PROJECT-INIT] Error creating shot:", shotError);
        return c.json({ error: `Failed to create shot for scene ${actDef.number}.1.1: ${shotError.message}` }, 500);
      }

      console.log("[PROJECT-INIT] Created shot:", shot.id);

      createdStructure.push({ act, sequence, scene, shot });
    }

    console.log("[PROJECT-INIT] ✅ Successfully initialized 3-act structure for project:", projectId);

    const acts = createdStructure.map((item) => ({
      id: item.act.id,
      projectId: item.act.project_id,
      actNumber: item.act.act_number,
      title: item.act.title,
      description: item.act.description,
      color: item.act.color,
      orderIndex: item.act.order_index,
      createdAt: item.act.created_at,
      updatedAt: item.act.updated_at,
    }));

    return c.json({
      success: true,
      message: "3-act structure initialized successfully",
      acts,
      structure: createdStructure,
    });
  } catch (error: any) {
    console.error("[PROJECT-INIT] Unexpected error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// WORLDS ROUTES
// =============================================================================

// Get all worlds
app.get("/make-server-3b52693b/worlds", async (c) => {
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
app.get("/make-server-3b52693b/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

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
app.post("/make-server-3b52693b/worlds", async (c) => {
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
app.put("/make-server-3b52693b/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

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
app.delete("/make-server-3b52693b/worlds/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

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

// =============================================================================
// START SERVER
// =============================================================================

console.log("🚀 Scriptony Server starting...");
Deno.serve(app.fetch);
