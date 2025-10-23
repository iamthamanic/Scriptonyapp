/**
 * 👤 CHARACTER MANAGEMENT TOOLS
 * 
 * Tools for AI to manage characters:
 * - update_character
 * - create_character
 * - delete_character
 */

import { createTool } from './tools-registry.tsx';
import type { ToolContext, ToolResult } from './tools-registry.tsx';

// ==================== UPDATE CHARACTER ====================

createTool({
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
      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.name) updateData.name = params.name;
      if (params.description) updateData.description = params.description;
      if (params.role) updateData.role = params.role;

      // Update character
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

// ==================== CREATE CHARACTER ====================

createTool({
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
      // Create character
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

// ==================== DELETE CHARACTER ====================

createTool({
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
      // Get character info before deleting
      const { data: character } = await context.supabase
        .from('characters')
        .select('name')
        .eq('id', params.character_id)
        .eq('project_id', params.project_id)
        .single();

      // Delete character
      const { error } = await context.supabase
        .from('characters')
        .delete()
        .eq('id', params.character_id)
        .eq('project_id', params.project_id);

      if (error) throw error;

      // Queue RAG deletion (get organization_id from project)
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
