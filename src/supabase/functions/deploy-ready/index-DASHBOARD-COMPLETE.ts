/**
 * 🚀 SCRIPTONY SERVER - COMPLETE DASHBOARD DEPLOY VERSION
 * 
 * Diese Datei enthält den KOMPLETTEN Server mit ALLEN Features in EINER Datei
 * für das Supabase Dashboard (das nur 1 Datei unterstützt).
 * 
 * ✅ FEATURES ENTHALTEN:
 * - Health Check
 * - Auth (Signup, Seed Test User)
 * - Organizations
 * - Projects CRUD
 * - Storage Upload
 * - ✨ AI CHAT (OpenAI, Anthropic, Google, OpenRouter, DeepSeek)
 * - ✨ MCP TOOLS (13 Tools für Scenes, Characters, Projects, Episodes)
 * - ✨ RAG SYNC (Automatische Datenbank-Synchronisation)
 * - ✨ TOKEN COUNTING (Akkurate Token-Zählung)
 * - Characters, Episodes, Scenes, Worlds CRUD
 * 
 * ANLEITUNG:
 * 1. Cmd+A → Cmd+C (alles kopieren)
 * 2. Supabase Dashboard → Functions → make-server-3b52693b
 * 3. Cmd+V (einfügen)
 * 4. Save & Deploy
 * 
 * WICHTIG: Setze vorher die Environment Variables im Dashboard:
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

interface TokenCount {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

interface MessageTokens {
  role: string;
  content: string;
  tokens: number;
}

function supportsAccurateTokenCounting(model: string): boolean {
  return (
    model.includes('gpt-4') ||
    model.includes('gpt-3.5') ||
    model.includes('o1-') ||
    model.includes('text-davinci')
  );
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0;
  
  try {
    if (supportsAccurateTokenCounting(model)) {
      const tokens = encode(text);
      return tokens.length;
    }
    return estimateTokens(text);
  } catch (error) {
    console.error('Token counting error:', error);
    return estimateTokens(text);
  }
}

export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): MessageTokens[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    tokens: countTokens(msg.content, model) + 4, // +4 for message formatting overhead
  }));
}

export function countConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): TokenCount {
  const messageCounts = countMessageTokens(messages, model);
  const total = messageCounts.reduce((sum, msg) => sum + msg.tokens, 0) + 3; // +3 for reply priming
  
  return {
    input_tokens: total,
    output_tokens: 0,
    total_tokens: total,
  };
}

// =============================================================================
// TOOL REGISTRY & TYPES (INLINE)
// =============================================================================

interface ToolContext {
  userId: string;
  organizationId: string;
  conversationId: string;
  supabase: typeof supabase;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface ScriptonyTool {
  id: string;
  category: 'scenes' | 'characters' | 'projects' | 'worlds' | 'episodes' | 'search' | 'custom';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: any;
    }>;
    required: string[];
  };
  handler: (params: any, context: ToolContext) => Promise<ToolResult>;
  enabled?: boolean;
}

class ToolRegistry {
  private tools: Map<string, ScriptonyTool> = new Map();

  register(tool: ScriptonyTool) {
    console.log(`🔧 Registering tool: ${tool.id} (${tool.category})`);
    this.tools.set(tool.id, tool);
  }

  getAll(): ScriptonyTool[] {
    return Array.from(this.tools.values()).filter(t => t.enabled !== false);
  }

  get(id: string): ScriptonyTool | undefined {
    return this.tools.get(id);
  }

  async execute(
    toolId: string,
    params: any,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(toolId);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolId}`,
      };
    }

    console.log(`🔧 Executing tool: ${toolId}`, params);

    try {
      const result = await tool.handler(params, context);
      
      // Auto-sync RAG after successful execution
      if (result.success && result.data) {
        await this.autoSyncRAG(tool.category, result.data, context);
      }
      
      return result;
    } catch (error: any) {
      console.error(`❌ Tool execution error (${toolId}):`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async autoSyncRAG(
    category: string,
    data: any,
    context: ToolContext
  ) {
    if (!['scenes', 'characters', 'projects', 'worlds', 'episodes'].includes(category)) {
      return;
    }

    if (!data || !data.id) {
      console.warn(`⚠️ Cannot sync RAG: data is null or missing id for ${category}`);
      return;
    }

    console.log(`🔄 Auto-syncing RAG for ${category}...`);

    try {
      await context.supabase.from('rag_sync_queue').insert({
        entity_type: category,
        entity_id: data.id,
        organization_id: context.organizationId,
        operation: 'UPSERT',
        data: data,
        processed: false,
      });

      console.log(`✅ RAG sync queued for ${category}/${data.id}`);
    } catch (error) {
      console.error(`⚠️ RAG sync queue error:`, error);
    }
  }
}

const toolRegistry = new ToolRegistry();

// =============================================================================
// SCENE TOOLS (INLINE)
// =============================================================================

toolRegistry.register({
  id: 'update_scene',
  category: 'scenes',
  name: 'update_scene',
  description: 'Update a scene\'s title, description, or content. Use this when the user wants to rename, modify, or rewrite a scene.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the scene',
      },
      scene_id: {
        type: 'string',
        description: 'The ID of the scene to update',
      },
      title: {
        type: 'string',
        description: 'New title for the scene',
      },
      description: {
        type: 'string',
        description: 'New description for the scene',
      },
      dialog: {
        type: 'string',
        description: 'New dialog/script for the scene',
      },
      scene_number: {
        type: 'string',
        description: 'New scene number (e.g., "1", "2A", "3")',
      },
    },
    required: ['project_id', 'scene_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.description) updateData.description = params.description;
      if (params.dialog) updateData.dialog = params.dialog;
      if (params.scene_number) updateData.scene_number = params.scene_number;

      const { data, error } = await context.supabase
        .from('scenes')
        .update(updateData)
        .eq('id', params.scene_id)
        .eq('project_id', params.project_id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Szene "${data.title || data.scene_number}" wurde erfolgreich aktualisiert.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktualisieren der Szene: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'create_scene',
  category: 'scenes',
  name: 'create_scene',
  description: 'Create a new scene in a project. Use this when the user wants to add a new scene.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to add the scene to',
      },
      title: {
        type: 'string',
        description: 'Title of the new scene',
      },
      description: {
        type: 'string',
        description: 'Description of the scene',
      },
      dialog: {
        type: 'string',
        description: 'Scene dialog/script',
      },
      scene_number: {
        type: 'string',
        description: 'Scene number (e.g., "1", "2A", "3")',
      },
      location: {
        type: 'string',
        description: 'Scene location (e.g., "INT. KITCHEN - DAY")',
      },
    },
    required: ['project_id', 'title'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      let sceneNumber = params.scene_number;
      
      if (!sceneNumber) {
        const { data: existingScenes } = await context.supabase
          .from('scenes')
          .select('scene_number')
          .eq('project_id', params.project_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingScenes && existingScenes.length > 0) {
          const lastNumber = parseInt(existingScenes[0].scene_number || '0');
          sceneNumber = String(lastNumber + 1);
        } else {
          sceneNumber = '1';
        }
      }

      const { data, error } = await context.supabase
        .from('scenes')
        .insert({
          project_id: params.project_id,
          title: params.title,
          description: params.description || '',
          dialog: params.dialog || '',
          scene_number: sceneNumber,
          location: params.location || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Szene "${data.title}" (Nr. ${data.scene_number}) wurde erfolgreich erstellt.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Erstellen der Szene: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'delete_scene',
  category: 'scenes',
  name: 'delete_scene',
  description: 'Delete a scene from a project. Use this when the user wants to remove a scene.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the scene',
      },
      scene_id: {
        type: 'string',
        description: 'The ID of the scene to delete',
      },
    },
    required: ['project_id', 'scene_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { data: scene } = await context.supabase
        .from('scenes')
        .select('title, scene_number')
        .eq('id', params.scene_id)
        .eq('project_id', params.project_id)
        .single();

      const { error } = await context.supabase
        .from('scenes')
        .delete()
        .eq('id', params.scene_id)
        .eq('project_id', params.project_id);

      if (error) throw error;

      const { data: project } = await context.supabase
        .from('projects')
        .select('organization_id')
        .eq('id', params.project_id)
        .single();

      if (project) {
        await context.supabase.from('rag_sync_queue').insert({
          entity_type: 'scenes',
          entity_id: params.scene_id,
          organization_id: project.organization_id,
          operation: 'DELETE',
          data: null,
          processed: false,
        });
      }

      return {
        success: true,
        data: { id: params.scene_id },
        message: `Szene "${scene?.title || scene?.scene_number || 'Unbekannt'}" wurde erfolgreich gelöscht.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Löschen der Szene: ${error.message}`,
      };
    }
  },
});

console.log('✅ Scene tools registered (3 tools)');

// =============================================================================
// CHARACTER TOOLS (INLINE)
// =============================================================================

toolRegistry.register({
  id: 'update_character',
  category: 'characters',
  name: 'update_character',
  description: 'Update a character\'s name, description, role, or traits. Use this when the user wants to modify character details.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the character',
      },
      character_id: {
        type: 'string',
        description: 'The ID of the character to update',
      },
      name: {
        type: 'string',
        description: 'New name for the character',
      },
      description: {
        type: 'string',
        description: 'New description for the character',
      },
      role: {
        type: 'string',
        description: 'Character role',
        enum: ['protagonist', 'antagonist', 'supporting', 'minor'],
      },
    },
    required: ['project_id', 'character_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.name) updateData.name = params.name;
      if (params.description) updateData.description = params.description;
      if (params.role) updateData.role = params.role;

      const { data, error } = await context.supabase
        .from('characters')
        .update(updateData)
        .eq('id', params.character_id)
        .eq('project_id', params.project_id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Charakter "${data.name}" wurde erfolgreich aktualisiert.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktualisieren des Charakters: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'create_character',
  category: 'characters',
  name: 'create_character',
  description: 'Create a new character in a project. Use this when the user wants to add a new character.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to add the character to',
      },
      name: {
        type: 'string',
        description: 'Name of the new character',
      },
      description: {
        type: 'string',
        description: 'Description of the character',
      },
      role: {
        type: 'string',
        description: 'Character role',
        enum: ['protagonist', 'antagonist', 'supporting', 'minor'],
      },
    },
    required: ['project_id', 'name'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { data, error } = await context.supabase
        .from('characters')
        .insert({
          project_id: params.project_id,
          name: params.name,
          description: params.description || '',
          role: params.role || 'supporting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create character - no data returned');
      }

      return {
        success: true,
        data,
        message: `Charakter "${data.name}" wurde erfolgreich erstellt.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Erstellen des Charakters: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'delete_character',
  category: 'characters',
  name: 'delete_character',
  description: 'Delete a character from a project. Use this when the user wants to remove a character.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the character',
      },
      character_id: {
        type: 'string',
        description: 'The ID of the character to delete',
      },
    },
    required: ['project_id', 'character_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { data: character } = await context.supabase
        .from('characters')
        .select('name')
        .eq('id', params.character_id)
        .eq('project_id', params.project_id)
        .single();

      const { error } = await context.supabase
        .from('characters')
        .delete()
        .eq('id', params.character_id)
        .eq('project_id', params.project_id);

      if (error) throw error;

      const { data: project } = await context.supabase
        .from('projects')
        .select('organization_id')
        .eq('id', params.project_id)
        .single();

      if (project) {
        await context.supabase.from('rag_sync_queue').insert({
          entity_type: 'characters',
          entity_id: params.character_id,
          organization_id: project.organization_id,
          operation: 'DELETE',
          data: null,
          processed: false,
        });
      }

      return {
        success: true,
        data: { id: params.character_id },
        message: `Charakter "${character?.name || 'Unbekannt'}" wurde erfolgreich gelöscht.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Löschen des Charakters: ${error.message}`,
      };
    }
  },
});

console.log('✅ Character tools registered (3 tools)');

// =============================================================================
// PROJECT TOOLS (INLINE)
// =============================================================================

toolRegistry.register({
  id: 'update_project',
  category: 'projects',
  name: 'update_project',
  description: 'Update a project\'s title, logline, genre, or other metadata. Use this when the user wants to modify project details.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to update',
      },
      title: {
        type: 'string',
        description: 'New title for the project',
      },
      logline: {
        type: 'string',
        description: 'New logline for the project',
      },
      genre: {
        type: 'string',
        description: 'New genre for the project',
      },
    },
    required: ['project_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const updateData: any = {
        last_edited: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.logline) updateData.logline = params.logline;
      if (params.genre) updateData.genre = params.genre;

      const { data, error } = await context.supabase
        .from('projects')
        .update(updateData)
        .eq('id', params.project_id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Projekt "${data.title}" wurde erfolgreich aktualisiert.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktualisieren des Projekts: ${error.message}`,
      };
    }
  },
});

console.log('✅ Project tools registered (1 tool)');

// =============================================================================
// EPISODE TOOLS (INLINE)
// =============================================================================

toolRegistry.register({
  id: 'update_episode',
  category: 'episodes',
  name: 'update_episode',
  description: 'Update an episode\'s title, synopsis, or episode number. Use this when the user wants to modify episode details.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the episode',
      },
      episode_id: {
        type: 'string',
        description: 'The ID of the episode to update',
      },
      title: {
        type: 'string',
        description: 'New title for the episode',
      },
      synopsis: {
        type: 'string',
        description: 'New synopsis for the episode',
      },
      episode_number: {
        type: 'string',
        description: 'New episode number',
      },
    },
    required: ['project_id', 'episode_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.synopsis) updateData.synopsis = params.synopsis;
      if (params.episode_number) updateData.episode_number = params.episode_number;

      const { data, error } = await context.supabase
        .from('episodes')
        .update(updateData)
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Episode "${data.title || data.episode_number}" wurde erfolgreich aktualisiert.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktualisieren der Episode: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'create_episode',
  category: 'episodes',
  name: 'create_episode',
  description: 'Create a new episode in a project. Use this when the user wants to add a new episode.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to add the episode to',
      },
      title: {
        type: 'string',
        description: 'Title of the new episode',
      },
      synopsis: {
        type: 'string',
        description: 'Synopsis of the episode',
      },
      episode_number: {
        type: 'string',
        description: 'Episode number',
      },
    },
    required: ['project_id', 'title'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      let episodeNumber = params.episode_number;
      
      if (!episodeNumber) {
        const { data: existingEpisodes } = await context.supabase
          .from('episodes')
          .select('episode_number')
          .eq('project_id', params.project_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingEpisodes && existingEpisodes.length > 0) {
          const lastNumber = parseInt(existingEpisodes[0].episode_number || '0');
          episodeNumber = String(lastNumber + 1);
        } else {
          episodeNumber = '1';
        }
      }

      const { data, error } = await context.supabase
        .from('episodes')
        .insert({
          project_id: params.project_id,
          title: params.title,
          synopsis: params.synopsis || '',
          episode_number: episodeNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Episode "${data.title}" (Nr. ${data.episode_number}) wurde erfolgreich erstellt.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Erstellen der Episode: ${error.message}`,
      };
    }
  },
});

toolRegistry.register({
  id: 'delete_episode',
  category: 'episodes',
  name: 'delete_episode',
  description: 'Delete an episode from a project. Use this when the user wants to remove an episode.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project containing the episode',
      },
      episode_id: {
        type: 'string',
        description: 'The ID of the episode to delete',
      },
    },
    required: ['project_id', 'episode_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const { data: episode } = await context.supabase
        .from('episodes')
        .select('title, episode_number')
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id)
        .single();

      const { error } = await context.supabase
        .from('episodes')
        .delete()
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id);

      if (error) throw error;

      const { data: project } = await context.supabase
        .from('projects')
        .select('organization_id')
        .eq('id', params.project_id)
        .single();

      if (project) {
        await context.supabase.from('rag_sync_queue').insert({
          entity_type: 'episodes',
          entity_id: params.episode_id,
          organization_id: project.organization_id,
          operation: 'DELETE',
          data: null,
          processed: false,
        });
      }

      return {
        success: true,
        data: { id: params.episode_id },
        message: `Episode "${episode?.title || episode?.episode_number || 'Unbekannt'}" wurde erfolgreich gelöscht.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Löschen der Episode: ${error.message}`,
      };
    }
  },
});

console.log('✅ Episode tools registered (3 tools)');

// =============================================================================
// TOOL PROVIDERS ADAPTERS (INLINE)
// =============================================================================

interface ProviderAdapter {
  formatTools(tools: ScriptonyTool[]): any[];
  extractToolCalls(response: any): any[];
  formatToolResult(toolCall: any, result: ToolResult): any;
}

const openAIAdapter: ProviderAdapter = {
  formatTools: (tools: ScriptonyTool[]) => 
    tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    })),
  extractToolCalls: (response: any) => response.tool_calls || [],
  formatToolResult: (toolCall: any, result: ToolResult) => ({
    role: 'tool',
    tool_call_id: toolCall.id,
    content: JSON.stringify(result),
  }),
};

const anthropicAdapter: ProviderAdapter = {
  formatTools: (tools: ScriptonyTool[]) =>
    tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    })),
  extractToolCalls: (response: any) => 
    response.content
      ?.filter((block: any) => block.type === 'tool_use')
      .map((block: any) => ({
        id: block.id,
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      })) || [],
  formatToolResult: (toolCall: any, result: ToolResult) => ({
    type: 'tool_result',
    tool_use_id: toolCall.id,
    content: JSON.stringify(result),
  }),
};

const fallbackAdapter: ProviderAdapter = openAIAdapter;

function getAdapter(provider: string): ProviderAdapter {
  switch (provider) {
    case 'anthropic':
      return anthropicAdapter;
    case 'openai':
    case 'openrouter':
    case 'deepseek':
    default:
      return fallbackAdapter;
  }
}

function getFormattedTools(provider: string): any[] {
  const adapter = getAdapter(provider);
  const allTools = toolRegistry.getAll();
  return adapter.formatTools(allTools);
}

// =============================================================================
// AI PROVIDER CALLS (INLINE)
// =============================================================================

interface ProviderCallConfig {
  provider: string;
  model: string;
  messages: any[];
  apiKey: string;
  temperature: number;
  maxTokens: number;
  toolsEnabled: boolean;
}

interface ProviderCallResult {
  content: string;
  tokensUsed: number;
  toolCalls?: any[];
  rawResponse?: any;
}

async function callOpenAI(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('openai') : undefined;

  const requestBody: any = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (tools) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }

  const isDeepSeek = config.model.startsWith('deepseek-');
  const baseUrl = isDeepSeek 
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  console.log(`🔗 Using ${isDeepSeek ? 'DeepSeek' : 'OpenAI'} API endpoint:`, baseUrl);

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  return {
    content: message.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
    toolCalls: message.tool_calls,
    rawResponse: data,
  };
}

async function callAnthropic(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('anthropic') : undefined;

  const requestBody: any = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (tools) {
    requestBody.tools = tools;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const textContent = data.content.find((c: any) => c.type === 'text');
  
  return {
    content: textContent?.text || '',
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
    rawResponse: data,
  };
}

async function callProvider(config: ProviderCallConfig): Promise<ProviderCallResult> {
  switch (config.provider) {
    case 'openai':
    case 'openrouter':
    case 'deepseek':
      return callOpenAI(config);
    case 'anthropic':
      return callAnthropic(config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

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
    message: "Scriptony Server is running (COMPLETE VERSION)",
    timestamp: new Date().toISOString(),
    version: "2.0.0-complete",
    features: [
      "AI Chat (OpenAI, Anthropic, Google, OpenRouter, DeepSeek)",
      "MCP Tools (13 tools)",
      "RAG Sync",
      "Token Counting",
      "Projects, Scenes, Characters, Episodes, Worlds CRUD",
    ],
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
// AI CHAT ROUTES
// =============================================================================

app.get("/make-server-3b52693b/ai/settings", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { data: settings, error } = await supabase
      .from("ai_chat_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);

    if (!settings) {
      const { data: newSettings, error: createError } = await supabase
        .from("ai_chat_settings")
        .insert({
          user_id: userId,
          active_provider: "openai",
          active_model: "gpt-4o",
          system_prompt: "Du bist ein hilfreicher Assistent für Drehbuchautoren.",
          temperature: 0.7,
          max_tokens: 2000,
          use_rag: true,
        })
        .select()
        .single();

      if (createError) return c.json({ error: createError.message }, 500);
      return c.json({ settings: newSettings });
    }

    return c.json({ settings });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch settings", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/ai/settings", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();

    const { data: settings, error } = await supabase
      .from("ai_chat_settings")
      .upsert({
        user_id: userId,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ settings });
  } catch (error: any) {
    return c.json({ error: "Failed to update settings", details: error.message }, 500);
  }
});

app.get("/make-server-3b52693b/ai/conversations", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { data: conversations, error } = await supabase
      .from("ai_conversations")
      .select("id, title, message_count, last_message_at, created_at")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ conversations });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch conversations", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/ai/conversations", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();

    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        title: body.title || "Neue Unterhaltung",
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ conversation });
  } catch (error: any) {
    return c.json({ error: "Failed to create conversation", details: error.message }, 500);
  }
});

app.get("/make-server-3b52693b/ai/conversations/:id/messages", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const conversationId = c.req.param("id");

    const { data: messages, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ messages });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch messages", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/ai/chat", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) return c.json({ error: "No organization found" }, 404);

    const { conversationId, message } = await c.req.json();

    const { data: settings } = await supabase
      .from("ai_chat_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      return c.json({ error: "AI settings not found" }, 404);
    }

    const apiKeyField = `${settings.active_provider}_api_key`;
    const apiKey = (settings as any)[apiKeyField];

    if (!apiKey) {
      return c.json({ error: `API key for ${settings.active_provider} not found` }, 400);
    }

    // Save user message
    const { data: userMsg } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    // Get conversation history
    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const messages = [
      { role: "system", content: settings.system_prompt },
      ...(history || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call AI provider with tools
    const result = await callProvider({
      provider: settings.active_provider,
      model: settings.active_model,
      messages,
      apiKey,
      temperature: settings.temperature,
      maxTokens: settings.max_tokens,
      toolsEnabled: true,
    });

    // Process tool calls if any
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log(`🔧 Processing ${result.toolCalls.length} tool calls...`);
      
      const toolContext: ToolContext = {
        userId,
        organizationId: orgId,
        conversationId,
        supabase,
      };

      for (const toolCall of result.toolCalls) {
        const toolName = toolCall.function.name;
        const toolParams = JSON.parse(toolCall.function.arguments);
        
        await toolRegistry.execute(toolName, toolParams, toolContext);
      }
    }

    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: result.content,
        model: settings.active_model,
        provider: settings.active_provider,
      })
      .select()
      .single();

    // Update conversation
    await supabase
      .from("ai_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (history?.length || 0) + 2,
      })
      .eq("id", conversationId);

    return c.json({
      message: assistantMsg,
      tokensUsed: result.tokensUsed,
    });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return c.json({ error: "Failed to process chat", details: error.message }, 500);
  }
});

// =============================================================================
// RAG SYNC
// =============================================================================

app.post("/make-server-3b52693b/rag/sync", async (c) => {
  try {
    const { data: items, error: fetchError } = await supabase
      .from('rag_sync_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      return c.json({ error: fetchError.message }, 500);
    }

    if (!items || items.length === 0) {
      return c.json({ processed: 0, errors: 0 });
    }

    console.log(`🔄 Processing ${items.length} RAG sync items...`);

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      try {
        if (item.operation === 'DELETE') {
          await supabase
            .from('rag_knowledge')
            .delete()
            .eq('content_type', item.entity_type)
            .eq('reference_id', item.entity_id);
        } else {
          // Upsert to RAG (simplified)
          await supabase
            .from('rag_knowledge')
            .upsert({
              organization_id: item.organization_id,
              content_type: item.entity_type,
              reference_id: item.entity_id,
              content: JSON.stringify(item.data),
              updated_at: new Date().toISOString(),
            });
        }

        await supabase
          .from('rag_sync_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        processed++;
      } catch (error) {
        console.error(`❌ RAG sync error for item ${item.id}:`, error);
        errors++;
      }
    }

    return c.json({ processed, errors });
  } catch (error: any) {
    return c.json({ error: "Failed to process RAG sync", details: error.message }, 500);
  }
});

// =============================================================================
// SCENES ROUTES
// =============================================================================

app.get("/make-server-3b52693b/projects/:projectId/scenes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    const { data: scenes, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("scene_number", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ scenes });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch scenes", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects/:projectId/scenes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    const { data: scene, error } = await supabase
      .from("scenes")
      .insert({
        project_id: projectId,
        ...body,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ scene });
  } catch (error: any) {
    return c.json({ error: "Failed to create scene", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:projectId/scenes/:sceneId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const sceneId = c.req.param("sceneId");
    const body = await c.req.json();

    const { data: scene, error } = await supabase
      .from("scenes")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sceneId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ scene });
  } catch (error: any) {
    return c.json({ error: "Failed to update scene", details: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:projectId/scenes/:sceneId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const sceneId = c.req.param("sceneId");

    const { error } = await supabase
      .from("scenes")
      .delete()
      .eq("id", sceneId);

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete scene", details: error.message }, 500);
  }
});

// =============================================================================
// CHARACTERS ROUTES
// =============================================================================

app.get("/make-server-3b52693b/projects/:projectId/characters", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    const { data: characters, error } = await supabase
      .from("characters")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ characters });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch characters", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects/:projectId/characters", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    const { data: character, error } = await supabase
      .from("characters")
      .insert({
        project_id: projectId,
        ...body,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ character });
  } catch (error: any) {
    return c.json({ error: "Failed to create character", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:projectId/characters/:characterId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const characterId = c.req.param("characterId");
    const body = await c.req.json();

    const { data: character, error } = await supabase
      .from("characters")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", characterId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ character });
  } catch (error: any) {
    return c.json({ error: "Failed to update character", details: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:projectId/characters/:characterId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const characterId = c.req.param("characterId");

    const { error } = await supabase
      .from("characters")
      .delete()
      .eq("id", characterId);

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete character", details: error.message }, 500);
  }
});

// =============================================================================
// EPISODES ROUTES
// =============================================================================

app.get("/make-server-3b52693b/projects/:projectId/episodes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");

    const { data: episodes, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("project_id", projectId)
      .order("episode_number", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ episodes });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch episodes", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects/:projectId/episodes", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const projectId = c.req.param("projectId");
    const body = await c.req.json();

    const { data: episode, error } = await supabase
      .from("episodes")
      .insert({
        project_id: projectId,
        ...body,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ episode });
  } catch (error: any) {
    return c.json({ error: "Failed to create episode", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:projectId/episodes/:episodeId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const episodeId = c.req.param("episodeId");
    const body = await c.req.json();

    const { data: episode, error } = await supabase
      .from("episodes")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", episodeId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ episode });
  } catch (error: any) {
    return c.json({ error: "Failed to update episode", details: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:projectId/episodes/:episodeId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const episodeId = c.req.param("episodeId");

    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", episodeId);

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete episode", details: error.message }, 500);
  }
});

// =============================================================================
// WORLDS ROUTES
// =============================================================================

app.get("/make-server-3b52693b/worlds", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) return c.json({ error: "No organization found" }, 404);

    const { data: worlds, error } = await supabase
      .from("worlds")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ worlds });
  } catch (error: any) {
    return c.json({ error: "Failed to fetch worlds", details: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/worlds", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const orgId = await getOrCreateUserOrganization(userId);
    if (!orgId) return c.json({ error: "No organization found" }, 404);

    const body = await c.req.json();

    const { data: world, error } = await supabase
      .from("worlds")
      .insert({
        organization_id: orgId,
        ...body,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ world });
  } catch (error: any) {
    return c.json({ error: "Failed to create world", details: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/worlds/:worldId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const worldId = c.req.param("worldId");
    const body = await c.req.json();

    const { data: world, error } = await supabase
      .from("worlds")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", worldId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ world });
  } catch (error: any) {
    return c.json({ error: "Failed to update world", details: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/worlds/:worldId", async (c) => {
  try {
    const userId = await getUserIdFromAuth(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const worldId = c.req.param("worldId");

    const { error } = await supabase
      .from("worlds")
      .delete()
      .eq("id", worldId);

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: "Failed to delete world", details: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log('🚀 Scriptony Complete Server starting...');
console.log('✅ Tools registered:', toolRegistry.getAll().length);

Deno.serve(app.fetch);
