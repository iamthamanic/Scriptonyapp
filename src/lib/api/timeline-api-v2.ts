/**
 * 🎬 TIMELINE API V2 - Generic Template Engine Client
 * 
 * 🚀 MIGRATED TO API GATEWAY
 * 
 * API Client für die generische Timeline Engine.
 * Funktioniert mit ALLEN Templates (Film, Serie, Buch, Theater, Game, ...)
 * 
 * Uses API Gateway for routing to scriptony-timeline-v2 function.
 */

import { apiGet, apiPost, apiPut, apiDelete, unwrapApiResult } from '../api-client';

// =============================================================================
// TYPES
// =============================================================================

export interface TimelineNode {
  id: string;
  projectId: string;
  templateId: string;
  level: 1 | 2 | 3 | 4;
  parentId: string | null;
  nodeNumber: number;
  title: string;
  description?: string;
  color?: string;
  orderIndex: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Populated by client
  children?: TimelineNode[];
}

export interface CreateNodeRequest {
  projectId: string;
  templateId: string;
  level: 1 | 2 | 3 | 4;
  parentId?: string | null;
  nodeNumber: number;
  title: string;
  description?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNodeRequest {
  nodeNumber?: number;
  title?: string;
  description?: string;
  color?: string;
  orderIndex?: number;
  metadata?: Record<string, any>;
  wordCount?: number; // 📊 For books: calculated word count from content
}

export interface BulkCreateRequest {
  nodes: CreateNodeRequest[];
}

export interface InitializeProjectRequest {
  projectId: string;
  templateId: string;
  structure: {
    level_1_count: number;
    level_2_per_parent?: number;
    level_3_per_parent?: number;
    level_4_per_parent?: number;
  };
  predefinedNodes?: {
    level_1?: Array<{ number: number; title: string; description?: string }>;
    level_2?: Array<{ number: number; title: string; description?: string }>;
    level_3?: Array<{ number: number; title: string; description?: string }>;
    level_4?: Array<{ number: number; title: string; description?: string }>;
  };
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Get nodes with filters
 */
export async function getNodes(filters: {
  projectId: string;
  level?: 1 | 2 | 3 | 4;
  parentId?: string | null;
  templateId?: string;
}): Promise<TimelineNode[]> {
  const params = new URLSearchParams({
    project_id: filters.projectId,
  });
  
  if (filters.level !== undefined) {
    params.append('level', filters.level.toString());
  }
  
  if (filters.parentId !== undefined) {
    params.append('parent_id', filters.parentId === null ? 'null' : filters.parentId);
  }
  
  if (filters.templateId) {
    params.append('template_id', filters.templateId);
  }

  const result = await apiGet(`/nodes?${params}`);
  const data = unwrapApiResult(result);
  return data?.nodes || [];
}

/**
 * Get single node by ID
 */
export async function getNode(nodeId: string): Promise<TimelineNode> {
  const result = await apiGet(`/nodes/${nodeId}`);
  const data = unwrapApiResult(result);
  return data?.node || data;
}

/**
 * Get children of a node
 */
export async function getNodeChildren(
  nodeId: string, 
  recursive = false
): Promise<TimelineNode[]> {
  const params = new URLSearchParams();
  if (recursive) {
    params.append('recursive', 'true');
  }

  const result = await apiGet(`/nodes/${nodeId}/children?${params}`);
  const data = unwrapApiResult(result);
  return data?.children || [];
}

/**
 * Get node path (from root to node)
 */
export async function getNodePath(nodeId: string): Promise<any[]> {
  const result = await apiGet(`/nodes/${nodeId}/path`);
  const data = unwrapApiResult(result);
  return data?.path || [];
}

/**
 * Create new node
 */
export async function createNode(request: CreateNodeRequest): Promise<TimelineNode> {
  console.log('[Timeline API V2] Creating node:', request);
  
  try {
    const result = await apiPost('/nodes', request);
    console.log('[Timeline API V2] Raw result:', result);
    const data = unwrapApiResult(result);
    console.log('[Timeline API V2] Node created successfully:', data);
    return data?.node || data;
  } catch (error) {
    console.error('[Timeline API V2] Error creating node:', {
      request,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Update node
 */
export async function updateNode(
  nodeId: string, 
  updates: UpdateNodeRequest
): Promise<TimelineNode> {
  const result = await apiPut(`/nodes/${nodeId}`, updates);
  const data = unwrapApiResult(result);
  return data?.node || data;
}

/**
 * Delete node
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const result = await apiDelete(`/nodes/${nodeId}`);
  unwrapApiResult(result);
}

/**
 * Reorder nodes within parent
 */
export async function reorderNodes(nodeIds: string[]): Promise<void> {
  const result = await apiPost('/nodes/reorder', { nodeIds });
  unwrapApiResult(result);
}

/**
 * Bulk create nodes
 */
export async function bulkCreateNodes(
  request: BulkCreateRequest
): Promise<TimelineNode[]> {
  const result = await apiPost('/nodes/bulk', request);
  const data = unwrapApiResult(result);
  return data?.nodes || [];
}

/**
 * Initialize project structure based on template
 */
export async function initializeProject(
  request: InitializeProjectRequest
): Promise<TimelineNode[]> {
  const result = await apiPost('/initialize-project', request);
  const data = unwrapApiResult(result);
  return data?.nodes || [];
}

/**
 * 🚀 ULTRA-FAST: Batch load all timeline data in ONE request
 * Loads acts, sequences, and scenes in a single API call
 * Performance: 3 requests → 1 request = 3x faster!
 */
export async function batchLoadTimeline(
  projectId: string,
  token: string
): Promise<{
  acts: TimelineNode[];
  sequences: TimelineNode[];
  scenes: TimelineNode[];
  stats: {
    totalNodes: number;
    acts: number;
    sequences: number;
    scenes: number;
  };
}> {
  console.log('[Timeline API V2] 🚀 Batch loading timeline:', projectId);
  const timerLabel = `[Timeline API V2] Batch Load ${projectId}`;
  console.time(timerLabel);
  
  const result = await apiGet(`/nodes/batch-load?project_id=${projectId}`, token);
  const data = unwrapApiResult(result);
  
  console.timeEnd(timerLabel);
  console.log('[Timeline API V2] Batch load stats:', data.stats);
  
  return {
    acts: data?.acts || [],
    sequences: data?.sequences || [],
    scenes: data?.scenes || [],
    stats: data?.stats || { totalNodes: 0, acts: 0, sequences: 0, scenes: 0 },
  };
}

// =============================================================================
// ULTRA BATCH LOAD - MAXIMUM PERFORMANCE 🚀🚀🚀
// =============================================================================

export async function ultraBatchLoadProject(
  projectId: string,
  token: string
): Promise<{
  timeline: {
    acts: TimelineNode[];
    sequences: TimelineNode[];
    scenes: TimelineNode[];
  };
  characters: any[];
  shots: any[];
  stats: {
    totalNodes: number;
    acts: number;
    sequences: number;
    scenes: number;
    characters: number;
    shots: number;
  };
}> {
  console.log('[Timeline API V2] 🚀🚀🚀 ULTRA BATCH loading project:', projectId);
  const timerLabel = `[Timeline API V2] ULTRA Batch Load ${projectId}`;
  console.time(timerLabel);
  
  const result = await apiGet(`/nodes/ultra-batch-load?project_id=${projectId}`, token);
  const data = unwrapApiResult(result);
  
  console.timeEnd(timerLabel);
  console.log('[Timeline API V2] ULTRA Batch load stats:', data.stats);
  
  return {
    timeline: {
      acts: data?.timeline?.acts || [],
      sequences: data?.timeline?.sequences || [],
      scenes: data?.timeline?.scenes || [],
    },
    characters: data?.characters || [],
    shots: data?.shots || [],
    stats: data?.stats || { 
      totalNodes: 0, 
      acts: 0, 
      sequences: 0, 
      scenes: 0,
      characters: 0,
      shots: 0,
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build hierarchical tree from flat node list
 */
export function buildNodeTree(nodes: TimelineNode[]): TimelineNode[] {
  const nodeMap = new Map<string, TimelineNode>();
  const rootNodes: TimelineNode[] = [];

  // Create map
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Build tree
  nodes.forEach(node => {
    const nodeWithChildren = nodeMap.get(node.id)!;
    
    if (node.parentId === null) {
      rootNodes.push(nodeWithChildren);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(nodeWithChildren);
      }
    }
  });

  return rootNodes;
}

/**
 * Flatten node tree to flat list
 */
export function flattenNodeTree(nodes: TimelineNode[]): TimelineNode[] {
  const result: TimelineNode[] = [];

  function traverse(node: TimelineNode) {
    result.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Get all nodes for a project (all levels)
 */
export async function getAllProjectNodes(
  projectId: string,
  templateId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId,
    templateId,
  });
}

/**
 * Get root nodes (level 1, no parent)
 */
export async function getRootNodes(
  projectId: string,
  templateId?: string
): Promise<TimelineNode[]> {
  return getNodes({
    projectId,
    level: 1,
    parentId: null,
    templateId,
  });
}

// =============================================================================
// TEMPLATE-SPECIFIC HELPERS
// =============================================================================

/**
 * Film: Get Acts
 */
export async function getActs(projectId: string): Promise<TimelineNode[]> {
  return getNodes({ projectId, level: 1 });
}

/**
 * Film: Get Sequences
 */
export async function getSequences(
  projectId: string,
  actId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 2,
    parentId: actId,
  });
}

/**
 * Film: Get Scenes
 */
export async function getScenes(
  projectId: string,
  sequenceId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 3,
    parentId: sequenceId,
  });
}

/**
 * Film: Get Shots
 */
export async function getShots(
  projectId: string,
  sceneId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 4,
    parentId: sceneId,
  });
}

/**
 * Serie: Get Seasons
 */
export async function getSeasons(projectId: string): Promise<TimelineNode[]> {
  return getNodes({ projectId, level: 1 });
}

/**
 * Serie: Get Episodes
 */
export async function getEpisodes(
  projectId: string,
  seasonId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 2,
    parentId: seasonId,
  });
}

/**
 * Buch: Get Parts
 */
export async function getParts(projectId: string): Promise<TimelineNode[]> {
  return getNodes({ projectId, level: 1 });
}

/**
 * Buch: Get Chapters
 */
export async function getChapters(
  projectId: string,
  partId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 2,
    parentId: partId,
  });
}

/**
 * Buch: Get Sections
 */
export async function getSections(
  projectId: string,
  chapterId?: string
): Promise<TimelineNode[]> {
  return getNodes({ 
    projectId, 
    level: 3,
    parentId: chapterId,
  });
}
