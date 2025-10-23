/**
 * 🎬 SCENE MANAGEMENT TOOLS
 * 
 * Tools for AI to manage scenes:
 * - update_scene
 * - create_scene
 * - delete_scene
 */

import { createTool } from './tools-registry.tsx';
import type { ToolContext, ToolResult } from './tools-registry.tsx';

// ==================== UPDATE SCENE ====================

createTool({
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
      // Build update object (only include provided fields)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.description) updateData.description = params.description;
      if (params.dialog) updateData.dialog = params.dialog;
      if (params.scene_number) updateData.scene_number = params.scene_number;

      // Update scene
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

// ==================== CREATE SCENE ====================

createTool({
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
      // Get next scene number if not provided
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

      // Create scene
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

// ==================== DELETE SCENE ====================

createTool({
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
      // Get scene info before deleting
      const { data: scene } = await context.supabase
        .from('scenes')
        .select('title, scene_number')
        .eq('id', params.scene_id)
        .eq('project_id', params.project_id)
        .single();

      // Delete scene
      const { error } = await context.supabase
        .from('scenes')
        .delete()
        .eq('id', params.scene_id)
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
