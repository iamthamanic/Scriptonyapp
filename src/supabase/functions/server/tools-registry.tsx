/**
 * 🔧 SCRIPTONY UNIVERSAL TOOL REGISTRY
 * 
 * Erweiterbare Tool-Registry für AI Function Calling
 * - Automatische Tool-Discovery
 * - Provider-Agnostic Format
 * - Plugin-basierte Architektur
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.3';

// ==================== TYPES ====================

/**
 * Universal Tool Definition (Provider-Agnostic)
 */
export interface ScriptonyTool {
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
  enabled?: boolean; // Allow disabling specific tools
}

/**
 * Tool Execution Context
 */
export interface ToolContext {
  userId: string;
  organizationId: string;
  conversationId: string;
  supabase: SupabaseClient;
}

/**
 * Tool Execution Result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string; // User-friendly message
}

// ==================== TOOL REGISTRY ====================

/**
 * Global Tool Registry
 * - Tools register themselves on import
 * - Centralized management
 */
class ToolRegistry {
  private tools: Map<string, ScriptonyTool> = new Map();

  /**
   * Register a tool
   */
  register(tool: ScriptonyTool) {
    console.log(`🔧 Registering tool: ${tool.id} (${tool.category})`);
    this.tools.set(tool.id, tool);
  }

  /**
   * Get all enabled tools
   */
  getAll(): ScriptonyTool[] {
    return Array.from(this.tools.values()).filter(t => t.enabled !== false);
  }

  /**
   * Get tool by ID
   */
  get(id: string): ScriptonyTool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ScriptonyTool[] {
    return this.getAll().filter(t => t.category === category);
  }

  /**
   * Execute a tool
   */
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

  /**
   * Auto-sync RAG after tool execution
   */
  private async autoSyncRAG(
    category: string,
    data: any,
    context: ToolContext
  ) {
    // Only sync for data-modifying operations
    if (!['scenes', 'characters', 'projects', 'worlds', 'episodes'].includes(category)) {
      return;
    }

    // Safety check: data must exist and have an id
    if (!data || !data.id) {
      console.warn(`⚠️ Cannot sync RAG: data is null or missing id for ${category}`);
      return;
    }

    console.log(`🔄 Auto-syncing RAG for ${category}...`);

    try {
      // Insert into sync queue (will be processed by background worker)
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
      // Don't fail the main operation if RAG sync fails
    }
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a tool registration helper
 */
export function createTool(tool: ScriptonyTool): ScriptonyTool {
  toolRegistry.register(tool);
  return tool;
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParams(
  params: any,
  schema: ScriptonyTool['parameters']
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required parameters
  for (const required of schema.required) {
    if (!(required in params)) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }

  // Basic type checking
  for (const [key, value] of Object.entries(params)) {
    const propSchema = schema.properties[key];
    if (!propSchema) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== propSchema.type) {
      errors.push(`Parameter ${key} must be ${propSchema.type}, got ${actualType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
