/**
 * 📁 PROJECT & WORLD MANAGEMENT TOOLS
 * 
 * Tools for AI to manage projects and worlds:
 * - create_project
 * - update_project
 * - update_world_item
 * - search_project
 */

import { createTool } from './tools-registry.tsx';
import type { ToolContext, ToolResult } from './tools-registry.tsx';

// ==================== CREATE PROJECT ====================

createTool({
  id: 'create_project',
  category: 'projects',
  name: 'create_project',
  description: 'Create a new project (film, series, audio, etc.). Use this when the user wants to start a new project.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Title of the new project',
      },
      type: {
        type: 'string',
        description: 'Project type',
        enum: ['film', 'series', 'short', 'theater', 'audio', 'book', 'social'],
      },
      logline: {
        type: 'string',
        description: 'Short logline/synopsis of the project',
      },
      genre: {
        type: 'string',
        description: 'Genre (e.g., "Drama", "Thriller", "Comedy")',
      },
      duration: {
        type: 'string',
        description: 'Duration (e.g., "90 Min" for film, "8x45 Min" for series)',
      },
      world_id: {
        type: 'string',
        description: 'Optional: Link project to an existing world',
      },
    },
    required: ['title', 'type'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Create project
      const { data, error } = await context.supabase
        .from('projects')
        .insert({
          organization_id: context.organizationId,
          title: params.title,
          type: params.type,
          logline: params.logline || '',
          genre: params.genre || '',
          duration: params.duration || '',
          world_id: params.world_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_edited: new Date().toISOString(),
          is_deleted: false,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create project - no data returned');
      }

      return {
        success: true,
        data,
        message: `Projekt "${data.title}" (${data.type}) wurde erfolgreich erstellt.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Erstellen des Projekts: ${error.message}`,
      };
    }
  },
});

// ==================== UPDATE PROJECT ====================

createTool({
  id: 'update_project',
  category: 'projects',
  name: 'update_project',
  description: 'Update project metadata like title, logline, genre, or duration. Use this when the user wants to modify project details.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to update',
      },
      title: {
        type: 'string',
        description: 'New project title',
      },
      logline: {
        type: 'string',
        description: 'New logline/synopsis',
      },
      genre: {
        type: 'string',
        description: 'New genre',
      },
      duration: {
        type: 'string',
        description: 'New duration (e.g., "90 Min", "6x45 Min")',
      },
      type: {
        type: 'string',
        description: 'Project type',
        enum: ['Movie', 'Series', 'Audio'],
      },
    },
    required: ['project_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.title) updateData.title = params.title;
      if (params.logline) updateData.logline = params.logline;
      if (params.genre) updateData.genre = params.genre;
      if (params.duration) updateData.duration = params.duration;
      if (params.type) updateData.type = params.type;

      // Update project
      const { data, error } = await context.supabase
        .from('projects')
        .update(updateData)
        .eq('id', params.project_id)
        .eq('organization_id', context.organizationId)
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

// ==================== UPDATE WORLD ITEM ====================

createTool({
  id: 'update_world_item',
  category: 'worlds',
  name: 'update_world_item',
  description: 'Update a world asset/item (location, object, culture, etc.). Use this when the user wants to modify worldbuilding elements.',
  parameters: {
    type: 'object',
    properties: {
      world_id: {
        type: 'string',
        description: 'The ID of the world containing the item',
      },
      item_id: {
        type: 'string',
        description: 'The ID of the world item to update',
      },
      name: {
        type: 'string',
        description: 'New name for the item',
      },
      description: {
        type: 'string',
        description: 'New description for the item',
      },
    },
    required: ['world_id', 'item_id'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (params.name) updateData.name = params.name;
      if (params.description) updateData.description = params.description;

      // Update world item
      const { data, error } = await context.supabase
        .from('world_items')
        .update(updateData)
        .eq('id', params.item_id)
        .eq('world_id', params.world_id)
        .eq('organization_id', context.organizationId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: `Welt-Element "${data.name}" wurde erfolgreich aktualisiert.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler beim Aktualisieren des Welt-Elements: ${error.message}`,
      };
    }
  },
});

// ==================== SEARCH PROJECT ====================

createTool({
  id: 'search_project',
  category: 'search',
  name: 'search_project',
  description: 'Search through project data (scenes, characters, episodes). Use this to find specific information in a project.',
  parameters: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        description: 'The ID of the project to search',
      },
      query: {
        type: 'string',
        description: 'Search query',
      },
      type: {
        type: 'string',
        description: 'Type of data to search',
        enum: ['scenes', 'characters', 'episodes', 'all'],
      },
    },
    required: ['project_id', 'query'],
  },
  handler: async (params, context: ToolContext): Promise<ToolResult> => {
    try {
      const searchType = params.type || 'all';
      const results: any = {
        scenes: [],
        characters: [],
        episodes: [],
      };

      // Search scenes
      if (searchType === 'all' || searchType === 'scenes') {
        const { data: scenes } = await context.supabase
          .from('scenes')
          .select('*')
          .eq('project_id', params.project_id)
          .eq('organization_id', context.organizationId)
          .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%,content.ilike.%${params.query}%`)
          .limit(10);

        if (scenes) results.scenes = scenes;
      }

      // Search characters
      if (searchType === 'all' || searchType === 'characters') {
        const { data: characters } = await context.supabase
          .from('characters')
          .select('*')
          .eq('project_id', params.project_id)
          .eq('organization_id', context.organizationId)
          .or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
          .limit(10);

        if (characters) results.characters = characters;
      }

      // Search episodes (for series)
      if (searchType === 'all' || searchType === 'episodes') {
        const { data: episodes } = await context.supabase
          .from('episodes')
          .select('*')
          .eq('project_id', params.project_id)
          .eq('organization_id', context.organizationId)
          .or(`title.ilike.%${params.query}%,synopsis.ilike.%${params.query}%`)
          .limit(10);

        if (episodes) results.episodes = episodes;
      }

      const totalResults = 
        results.scenes.length +
        results.characters.length +
        results.episodes.length;

      return {
        success: true,
        data: results,
        message: `${totalResults} Ergebnisse gefunden für "${params.query}".`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Fehler bei der Suche: ${error.message}`,
      };
    }
  },
});

console.log('✅ Project & World tools registered (4 tools)');
