/**
 * 📺 EPISODE MANAGEMENT TOOLS
 * 
 * Tools for AI to manage episodes (for series projects):
 * - create_episode
 * - update_episode
 * - delete_episode
 */

import { createTool } from './tools-registry.tsx';
import type { ToolContext, ToolResult } from './tools-registry.tsx';

// ==================== CREATE EPISODE ====================

createTool({
  id: 'create_episode',
  category: 'episodes',
  name: 'create_episode',
  description: 'Create a new episode in a series project. Use this when the user wants to add episodes to a series.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the series project',
      },
      title: {
        type: 'string',
        description: 'Title of the episode',
      },
      number: {
        type: 'number',
        description: 'Episode number (e.g., 1, 2, 3)',
      },
      description: {
        type: 'string',
        description: 'Episode description/synopsis',
      },
    },
    required: ['project_id', 'title'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Get next episode number if not provided
      let episodeNumber = params.number;
      
      if (!episodeNumber) {
        const { data: existingEpisodes } = await context.supabase
          .from('episodes')
          .select('number')
          .eq('project_id', params.project_id)
          .order('number', { ascending: false })
          .limit(1);

        if (existingEpisodes && existingEpisodes.length > 0) {
          episodeNumber = existingEpisodes[0].number + 1;
        } else {
          episodeNumber = 1;
        }
      }

      // Create episode
      const { data, error } = await context.supabase
        .from('episodes')
        .insert({
          project_id: params.project_id,
          title: params.title,
          number: episodeNumber,
          description: params.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create episode - no data returned');
      }

      return {
        success: true,
        data,
        message: `Episode ${data.number}: "${data.title}" wurde erfolgreich erstellt.`,
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

// ==================== UPDATE EPISODE ====================

createTool({
  id: 'update_episode',
  category: 'episodes',
  name: 'update_episode',
  description: 'Update an episode\'s title, number, or description. Use this when the user wants to modify episode details.',
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
      number: {
        type: 'number',
        description: 'New episode number',
      },
      description: {
        type: 'string',
        description: 'New description for the episode',
      },
    },
    required: ['project_id', 'episode_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.number) updateData.number = params.number;
      if (params.description) updateData.description = params.description;

      // Update episode
      const { data, error } = await context.supabase
        .from('episodes')
        .update(updateData)
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to update episode - no data returned');
      }

      return {
        success: true,
        data,
        message: `Episode ${data.number}: "${data.title}" wurde erfolgreich aktualisiert.`,
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

// ==================== DELETE EPISODE ====================

createTool({
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
      // Get episode name before deleting
      const { data: episode } = await context.supabase
        .from('episodes')
        .select('title, number')
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id)
        .single();

      // Delete episode
      const { error } = await context.supabase
        .from('episodes')
        .delete()
        .eq('id', params.episode_id)
        .eq('project_id', params.project_id);

      if (error) throw error;

      const episodeName = episode ? `${episode.number}: "${episode.title}"` : params.episode_id;

      return {
        success: true,
        message: `Episode ${episodeName} wurde erfolgreich gelöscht.`,
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

console.log('✅ Episode tools loaded');
