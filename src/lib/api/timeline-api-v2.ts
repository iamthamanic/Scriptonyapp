/**
 * 🎬 TIMELINE API V2 - Generic Template Engine Client
 * 
 * API Client für die generische Timeline Engine.
 * Funktioniert mit ALLEN Templates (Film, Serie, Buch, Theater, Game, ...)
 */

import { projectId, publicAnonKey } from '../supabase/info';
import { getAuthToken } from '../auth/getAuthToken';

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
// BASE URL
// =============================================================================

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/scriptony-timeline-v2`;

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
  const token = await getAuthToken();
  
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

  const response = await fetch(`${BASE_URL}/nodes?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch nodes');
  }

  const data = await response.json();
  return data.nodes;
}

/**
 * Get single node by ID
 */
export async function getNode(nodeId: string): Promise<TimelineNode> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/${nodeId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch node');
  }

  const data = await response.json();
  return data.node;
}

/**
 * Get children of a node
 */
export async function getNodeChildren(
  nodeId: string, 
  recursive = false
): Promise<TimelineNode[]> {
  const token = await getAuthToken();
  
  const params = new URLSearchParams();
  if (recursive) {
    params.append('recursive', 'true');
  }

  const response = await fetch(`${BASE_URL}/nodes/${nodeId}/children?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch children');
  }

  const data = await response.json();
  return data.children;
}

/**
 * Get node path (from root to node)
 */
export async function getNodePath(nodeId: string): Promise<any[]> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/${nodeId}/path`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch path');
  }

  const data = await response.json();
  return data.path;
}

/**
 * Create new node
 */
export async function createNode(request: CreateNodeRequest): Promise<TimelineNode> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create node');
  }

  const data = await response.json();
  return data.node;
}

/**
 * Update node
 */
export async function updateNode(
  nodeId: string, 
  updates: UpdateNodeRequest
): Promise<TimelineNode> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/${nodeId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update node');
  }

  const data = await response.json();
  return data.node;
}

/**
 * Delete node
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/${nodeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete node');
  }
}

/**
 * Reorder nodes within parent
 */
export async function reorderNodes(nodeIds: string[]): Promise<void> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nodeIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reorder nodes');
  }
}

/**
 * Bulk create nodes
 */
export async function bulkCreateNodes(
  request: BulkCreateRequest
): Promise<TimelineNode[]> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/nodes/bulk`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to bulk create nodes');
  }

  const data = await response.json();
  return data.nodes;
}

/**
 * Initialize project structure based on template
 */
export async function initializeProject(
  request: InitializeProjectRequest
): Promise<TimelineNode[]> {
  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/initialize-project`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to initialize project');
  }

  const data = await response.json();
  return data.nodes;
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
