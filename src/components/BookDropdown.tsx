/**
 * 📚 BOOK DROPDOWN - Hierarchical Structure View for Books
 * 
 * Acts > Kapitel > Abschnitte (3-Level Structure)
 * Minimalistic inline editing with clean collapsed/expanded states
 * Drag & Drop: Within containers + Cross-container
 * Optimistic UI + Performance optimizations
 * 
 * Abschnitte have text content (like Shot dialog in films)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, MoreVertical, Copy, Edit, Info } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import { undoManager } from '../lib/undo-manager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { TimelineNodeStatsDialog } from './TimelineNodeStatsDialog';
import { RichTextEditorModal } from './RichTextEditorModal';
import { ReadonlyTiptapView } from './ReadonlyTiptapView';
import { useAuth } from '../hooks/useAuth';
import * as TimelineAPI from '../lib/api/timeline-api';
import * as TimelineAPIV2 from '../lib/api/timeline-api-v2';
import * as CharactersAPI from '../lib/api/characters-api';
import type { Act, Sequence, Scene, Character } from '../lib/types';
import { toast } from 'sonner';

// Timeline Cache Data Structure (no shots for books)
export interface BookTimelineData {
  acts: Act[];
  sequences: Sequence[]; // Kapitel
  scenes: Scene[]; // Abschnitte with text content
}

interface BookDropdownProps {
  projectId: string;
  projectType?: string; // 🎯 NEW: Project type for dynamic labels
  initialData?: BookTimelineData;
  onDataChange?: (data: BookTimelineData) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  // Controlled Collapse States for dynamic beat alignment
  expandedActs?: Set<string>;
  expandedSequences?: Set<string>;
  onExpandedActsChange?: (expanded: Set<string>) => void;
  onExpandedSequencesChange?: (expanded: Set<string>) => void;
}

// DnD Types
const ItemTypes = {
  ACT: 'act',
  SEQUENCE: 'sequence',
  SCENE: 'scene',
};

// =====================================================
// DROP ZONE (Einfügemarke zwischen Items)
// =====================================================

interface DropZoneProps {
  type: string;
  index: number;
  onDrop: (draggedItemId: string, targetIndex: number) => void;
  label: string;
  height?: 'act' | 'sequence' | 'scene';
}

function DropZone({ type, index, onDrop, label, height = 'act' }: DropZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: type,
    drop: (item: { id: string; index: number }) => {
      onDrop(item.id, index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const heightClass = {
    act: 'h-12',
    sequence: 'h-10',
    scene: 'h-8',
  }[height];

  return (
    <div
      ref={drop}
      className={cn(
        'transition-all duration-200',
        heightClass,
        isOver && canDrop && 'bg-violet-100 dark:bg-violet-900/20 border-2 border-dashed border-violet-400 rounded-md',
        !isOver && 'h-2'
      )}
    />
  );
}

// =====================================================
// DRAGGABLE ACT CARD
// =====================================================

interface DraggableActProps {
  act: Act;
  index: number;
  children: React.ReactNode;
  onStatsClick: () => void;
}

function DraggableAct({ act, index, children, onStatsClick }: DraggableActProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ACT,
    item: { id: act.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

// =====================================================
// DRAGGABLE SEQUENCE (KAPITEL) CARD
// =====================================================

interface DraggableSequenceProps {
  sequence: Sequence;
  index: number;
  children: React.ReactNode;
  onStatsClick: () => void;
}

function DraggableSequence({ sequence, index, children, onStatsClick }: DraggableSequenceProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SEQUENCE,
    item: { id: sequence.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

// =====================================================
// DRAGGABLE SCENE (ABSCHNITT) CARD
// =====================================================

interface DraggableSceneProps {
  scene: Scene;
  index: number;
  children: React.ReactNode;
  onStatsClick: () => void;
}

function DraggableScene({ scene, index, children, onStatsClick }: DraggableSceneProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SCENE,
    item: { id: scene.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function BookDropdown({ 
  projectId,
  projectType,
  initialData,
  onDataChange,
  containerRef,
  expandedActs: controlledExpandedActs,
  expandedSequences: controlledExpandedSequences,
  onExpandedActsChange,
  onExpandedSequencesChange,
}: BookDropdownProps) {
  const { getAccessToken } = useAuth();

  // State - Initialize with initialData if available
  const [acts, setActs] = useState<Act[]>(initialData?.acts || []);
  const [sequences, setSequences] = useState<Sequence[]>(initialData?.sequences || []);
  const [scenes, setScenes] = useState<Scene[]>(initialData?.scenes || []);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(!initialData);

  // Expand/Collapse State (controlled or internal)
  const [internalExpandedActs, setInternalExpandedActs] = useState<Set<string>>(new Set());
  const [internalExpandedSequences, setInternalExpandedSequences] = useState<Set<string>>(new Set());
  const [internalExpandedScenes, setInternalExpandedScenes] = useState<Set<string>>(new Set()); // 🔥 NEW: Scenes expand state
  
  const expandedActs = controlledExpandedActs ?? internalExpandedActs;
  const expandedSequences = controlledExpandedSequences ?? internalExpandedSequences;
  const expandedScenes = internalExpandedScenes; // Always internal for scenes
  
  const setExpandedActs = onExpandedActsChange ?? setInternalExpandedActs;
  const setExpandedSequences = onExpandedSequencesChange ?? setInternalExpandedSequences;
  const setExpandedScenes = setInternalExpandedScenes;

  // Edit State (for inline editing)
  const [editingAct, setEditingAct] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingSceneTitle, setEditingSceneTitle] = useState<string | null>(null); // 🔥 NEW: Separate title editing
  const [editValues, setEditValues] = useState<Record<string, { title?: string; description?: string; content?: string }>>({});

  // Stats Dialog State
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsNode, setStatsNode] = useState<{ type: 'act' | 'sequence' | 'scene'; data: any } | null>(null);

  // Rich Text Editor Modal State
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingSceneForModal, setEditingSceneForModal] = useState<Scene | null>(null);

  // 🔥 FIX: Use ref to track previous data and prevent infinite loops
  const previousDataRef = useRef<string>('');
  
  // 🔥 FIX: Debounced save for scene content
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of data changes (only when data actually changes)
  useEffect(() => {
    if (onDataChange && !loading) {
      const currentData = JSON.stringify({ acts, sequences, scenes });
      if (currentData !== previousDataRef.current) {
        previousDataRef.current = currentData;
        onDataChange({ acts, sequences, scenes });
      }
    }
  }, [acts, sequences, scenes, onDataChange, loading]);

  // Load timeline data
  useEffect(() => {
    if (!initialData) {
      loadTimeline();
    }
  }, [projectId]);

  // 🔥 Helper: Parse scene content if it's a JSON string
  const parseSceneContent = (scene: Scene): Scene => {
    if (scene.content && typeof scene.content === 'string') {
      try {
        const parsed = JSON.parse(scene.content);
        return { ...scene, content: parsed };
      } catch (e) {
        // Silent fail - content might be plain text or already parsed
        // Only log if it looks like it should be JSON (starts with { or [)
        if (scene.content.trim().startsWith('{') || scene.content.trim().startsWith('[')) {
          console.warn(`[BookDropdown] Could not parse JSON content for scene ${scene.id}`);
        }
        return scene;
      }
    }
    return scene;
  };

  const loadTimeline = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      setLoading(true);
      
      // Load Acts (Level 1)
      const loadedActs = await TimelineAPI.getActs(projectId, token);
      setActs(loadedActs);

      // Load all Sequences (Level 2) for this project
      const allSequences = await TimelineAPI.getAllSequencesByProject(projectId, token);
      setSequences(allSequences);

      // Load all Scenes (Level 3) for this project
      const allScenes = await TimelineAPI.getAllScenesByProject(projectId, token);
      const parsedScenes = allScenes.map(parseSceneContent);
      setScenes(parsedScenes);

      // 🔥 AUTO-EXPAND: Automatically expand first act and its sequences on initial load
      if (loadedActs.length > 0 && expandedActs.size === 0) {
        const firstActId = loadedActs[0].id;
        setExpandedActs(new Set([firstActId]));
        
        // Also expand all sequences of the first act
        const firstActSequences = allSequences.filter(s => s.actId === firstActId);
        if (firstActSequences.length > 0) {
          setExpandedSequences(new Set(firstActSequences.map(s => s.id)));
        }
      }

      // Load characters for @-mentions in content editor
      try {
        const projectCharacters = await CharactersAPI.getCharacters(projectId, token);
        console.log('[BookDropdown] Loaded characters for project:', projectId, projectCharacters);
        setCharacters(projectCharacters || []);
      } catch (error) {
        console.error('[BookDropdown] Error loading characters:', error);
        setCharacters([]);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      toast.error('Fehler beim Laden der Timeline');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ACT HANDLERS
  // =====================================================

  const handleAddAct = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // 🔥 FIX: Reload acts from DB to get accurate node numbers
      console.log('[BookDropdown] 🔄 Reloading acts before creating new act...');
      const freshActs = await TimelineAPI.getActs(projectId, token);
      
      const maxActNumber = freshActs.length > 0 
        ? Math.max(...freshActs.map(a => a.actNumber || 0))
        : 0;
      const newActNumber = maxActNumber + 1;

      console.log('[BookDropdown] 📊 Act numbers:', {
        existingActs: freshActs.map(a => a.actNumber),
        maxNumber: maxActNumber,
        newNumber: newActNumber
      });

      const newAct = await TimelineAPI.createAct(projectId, {
        actNumber: newActNumber,
        title: `Act ${newActNumber}`,
        orderIndex: freshActs.length,
      }, token);

      setActs([...freshActs, newAct]);
      toast.success('Act erstellt');
    } catch (error) {
      console.error('Error creating act:', error);
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleUpdateAct = async (actId: string, updates: { title?: string; description?: string }) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // Optimistic update
      setActs(acts => acts.map(a => a.id === actId ? { ...a, ...updates } : a));

      await TimelineAPI.updateAct(actId, updates, token);
      setEditingAct(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[actId];
        return next;
      });
    } catch (error) {
      console.error('Error updating act:', error);
      toast.error('Fehler beim Aktualisieren');
      loadTimeline(); // Reload on error
    }
  };

  const handleDeleteAct = async (actId: string) => {
    if (!confirm('Act und alle enthaltenen Kapitel und Abschnitte wirklich löschen?')) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      // Optimistic delete
      setActs(acts => acts.filter(a => a.id !== actId));
      setSequences(sequences => sequences.filter(s => s.actId !== actId));
      setScenes(scenes => scenes.filter(sc => {
        const sequence = sequences.find(s => s.id === sc.sequenceId);
        return sequence?.actId !== actId;
      }));

      await TimelineAPI.deleteAct(actId, token);
      toast.success('Act gelöscht');
    } catch (error) {
      console.error('Error deleting act:', error);
      toast.error('Fehler beim Löschen');
      loadTimeline();
    }
  };

  const handleDuplicateAct = async (actId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const act = acts.find(a => a.id === actId);
      if (!act) return;

      // 🔥 FIX: Reload acts from DB to get accurate node numbers
      const freshActs = await TimelineAPI.getActs(projectId, token);
      const maxActNumber = freshActs.length > 0 
        ? Math.max(...freshActs.map(a => a.actNumber || 0))
        : 0;
      const newActNumber = maxActNumber + 1;

      const duplicatedAct = await TimelineAPI.createAct(projectId, {
        actNumber: newActNumber,
        title: `${act.title} (Kopie)`,
        description: act.description,
        orderIndex: freshActs.length,
      }, token);

      setActs([...freshActs, duplicatedAct]);
      toast.success('Act dupliziert');
    } catch (error) {
      console.error('Error duplicating act:', error);
      toast.error('Fehler beim Duplizieren');
    }
  };

  // =====================================================
  // SEQUENCE (KAPITEL) HANDLERS
  // =====================================================

  const handleAddSequence = async (actId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // 🔥 FIX: Reload sequences from DB to get accurate node numbers
      console.log('[BookDropdown] 🔄 Reloading sequences before creating new sequence...');
      const freshSequences = await TimelineAPI.getAllSequencesByProject(projectId, token);
      
      const actSequences = freshSequences.filter(s => s.actId === actId);
      const maxSequenceNumber = actSequences.length > 0 
        ? Math.max(...actSequences.map(s => s.sequenceNumber || 0))
        : 0;
      const newSequenceNumber = maxSequenceNumber + 1;

      console.log('[BookDropdown] 📊 Sequence numbers:', {
        existingSequences: actSequences.map(s => s.sequenceNumber),
        maxNumber: maxSequenceNumber,
        newNumber: newSequenceNumber
      });

      const newSequence = await TimelineAPI.createSequence(actId, {
        sequenceNumber: newSequenceNumber,
        title: `Kapitel ${newSequenceNumber}`,
        orderIndex: actSequences.length,
      }, token);

      setSequences([...freshSequences, newSequence]);
      toast.success('Kapitel erstellt');
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleUpdateSequence = async (sequenceId: string, updates: { title?: string; description?: string }) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      setSequences(sequences => sequences.map(s => s.id === sequenceId ? { ...s, ...updates } : s));

      await TimelineAPI.updateSequence(sequenceId, updates, token);
      setEditingSequence(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[sequenceId];
        return next;
      });
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Fehler beim Aktualisieren');
      loadTimeline();
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    if (!confirm('Kapitel und alle enthaltenen Abschnitte wirklich löschen?')) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      setSequences(sequences => sequences.filter(s => s.id !== sequenceId));
      setScenes(scenes => scenes.filter(sc => sc.sequenceId !== sequenceId));

      await TimelineAPI.deleteSequence(sequenceId, token);
      toast.success('Kapitel gelöscht');
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Fehler beim Löschen');
      loadTimeline();
    }
  };

  const handleDuplicateSequence = async (sequenceId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const sequence = sequences.find(s => s.id === sequenceId);
      if (!sequence) return;

      // 🔥 FIX: Reload sequences from DB to get accurate node numbers
      const freshSequences = await TimelineAPI.getAllSequencesByProject(projectId, token);
      const actSequences = freshSequences.filter(s => s.actId === sequence.actId);
      const maxSequenceNumber = actSequences.length > 0 
        ? Math.max(...actSequences.map(s => s.sequenceNumber || 0))
        : 0;
      const newSequenceNumber = maxSequenceNumber + 1;

      const duplicatedSequence = await TimelineAPI.createSequence(sequence.actId!, {
        sequenceNumber: newSequenceNumber,
        title: `${sequence.title} (Kopie)`,
        description: sequence.description,
        orderIndex: actSequences.length,
      }, token);

      setSequences([...freshSequences, duplicatedSequence]);
      toast.success('Kapitel dupliziert');
    } catch (error) {
      console.error('Error duplicating sequence:', error);
      toast.error('Fehler beim Duplizieren');
    }
  };

  // =====================================================
  // SCENE (ABSCHNITT) HANDLERS
  // =====================================================

  const handleAddScene = async (sequenceId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // 🔥 FIX: Reload scenes from DB to get accurate node numbers
      console.log('[BookDropdown] 🔄 Reloading scenes before creating new scene...');
      const freshScenes = await TimelineAPI.getAllScenesByProject(projectId, token);
      
      const sequenceScenes = freshScenes.filter(sc => sc.sequenceId === sequenceId);
      // Find highest sceneNumber to avoid unique constraint violation
      const maxSceneNumber = sequenceScenes.length > 0 
        ? Math.max(...sequenceScenes.map(sc => sc.sceneNumber || 0))
        : 0;
      const newSceneNumber = maxSceneNumber + 1;

      console.log('[BookDropdown] 📊 Scene numbers:', {
        existingScenes: sequenceScenes.map(s => s.sceneNumber),
        maxNumber: maxSceneNumber,
        newNumber: newSceneNumber
      });

      const newScene = await TimelineAPI.createScene(sequenceId, {
        sceneNumber: newSceneNumber,
        title: `Abschnitt ${newSceneNumber}`,
        orderIndex: sequenceScenes.length,
      }, token);

      setScenes([...freshScenes, newScene]);
      toast.success('Abschnitt erstellt');
    } catch (error) {
      console.error('Error creating scene:', error);
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleUpdateScene = async (sceneId: string, updates: { title?: string; description?: string; content?: string }) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      setScenes(scenes => scenes.map(sc => sc.id === sceneId ? { ...sc, ...updates } : sc));

      await TimelineAPI.updateScene(sceneId, updates, token);
      setEditingScene(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[sceneId];
        return next;
      });
    } catch (error) {
      console.error('Error updating scene:', error);
      toast.error('Fehler beim Aktualisieren');
      loadTimeline();
    }
  };

  // 🔥 Auto-save scene content WITHOUT closing the editor
  const autoSaveScene = async (sceneId: string, content: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // Find current scene to get current metadata
      const currentScene = scenes.find(sc => sc.id === sceneId);
      if (!currentScene) return;

      // Optimistic update
      setScenes(scenes => scenes.map(sc => sc.id === sceneId ? { ...sc, content } : sc));

      // Save to backend directly WITHOUT extra GET request
      // This avoids the double API call that was closing the editor
      await TimelineAPIV2.updateNode(sceneId, {
        title: currentScene.title,
        metadata: {
          content,
          characters: currentScene.characters || [],
        },
      }, token);
    } catch (error) {
      console.error('Error auto-saving scene:', error);
      toast.error('Fehler beim Speichern');
      // DON'T reload timeline on error - just keep editing
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Abschnitt wirklich löschen?')) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      setScenes(scenes => scenes.filter(sc => sc.id !== sceneId));

      await TimelineAPI.deleteScene(sceneId, token);
      toast.success('Abschnitt gelöscht');
    } catch (error) {
      console.error('Error deleting scene:', error);
      toast.error('Fehler beim Löschen');
      loadTimeline();
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const scene = scenes.find(sc => sc.id === sceneId);
      if (!scene) return;

      // 🔥 FIX: Reload scenes from DB to get accurate node numbers
      const freshScenes = await TimelineAPI.getAllScenesByProject(projectId, token);
      const sequenceScenes = freshScenes.filter(sc => sc.sequenceId === scene.sequenceId);
      const maxSceneNumber = sequenceScenes.length > 0 
        ? Math.max(...sequenceScenes.map(sc => sc.sceneNumber || 0))
        : 0;
      const newSceneNumber = maxSceneNumber + 1;

      const duplicatedScene = await TimelineAPI.createScene(scene.sequenceId!, {
        sceneNumber: newSceneNumber,
        title: `${scene.title} (Kopie)`,
        description: scene.description,
        content: scene.content,
        orderIndex: sequenceScenes.length,
      }, token);

      setScenes([...freshScenes, duplicatedScene]);
      toast.success('Abschnitt dupliziert');
    } catch (error) {
      console.error('Error duplicating scene:', error);
      toast.error('Fehler beim Duplizieren');
    }
  };

  // =====================================================
  // DRAG & DROP HANDLERS
  // =====================================================

  const handleActDrop = async (draggedActId: string, targetIndex: number) => {
    const draggedAct = acts.find(a => a.id === draggedActId);
    if (!draggedAct) return;

    const oldIndex = acts.findIndex(a => a.id === draggedActId);
    if (oldIndex === targetIndex) return;

    // Optimistic reorder
    const reordered = [...acts];
    reordered.splice(oldIndex, 1);
    reordered.splice(targetIndex, 0, draggedAct);
    const updated = reordered.map((a, i) => ({ ...a, orderIndex: i }));
    setActs(updated);

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateAct(draggedActId, { orderIndex: targetIndex }, token);
    } catch (error) {
      console.error('Error reordering act:', error);
      toast.error('Fehler beim Verschieben');
      loadTimeline();
    }
  };

  const handleSequenceDrop = async (draggedSequenceId: string, targetIndex: number, actId: string) => {
    const draggedSequence = sequences.find(s => s.id === draggedSequenceId);
    if (!draggedSequence) return;

    const actSequences = sequences.filter(s => s.actId === actId);
    const oldIndex = actSequences.findIndex(s => s.id === draggedSequenceId);
    
    if (draggedSequence.actId === actId && oldIndex === targetIndex) return;

    // Optimistic update
    setSequences(sequences => {
      const filtered = sequences.filter(s => s.id !== draggedSequenceId);
      const actSeqs = filtered.filter(s => s.actId === actId);
      actSeqs.splice(targetIndex, 0, { ...draggedSequence, actId });
      return [
        ...filtered.filter(s => s.actId !== actId),
        ...actSeqs.map((s, i) => ({ ...s, orderIndex: i }))
      ];
    });

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateSequence(draggedSequenceId, { actId, orderIndex: targetIndex }, token);
    } catch (error) {
      console.error('Error moving sequence:', error);
      toast.error('Fehler beim Verschieben');
      loadTimeline();
    }
  };

  const handleSceneDrop = async (draggedSceneId: string, targetIndex: number, sequenceId: string) => {
    const draggedScene = scenes.find(sc => sc.id === draggedSceneId);
    if (!draggedScene) return;

    const sequenceScenes = scenes.filter(sc => sc.sequenceId === sequenceId);
    const oldIndex = sequenceScenes.findIndex(sc => sc.id === draggedSceneId);
    
    if (draggedScene.sequenceId === sequenceId && oldIndex === targetIndex) return;

    // Optimistic update
    setScenes(scenes => {
      const filtered = scenes.filter(sc => sc.id !== draggedSceneId);
      const seqScenes = filtered.filter(sc => sc.sequenceId === sequenceId);
      seqScenes.splice(targetIndex, 0, { ...draggedScene, sequenceId });
      return [
        ...filtered.filter(sc => sc.sequenceId !== sequenceId),
        ...seqScenes.map((sc, i) => ({ ...sc, orderIndex: i }))
      ];
    });

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateScene(draggedSceneId, { sequenceId, orderIndex: targetIndex }, token);
    } catch (error) {
      console.error('Error moving scene:', error);
      toast.error('Fehler beim Verschieben');
      loadTimeline();
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Lade Struktur...
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-3 p-4" ref={containerRef}>
        {/* Add Act Button */}
        <Button
          onClick={handleAddAct}
          variant="outline"
          size="sm"
          className="ml-auto bg-white text-center border-2 border-dashed border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
        >
          <Plus className="size-3.5 mr-1.5" />
          Act hinzufügen
        </Button>

        {/* Acts List */}
        {acts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Keine Acts vorhanden. Erstelle deinen ersten Act!
          </div>
        )}

        {acts.map((act, actIndex) => {
          const actSequences = sequences.filter(s => s.actId === act.id).sort((a, b) => a.orderIndex - b.orderIndex);
          const isActExpanded = expandedActs.has(act.id);

          return (
            <div key={act.id}>
              <DropZone
                type={ItemTypes.ACT}
                index={actIndex}
                onDrop={handleActDrop}
                label={`Vor ${act.title}`}
                height="act"
              />

              <DraggableAct
                act={act}
                index={actIndex}
                onStatsClick={() => {
                  setStatsNode({ type: 'act', data: act });
                  setStatsDialogOpen(true);
                }}
              >
                <Collapsible
                  open={isActExpanded}
                  onOpenChange={(open) => {
                    const next = new Set(expandedActs);
                    if (open) {
                      next.add(act.id);
                    } else {
                      next.delete(act.id);
                    }
                    setExpandedActs(next);
                  }}
                >
                  <div 
                    data-act-card
                    data-act-id={act.id}
                    className={cn(
                      "border-2 rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-700 overflow-hidden"
                    )}
                  >
                    {/* Act Header */}
                    <div className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/40">
                      <GripVertical className="size-4 text-muted-foreground cursor-grab" />
                      
                      <CollapsibleTrigger asChild>
                        <button className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors">
                          {isActExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>

                      {editingAct === act.id ? (
                        <Input
                          value={editValues[act.id]?.title ?? act.title}
                          onChange={(e) => setEditValues({ ...editValues, [act.id]: { ...editValues[act.id], title: e.target.value } })}
                          onBlur={() => handleUpdateAct(act.id, editValues[act.id])}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateAct(act.id, editValues[act.id]);
                            } else if (e.key === 'Escape') {
                              setEditingAct(null);
                              setEditValues(prev => {
                                const next = { ...prev };
                                delete next[act.id];
                                return next;
                              });
                            }
                          }}
                          autoFocus
                          className="h-7 flex-1 text-sm font-medium"
                        />
                      ) : (
                        <span 
                          className="flex-1 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const next = new Set(expandedActs);
                            if (isActExpanded) {
                              next.delete(act.id);
                            } else {
                              next.add(act.id);
                            }
                            setExpandedActs(next);
                          }}
                        >
                          {act.title}
                        </span>
                      )}

                      {/* 📊 Akt Statistics: Word & Page Count */}
                      {(() => {
                        // DEBUG: Log raw data arrays
                        console.log(`[ACT ${act.title}] 📋 Total sequences available:`, sequences.length);
                        console.log(`[ACT ${act.title}] 📋 Total scenes available:`, scenes.length);
                        console.log(`[ACT ${act.title}] 🔑 Looking for act_id:`, act.id);
                        if (sequences.length > 0) {
                          console.log(`[ACT ${act.title}] 🔍 First sequence object:`, sequences[0]);
                        }
                        
                        // Get all chapters (sequences) for this act
                        const actChapters = sequences.filter(s => s.actId === act.id);
                        
                        // Get all sections (scenes) for these chapters
                        const chapterIds = actChapters.map(c => c.id);
                        const actSections = scenes.filter(s => chapterIds.includes(s.sequenceId));
                        
                        // DEBUG: Log what we found
                        console.log(`[ACT ${act.title}] 📋 Total sequences available:`, sequences.length);
                        console.log(`[ACT ${act.title}] 📋 Total scenes available:`, scenes.length);
                        console.log(`[ACT ${act.title}] 🔑 Looking for act_id:`, act.id);
                        if (sequences.length > 0) {
                          console.log(`[ACT ${act.title}] 🔍 First sequence object:`, sequences[0]);
                        }
                        if (scenes.length > 0 && actChapters.length > 0) {
                          console.log(`[ACT ${act.title}] 🔍 First scene sequenceId:`, scenes[0].sequenceId);
                          console.log(`[ACT ${act.title}] 🔍 Chapter IDs we're looking for:`, chapterIds);
                        }
                        console.log(`[ACT ${act.title}] ✅ Chapters found:`, actChapters.length, 'Sections:', actSections.length);
                        
                        // Helper function to recursively extract text from TipTap JSON
                        const extractTextFromTiptap = (node: any): string => {
                          let text = '';
                          
                          // If this node has text directly, add it
                          if (node.text) {
                            text += node.text;
                          }
                          
                          // If this node has content (children), recursively extract from them
                          if (node.content && Array.isArray(node.content)) {
                            for (const child of node.content) {
                              text += extractTextFromTiptap(child) + ' ';
                            }
                          }
                          
                          return text;
                        };
                        
                        // Count words in all sections
                        let totalWords = 0;
                        actSections.forEach((section, idx) => {
                          // Try scene.content first (already extracted from metadata by nodeToScene), then fallback
                          const content = section.content || section.metadata?.content || section.description;
                          
                          if (content) {
                            try {
                              // If content is a string, parse it as JSON
                              const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
                              const textContent = extractTextFromTiptap(contentObj);
                              
                              // Count words
                              if (textContent.trim()) {
                                const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                console.log(`  Section ${idx + 1} (${section.title || 'Untitled'}): ${words.length} words`);
                                totalWords += words.length;
                              } else {
                                console.log(`  Section ${idx + 1} (${section.title || 'Untitled'}): 0 words (empty)`);
                              }
                            } catch (e) {
                              // If content is not JSON, count as plain text
                              const textContent = typeof content === 'string' ? content : '';
                              if (textContent.trim()) {
                                const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                console.log(`  Section ${idx + 1} (${section.title || 'Untitled'}): ${words.length} words (plain text)`);
                                totalWords += words.length;
                              } else {
                                console.log(`  Section ${idx + 1} (${section.title || 'Untitled'}): 0 words (parse error, empty)`);
                              }
                            }
                          } else {
                            console.log(`  Section ${idx + 1} (${section.title || 'Untitled'}): No content`);
                          }
                        });
                        
                        console.log(`[ACT ${act.title}] TOTAL: ${totalWords} words`);
                        
                        // Calculate pages (default 250 words per page) with decimal
                        const wordsPerPage = 250;
                        const totalPages = (totalWords / wordsPerPage).toFixed(1);
                        
                        return (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{totalWords.toLocaleString('de-DE')} Wörter</span>
                            <span>•</span>
                            <span>~{totalPages} {parseFloat(totalPages) === 1 ? 'Seite' : 'Seiten'}</span>
                          </div>
                        );
                      })()}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setStatsNode({ type: 'act', data: act });
                            setStatsDialogOpen(true);
                          }}>
                            <Info className="size-3.5 mr-2" />
                            Statistik & Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingAct(act.id);
                            setEditValues({ ...editValues, [act.id]: { title: act.title, description: act.description || '' } });
                          }}>
                            <Edit className="size-3.5 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateAct(act.id)}>
                            <Copy className="size-3.5 mr-2" />
                            Duplizieren
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAct(act.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Act Description */}
                    {(editingAct === act.id || act.description) && (
                      <div className="px-3 pb-2">
                        {editingAct === act.id ? (
                          <Textarea
                            value={editValues[act.id]?.description ?? act.description ?? ''}
                            onChange={(e) => setEditValues({ ...editValues, [act.id]: { ...editValues[act.id], description: e.target.value } })}
                            placeholder="Beschreibung..."
                            className="min-h-[60px] text-xs"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">{act.description}</p>
                        )}
                      </div>
                    )}

                    {/* Sequences (Kapitel) */}
                    <CollapsibleContent>
                      <div className="flex flex-col gap-2 p-3 pt-2">
                        <Button
                          onClick={() => handleAddSequence(act.id)}
                          variant="outline"
                          size="sm"
                          className="w-1/2 md:w-1/4 ml-auto h-7 text-xs bg-white text-center border-2 border-dashed border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40"
                        >
                          <Plus className="size-3 mr-1" />
                          Kapitel hinzufügen
                        </Button>

                        {actSequences.map((sequence, sequenceIndex) => {
                          const sequenceScenes = scenes.filter(sc => sc.sequenceId === sequence.id).sort((a, b) => a.orderIndex - b.orderIndex);
                          const isSequenceExpanded = expandedSequences.has(sequence.id);

                          return (
                            <div key={sequence.id}>
                              <DropZone
                                type={ItemTypes.SEQUENCE}
                                index={sequenceIndex}
                                onDrop={(id, idx) => handleSequenceDrop(id, idx, act.id)}
                                label={`Vor ${sequence.title}`}
                                height="sequence"
                              />

                              <DraggableSequence
                                sequence={sequence}
                                index={sequenceIndex}
                                onStatsClick={() => {
                                  setStatsNode({ type: 'sequence', data: sequence });
                                  setStatsDialogOpen(true);
                                }}
                              >
                                <Collapsible
                                  open={isSequenceExpanded}
                                  onOpenChange={(open) => {
                                    const next = new Set(expandedSequences);
                                    if (open) {
                                      next.add(sequence.id);
                                    } else {
                                      next.delete(sequence.id);
                                    }
                                    setExpandedSequences(next);
                                  }}
                                >
                                  <div
                                    data-sequence-card
                                    data-sequence-id={sequence.id}
                                    className="border-2 rounded-lg bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-700 overflow-hidden"
                                  >
                                    {/* Sequence Header */}
                                    <div className="flex items-center gap-2 p-2.5 bg-green-100 dark:bg-green-900/40">
                                      <GripVertical className="size-3.5 text-muted-foreground cursor-grab" />
                                      
                                      <CollapsibleTrigger asChild>
                                        <button className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors">
                                          {isSequenceExpanded ? (
                                            <ChevronDown className="size-3.5" />
                                          ) : (
                                            <ChevronRight className="size-3.5" />
                                          )}
                                        </button>
                                      </CollapsibleTrigger>

                                      {editingSequence === sequence.id ? (
                                        <Input
                                          value={editValues[sequence.id]?.title ?? sequence.title}
                                          onChange={(e) => setEditValues({ ...editValues, [sequence.id]: { ...editValues[sequence.id], title: e.target.value } })}
                                          onBlur={() => handleUpdateSequence(sequence.id, editValues[sequence.id])}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleUpdateSequence(sequence.id, editValues[sequence.id]);
                                            } else if (e.key === 'Escape') {
                                              setEditingSequence(null);
                                              setEditValues(prev => {
                                                const next = { ...prev };
                                                delete next[sequence.id];
                                                return next;
                                              });
                                            }
                                          }}
                                          autoFocus
                                          className="h-6 flex-1 text-xs font-medium"
                                        />
                                      ) : (
                                        <span 
                                          className="flex-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            const next = new Set(expandedSequences);
                                            if (isSequenceExpanded) {
                                              next.delete(sequence.id);
                                            } else {
                                              next.add(sequence.id);
                                            }
                                            setExpandedSequences(next);
                                          }}
                                        >
                                          {sequence.title}
                                        </span>
                                      )}

                                      {/* 📊 Kapitel Statistics: Word & Page Count */}
                                      {(() => {
                                        // Get all sections (scenes) for this chapter
                                        const chapterSections = scenes.filter(s => s.sequenceId === sequence.id);
                                        
                                        // Extract text from TipTap JSON
                                        const extractTextFromTiptap = (node: any): string => {
                                          if (!node) return '';
                                          
                                          let text = '';
                                          
                                          // If node has text, add it
                                          if (node.text) {
                                            text += node.text;
                                          }
                                          
                                          // Recursively process child nodes
                                          if (node.content && Array.isArray(node.content)) {
                                            for (const child of node.content) {
                                              text += extractTextFromTiptap(child) + ' ';
                                            }
                                          }
                                          
                                          return text;
                                        };
                                        
                                        // Count words in all sections
                                        let totalWords = 0;
                                        chapterSections.forEach((section) => {
                                          const content = section.content || section.metadata?.content || section.description;
                                          
                                          if (content) {
                                            try {
                                              const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
                                              const textContent = extractTextFromTiptap(contentObj);
                                              
                                              if (textContent.trim()) {
                                                const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                                totalWords += words.length;
                                              }
                                            } catch (e) {
                                              const textContent = typeof content === 'string' ? content : '';
                                              if (textContent.trim()) {
                                                const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                                totalWords += words.length;
                                              }
                                            }
                                          }
                                        });
                                        
                                        // Calculate pages with decimal
                                        const wordsPerPage = 250;
                                        const totalPages = (totalWords / wordsPerPage).toFixed(1);
                                        
                                        return (
                                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <span className="font-medium">{totalWords.toLocaleString('de-DE')} Wörter</span>
                                            <span>•</span>
                                            <span>~{totalPages} {parseFloat(totalPages) === 1 ? 'Seite' : 'Seiten'}</span>
                                          </div>
                                        );
                                      })()}

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="size-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => {
                                            setStatsNode({ type: 'sequence', data: sequence });
                                            setStatsDialogOpen(true);
                                          }}>
                                            <Info className="size-3 mr-2" />
                                            Statistik & Logs
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setEditingSequence(sequence.id);
                                            setEditValues({ ...editValues, [sequence.id]: { title: sequence.title, description: sequence.description || '' } });
                                          }}>
                                            <Edit className="size-3 mr-2" />
                                            Bearbeiten
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDuplicateSequence(sequence.id)}>
                                            <Copy className="size-3 mr-2" />
                                            Duplizieren
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            onClick={() => handleDeleteSequence(sequence.id)}
                                            className="text-red-600 dark:text-red-400"
                                          >
                                            <Trash2 className="size-3 mr-2" />
                                            Löschen
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Sequence Description */}
                                    {(editingSequence === sequence.id || sequence.description) && (
                                      <div className="px-2.5 pb-1.5">
                                        {editingSequence === sequence.id ? (
                                          <Textarea
                                            value={editValues[sequence.id]?.description ?? sequence.description ?? ''}
                                            onChange={(e) => setEditValues({ ...editValues, [sequence.id]: { ...editValues[sequence.id], description: e.target.value } })}
                                            placeholder="Beschreibung..."
                                            className="min-h-[50px] text-xs"
                                          />
                                        ) : (
                                          <p className="text-xs text-muted-foreground mt-1">{sequence.description}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Scenes (Abschnitte) */}
                                    <CollapsibleContent>
                                      <div className="flex flex-col gap-1.5 p-2.5 pt-1.5">
                                        <Button
                                          onClick={() => handleAddScene(sequence.id)}
                                          variant="outline"
                                          size="sm"
                                          className="w-1/2 md:w-1/4 ml-auto h-6 text-xs bg-white text-center border-2 border-dashed border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                        >
                                          <Plus className="size-3 mr-1" />
                                          Abschnitt hinzufügen
                                        </Button>

                                        {sequenceScenes.map((scene, sceneIndex) => {
                                          const isSceneExpanded = expandedScenes.has(scene.id);
                                          
                                          return (
                                          <div key={scene.id}>
                                            <DropZone
                                              type={ItemTypes.SCENE}
                                              index={sceneIndex}
                                              onDrop={(id, idx) => handleSceneDrop(id, idx, sequence.id)}
                                              label={`Vor ${scene.title}`}
                                              height="scene"
                                            />

                                            <DraggableScene
                                              scene={scene}
                                              index={sceneIndex}
                                              onStatsClick={() => {
                                                setStatsNode({ type: 'scene', data: scene });
                                                setStatsDialogOpen(true);
                                              }}
                                            >
                                              <Collapsible
                                                open={isSceneExpanded}
                                                onOpenChange={(open) => {
                                                  const next = new Set(expandedScenes);
                                                  if (open) {
                                                    next.add(scene.id);
                                                  } else {
                                                    next.delete(scene.id);
                                                  }
                                                  setExpandedScenes(next);
                                                }}
                                              >
                                                <div
                                                  data-scene-card
                                                  data-scene-id={scene.id}
                                                  className="border-2 rounded-md bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-700 overflow-hidden"
                                                >
                                                  {/* Scene Header */}
                                                  <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/40">
                                                    <GripVertical className="size-3 text-muted-foreground cursor-grab" />

                                                    <CollapsibleTrigger asChild>
                                                      <button className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors">
                                                        {isSceneExpanded ? (
                                                          <ChevronDown className="size-3" />
                                                        ) : (
                                                          <ChevronRight className="size-3" />
                                                        )}
                                                      </button>
                                                    </CollapsibleTrigger>

                                                    {editingSceneTitle === scene.id ? (
                                                      <Input
                                                        value={editValues[scene.id]?.title ?? scene.title}
                                                        onChange={(e) => setEditValues({ ...editValues, [scene.id]: { ...editValues[scene.id], title: e.target.value } })}
                                                        onBlur={() => {
                                                          handleUpdateScene(scene.id, { title: editValues[scene.id]?.title });
                                                          setEditingSceneTitle(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') {
                                                            handleUpdateScene(scene.id, { title: editValues[scene.id]?.title });
                                                            setEditingSceneTitle(null);
                                                          } else if (e.key === 'Escape') {
                                                            setEditingSceneTitle(null);
                                                            setEditValues(prev => {
                                                              const next = { ...prev };
                                                              delete next[scene.id];
                                                              return next;
                                                            });
                                                          }
                                                        }}
                                                        autoFocus
                                                        className="h-6 flex-1 text-xs"
                                                      />
                                                    ) : (
                                                      <span 
                                                        className="flex-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => {
                                                          const next = new Set(expandedScenes);
                                                          if (isSceneExpanded) {
                                                            next.delete(scene.id);
                                                          } else {
                                                            next.add(scene.id);
                                                          }
                                                          setExpandedScenes(next);
                                                        }}
                                                      >
                                                        {scene.title}
                                                      </span>
                                                    )}

                                                    {/* Word Count */}
                                                    {(() => {
                                                      // Helper function to recursively extract text from TipTap JSON
                                                      const extractTextFromTiptap = (node: any): string => {
                                                        let text = '';
                                                        
                                                        // If this node has text directly, add it
                                                        if (node.text) {
                                                          text += node.text;
                                                        }
                                                        
                                                        // If this node has content (children), recursively extract from them
                                                        if (node.content && Array.isArray(node.content)) {
                                                          for (const child of node.content) {
                                                            text += extractTextFromTiptap(child) + ' ';
                                                          }
                                                        }
                                                        
                                                        return text;
                                                      };
                                                      
                                                      let totalWords = 0;
                                                      
                                                      // Count words from scene content
                                                      const content = scene.content || scene.metadata?.content || scene.description;
                                                      
                                                      if (content) {
                                                        try {
                                                          const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
                                                          const textContent = extractTextFromTiptap(contentObj);
                                                          
                                                          if (textContent.trim()) {
                                                            const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                                            totalWords = words.length;
                                                          }
                                                        } catch (e) {
                                                          const textContent = typeof content === 'string' ? content : '';
                                                          if (textContent.trim()) {
                                                            const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
                                                            totalWords = words.length;
                                                          }
                                                        }
                                                      }
                                                      
                                                      // Calculate pages with decimal
                                                      const wordsPerPage = 250;
                                                      const totalPages = (totalWords / wordsPerPage).toFixed(1);
                                                      
                                                      return (
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                          <span className="font-medium">{totalWords.toLocaleString('de-DE')} Wörter</span>
                                                          <span>•</span>
                                                          <span>~{totalPages} {parseFloat(totalPages) === 1 ? 'Seite' : 'Seiten'}</span>
                                                        </div>
                                                      );
                                                    })()}

                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        <MoreVertical className="size-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuItem onClick={() => {
                                                        setStatsNode({ type: 'scene', data: scene });
                                                        setStatsDialogOpen(true);
                                                      }}>
                                                        <Info className="size-3 mr-2" />
                                                        Statistik & Logs
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => {
                                                        setEditingSceneTitle(scene.id);
                                                        setEditValues({ 
                                                          ...editValues, 
                                                          [scene.id]: { 
                                                            title: scene.title, 
                                                            description: scene.description || '',
                                                            content: scene.content || ''
                                                          } 
                                                        });
                                                      }}>
                                                        <Edit className="size-3 mr-2" />
                                                        Titel bearbeiten
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => handleDuplicateScene(scene.id)}>
                                                        <Copy className="size-3 mr-2" />
                                                        Duplizieren
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem 
                                                        onClick={() => handleDeleteScene(scene.id)}
                                                        className="text-red-600 dark:text-red-400"
                                                      >
                                                        <Trash2 className="size-3 mr-2" />
                                                        Löschen
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>

                                                {/* 📚 ABSCHNITT CONTENT (Rich Text) */}
                                                <CollapsibleContent>
                                                  <div className="p-2">
                                                    <div 
                                                      className="border border-amber-400 dark:border-amber-600 bg-white/70 dark:bg-amber-950/40 rounded-md min-h-[80px] text-xs p-2 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/50 transition-colors"
                                                      onClick={() => {
                                                        console.log('[BookDropdown] 🚀 Opening Content Modal for scene:', scene.id);
                                                        setEditingSceneForModal(scene);
                                                        setShowContentModal(true);
                                                      }}
                                                    >
                                                      {scene.content && typeof scene.content === 'object' ? (
                                                        <ReadonlyTiptapView 
                                                          content={scene.content}
                                                        />
                                                      ) : (
                                                        <em className="text-muted-foreground/50">Klicken zum Schreiben...</em>
                                                      )}
                                                    </div>
                                                  </div>
                                                </CollapsibleContent>
                                              </div>
                                            </Collapsible>
                                            </DraggableScene>
                                          </div>
                                        );
                                        })}

                                        {/* Drop Zone at end of scenes */}
                                        <DropZone
                                          type={ItemTypes.SCENE}
                                          index={sequenceScenes.length}
                                          onDrop={(id, idx) => handleSceneDrop(id, idx, sequence.id)}
                                          label="Am Ende"
                                          height="scene"
                                        />
                                      </div>
                                    </CollapsibleContent>
                                  </div>
                                </Collapsible>
                              </DraggableSequence>
                            </div>
                          );
                        })}

                        {/* Drop Zone at end of sequences */}
                        <DropZone
                          type={ItemTypes.SEQUENCE}
                          index={actSequences.length}
                          onDrop={(id, idx) => handleSequenceDrop(id, idx, act.id)}
                          label="Am Ende"
                          height="sequence"
                        />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              </DraggableAct>
            </div>
          );
        })}

        {/* Drop Zone at end of acts */}
        <DropZone
          type={ItemTypes.ACT}
          index={acts.length}
          onDrop={handleActDrop}
          label="Am Ende"
          height="act"
        />
      </div>

      {/* Stats Dialog */}
      {statsNode && (
        <TimelineNodeStatsDialog
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
          nodeType={statsNode.type}
          node={statsNode.data}
          projectId={projectId}
          projectType={projectType}
        />
      )}

      {/* Rich Text Content Editor Modal */}
      {editingSceneForModal && (
        <RichTextEditorModal
          isOpen={showContentModal}
          onClose={() => {
            setShowContentModal(false);
            setEditingSceneForModal(null);
          }}
          value={editingSceneForModal.content}
          onChange={async (jsonDoc) => {
            // Save as JSON object directly
            const now = new Date().toISOString();
            console.log('[BookDropdown] 💾 Saving content as JSON object:', jsonDoc);
            
            try {
              const token = await getAccessToken();
              if (!token) return;

              // Optimistic update
              setScenes(scenes => scenes.map(sc => 
                sc.id === editingSceneForModal.id 
                  ? { ...sc, content: jsonDoc, updatedAt: now } 
                  : sc
              ));

              // Update in backend
              await TimelineAPIV2.updateNode(editingSceneForModal.id, {
                title: editingSceneForModal.title,
                metadata: {
                  content: jsonDoc,
                  characters: editingSceneForModal.characters || [],
                },
              }, token);

              toast.success('Abschnitt gespeichert');
            } catch (error) {
              console.error('Error saving scene content:', error);
              toast.error('Fehler beim Speichern');
              loadTimeline();
            }
          }}
          title={`Abschnitt: ${editingSceneForModal.title}`}
          characters={characters}
          lastModified={editingSceneForModal.updatedAt ? {
            timestamp: editingSceneForModal.updatedAt,
            userName: undefined // TODO: Backend should track updatedBy user ID
          } : undefined}
        />
      )}
    </DndProvider>
  );
}