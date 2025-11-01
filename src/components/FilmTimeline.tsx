/**
 * 🎬 FILM TIMELINE - MINIMAL CLEAN DESIGN
 * 
 * Minimalistic inline editing with clean collapsed/expanded states
 * Drag & Drop: Within containers + Cross-container
 * Optimistic UI + Performance optimizations
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, MoreVertical, Copy, Edit } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ShotCard } from './ShotCard';
import { useAuth } from '../hooks/useAuth';
import * as ShotsAPI from '../lib/api/shots-api';
import * as TimelineAPI from '../lib/api/timeline-api';
import * as CharactersAPI from '../lib/api/characters-api';
import type { Act, Sequence, Scene, Shot, Character } from '../lib/types';
import { toast } from 'sonner';

interface FilmDropdownProps {
  projectId: string;
  characters?: Character[]; // Optionally pass characters from parent to avoid double-loading
}

// DnD Types
const ItemTypes = {
  ACT: 'act',
  SEQUENCE: 'sequence',
  SCENE: 'scene',
  SHOT: 'shot',
};

// =====================================================
// DRAGGABLE ACT CONTAINER
// =====================================================

interface DraggableActProps {
  act: Act;
  index: number;
  moveAct: (draggedId: string, targetId: string) => void;
  children: React.ReactNode;
}

function DraggableAct({ act, index, moveAct, children }: DraggableActProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ACT,
    item: { id: act.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.ACT,
    drop: (item: { id: string; index: number }) => {
      if (item.id !== act.id) {
        moveAct(item.id, act.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-purple-500'
      )}
    >
      {children}
    </div>
  );
}

// =====================================================
// DRAGGABLE SEQUENCE CONTAINER (accepts SCENE drops)
// =====================================================

interface DraggableSequenceProps {
  sequence: Sequence;
  index: number;
  moveSequence: (draggedId: string, targetId: string) => void;
  onSceneMoveToSequence?: (sceneId: string, targetSequenceId: string) => void;
  children: React.ReactNode;
}

function DraggableSequence({ sequence, index, moveSequence, onSceneMoveToSequence, children }: DraggableSequenceProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SEQUENCE,
    item: { id: sequence.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SEQUENCE, ItemTypes.SCENE],
    drop: (item: { id: string; index: number }, monitor) => {
      const itemType = monitor.getItemType();
      
      if (itemType === ItemTypes.SEQUENCE && item.id !== sequence.id) {
        moveSequence(item.id, sequence.id);
      } else if (itemType === ItemTypes.SCENE && onSceneMoveToSequence) {
        onSceneMoveToSequence(item.id, sequence.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50',
        isOver && canDrop && 'ring-2 ring-green-500'
      )}
    >
      {children}
    </div>
  );
}

// =====================================================
// DRAGGABLE SCENE CONTAINER (accepts SHOT drops)
// =====================================================

interface DraggableSceneProps {
  scene: Scene;
  index: number;
  moveScene: (draggedId: string, targetId: string) => void;
  onShotMoveToScene?: (shotId: string, targetSceneId: string) => void;
  children: React.ReactNode;
}

function DraggableScene({ scene, index, moveScene, onShotMoveToScene, children }: DraggableSceneProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SCENE,
    item: { id: scene.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCENE, ItemTypes.SHOT],
    drop: (item: { id: string; index: number }, monitor) => {
      const itemType = monitor.getItemType();
      
      if (itemType === ItemTypes.SCENE && item.id !== scene.id) {
        moveScene(item.id, scene.id);
      } else if (itemType === ItemTypes.SHOT && onShotMoveToScene) {
        onShotMoveToScene(item.id, scene.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        'transition-opacity',
        isDragging && 'opacity-50',
        isOver && canDrop && 'ring-2 ring-yellow-500'
      )}
    >
      {children}
    </div>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function FilmDropdown({ projectId, characters: externalCharacters }: FilmDropdownProps) {
  const { getAccessToken } = useAuth();

  // State
  const [acts, setActs] = useState<Act[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);

  // Expand/Collapse State
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [expandedShots, setExpandedShots] = useState<Set<string>>(new Set());
  
  // Project Characters for @-mentions
  // Use external characters if provided, otherwise load from API
  const [characters, setCharacters] = useState<Character[]>(externalCharacters || []);

  // Edit State (for inline editing)
  const [editingAct, setEditingAct] = useState<string | null>(null);
  const [editingSequence, setEditingSequence] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { title?: string; description?: string }>>({});

  // Creating State
  const [creating, setCreating] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadTimelineData();
  }, [projectId]);

  // Update characters when external characters change
  useEffect(() => {
    if (externalCharacters) {
      console.log('[FilmTimeline] External characters updated:', externalCharacters.length);
      setCharacters(externalCharacters);
    }
  }, [externalCharacters]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      // Load Acts (Level 1)
      let loadedActs = await TimelineAPI.getActs(projectId, token);
      
      // If no acts exist, initialize 3-Act structure
      if (!loadedActs || loadedActs.length === 0) {
        console.log('No acts found, initializing 3-act structure...');
        await ShotsAPI.initializeThreeActStructure(projectId, token);
        // Reload acts after initialization
        loadedActs = await TimelineAPI.getActs(projectId, token);
      }
      
      setActs(loadedActs || []);

      // 🚀 PERFORMANCE: Load ALL nodes in parallel
      const [allSequences, allScenes, allShots] = await Promise.all([
        TimelineAPI.getAllSequencesByProject(projectId, token).catch(err => {
          console.error('Error loading sequences:', err);
          return Promise.all(
            loadedActs.map(act => 
              TimelineAPI.getSequences(act.id, token).catch(() => [])
            )
          ).then(results => results.flat());
        }),
        
        TimelineAPI.getAllScenesByProject(projectId, token).catch(err => {
          console.error('Error loading scenes:', err);
          return [];
        }),
        
        ShotsAPI.getAllShotsByProject(projectId, token).catch(err => {
          console.error('Error loading shots:', err);
          return [];
        })
      ]);

      setSequences(allSequences || []);
      setScenes(allScenes || []);
      setShots(allShots || []);

      // Load characters for @-mentions in shots (only if not provided by parent)
      if (!externalCharacters) {
        try {
          const projectCharacters = await CharactersAPI.getCharacters(projectId, token);
          console.log('[FilmTimeline] Loaded characters for project:', projectId, projectCharacters);
          setCharacters(projectCharacters || []);
        } catch (error) {
          console.error('[FilmTimeline] Error loading characters:', error);
          setCharacters([]);
        }
      } else {
        console.log('[FilmTimeline] Using characters from parent:', externalCharacters.length);
      }

    } catch (error) {
      console.error('Error loading timeline data:', error);
      toast.error('Fehler beim Laden der Timeline-Daten');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ADD HANDLERS
  // =====================================================

  const handleAddAct = async () => {
    if (creating === 'act') return;

    // 🔥 FIX: Filter out temp acts and calculate correct act number
    const realActs = acts.filter(a => !a.id.startsWith('temp-'));
    const maxActNumber = realActs.reduce((max, a) => Math.max(max, a.actNumber), 0);
    const newActNumber = maxActNumber + 1;
    
    const tempId = `temp-act-${Date.now()}`;
    const optimisticAct: Act = {
      id: tempId,
      projectId,
      actNumber: newActNumber,
      title: `Act ${newActNumber}`,
      description: '',
      orderIndex: realActs.length,
    };

    setActs([...acts, optimisticAct]);
    setExpandedActs(new Set([...expandedActs, tempId]));
    setPendingIds(prev => new Set([...prev, tempId]));
    setCreating('act');

    try {
      const token = await getAccessToken();
      if (!token) {
        setActs(acts.filter(a => a.id !== tempId));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        toast.error('Nicht angemeldet');
        setCreating(null);
        return;
      }

      const newAct = await TimelineAPI.createAct(projectId, {
        actNumber: newActNumber,
        title: `Act ${newActNumber}`,
      }, token);

      setActs(acts => acts.map(a => a.id === tempId ? newAct : a));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.success('Act erstellt');
    } catch (error) {
      console.error('Error creating act:', error);
      setActs(acts.filter(a => a.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.error('Fehler beim Erstellen des Acts');
    } finally {
      setCreating(null);
    }
  };

  const handleAddSequence = async (actId: string) => {
    if (creating === `sequence-${actId}`) return;

    // 🔥 FIX: Filter out temp sequences and calculate correct sequence number
    const actSequences = sequences.filter(s => 
      s && 
      s.actId === actId && 
      !s.id.startsWith('temp-')
    );
    
    // Find max sequence number to avoid duplicates
    const maxSeqNumber = actSequences.reduce((max, s) => Math.max(max, s.sequenceNumber), 0);
    const newSeqNumber = maxSeqNumber + 1;
    
    const tempId = `temp-seq-${Date.now()}`;
    const optimisticSequence: Sequence = {
      id: tempId,
      projectId,
      actId,
      sequenceNumber: newSeqNumber,
      title: `Sequence ${newSeqNumber}`,
      description: '',
      color: '#ECFDF5',
      orderIndex: actSequences.length,
    };

    setSequences([...sequences, optimisticSequence]);
    setExpandedActs(new Set([...expandedActs, actId]));
    setPendingIds(prev => new Set([...prev, tempId]));
    setCreating(`sequence-${actId}`);

    try {
      const token = await getAccessToken();
      if (!token) {
        setSequences(sequences.filter(s => s.id !== tempId));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        toast.error('Nicht angemeldet');
        setCreating(null);
        return;
      }

      const newSequence = await TimelineAPI.createSequence(actId, {
        sequenceNumber: newSeqNumber,
        title: `Sequence ${newSeqNumber}`,
        color: '#ECFDF5',
      }, token);

      setSequences(seqs => seqs.map(s => s.id === tempId ? newSequence : s));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.success('Sequenz erstellt');
    } catch (error) {
      console.error('Error creating sequence:', error);
      setSequences(seqs => seqs.filter(s => s.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.error('Fehler beim Erstellen der Sequenz');
    } finally {
      setCreating(null);
    }
  };

  const handleAddScene = async (sequenceId: string) => {
    if (creating === `scene-${sequenceId}`) return;

    // 🔥 FIX: Filter out temp scenes and calculate correct scene number
    const seqScenes = scenes.filter(s => 
      s && 
      s.sequenceId === sequenceId && 
      !s.id.startsWith('temp-')
    );
    
    // Find max scene number to avoid duplicates
    const maxSceneNumber = seqScenes.reduce((max, s) => Math.max(max, s.sceneNumber), 0);
    const newSceneNumber = maxSceneNumber + 1;
    
    const tempId = `temp-scene-${Date.now()}`;
    const optimisticScene: Scene = {
      id: tempId,
      projectId,
      sequenceId,
      sceneNumber: newSceneNumber,
      title: `Scene ${newSceneNumber}`,
      description: '',
      location: '',
      timeOfDay: 'day',
      characters: [],
      orderIndex: seqScenes.length,
    };

    setScenes([...scenes, optimisticScene]);
    setExpandedSequences(new Set([...expandedSequences, sequenceId]));
    setPendingIds(prev => new Set([...prev, tempId]));
    setCreating(`scene-${sequenceId}`);

    try {
      const token = await getAccessToken();
      if (!token) {
        setScenes(scenes.filter(s => s.id !== tempId));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        toast.error('Nicht angemeldet');
        setCreating(null);
        return;
      }

      const newScene = await TimelineAPI.createScene(sequenceId, {
        sceneNumber: newSceneNumber,
        title: `Scene ${newSceneNumber}`,
      }, token);

      setScenes(scenes => scenes.map(s => s.id === tempId ? newScene : s));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.success('Scene erstellt');
    } catch (error) {
      console.error('Error creating scene:', error);
      setScenes(scenes => scenes.filter(s => s.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.error('Fehler beim Erstellen der Scene');
    } finally {
      setCreating(null);
    }
  };

  const handleAddShot = async (sceneId: string) => {
    // 🚫 Block if scene is still pending (temp-ID)
    if (sceneId.startsWith('temp-')) {
      toast.error('Warte bis die Scene erstellt ist');
      return;
    }
    
    if (creating === `shot-${sceneId}`) return;

    // 🔥 FIX: Filter out temp shots and calculate correct shot number
    const sceneShots = shots.filter(s => 
      s && 
      s.sceneId === sceneId && 
      !s.id.startsWith('temp-')
    );
    
    // Find max shot number to avoid duplicates
    // shotNumber is stored as string like "Shot 1", so we need to extract the number
    const maxShotNumber = sceneShots.reduce((max, s) => {
      const match = s.shotNumber?.match(/\d+/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, num);
    }, 0);
    const newShotNumber = maxShotNumber + 1;
    
    const tempId = `temp-shot-${Date.now()}`;
    const optimisticShot: Shot = {
      id: tempId,
      projectId,
      sceneId,
      shotNumber: `Shot ${newShotNumber}`,
      description: '',
      orderIndex: sceneShots.length,
    };

    setShots([...shots, optimisticShot]);
    setExpandedScenes(new Set([...expandedScenes, sceneId]));
    setPendingIds(prev => new Set([...prev, tempId]));
    setCreating(`shot-${sceneId}`);

    try {
      const token = await getAccessToken();
      if (!token) {
        setShots(shots.filter(s => s.id !== tempId));
        setPendingIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        toast.error('Nicht angemeldet');
        setCreating(null);
        return;
      }

      const newShot = await ShotsAPI.createShot(sceneId, {
        shotNumber: `Shot ${newShotNumber}`,
        description: '',
      }, token);

      setShots(shots => shots.map(s => s.id === tempId ? newShot : s));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.success('Shot erstellt');
    } catch (error) {
      console.error('Error creating shot:', error);
      setShots(shots.filter(s => s.id !== tempId));
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      toast.error('Fehler beim Erstellen des Shots');
    } finally {
      setCreating(null);
    }
  };

  // =====================================================
  // UPDATE HANDLERS (Inline Editing)
  // =====================================================

  const handleUpdateAct = async (actId: string) => {
    const updates = editValues[actId];
    if (!updates) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateAct(actId, updates, token);
      
      setActs(acts => acts.map(a => 
        a.id === actId ? { ...a, ...updates } : a
      ));
      
      setEditingAct(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[actId];
        return next;
      });
      
      toast.success('Act aktualisiert');
    } catch (error) {
      console.error('Error updating act:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleUpdateSequence = async (sequenceId: string) => {
    const updates = editValues[sequenceId];
    if (!updates) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateSequence(sequenceId, updates, token);
      
      setSequences(seqs => seqs.map(s => 
        s.id === sequenceId ? { ...s, ...updates } : s
      ));
      
      setEditingSequence(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[sequenceId];
        return next;
      });
      
      toast.success('Sequenz aktualisiert');
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleUpdateScene = async (sceneId: string) => {
    const updates = editValues[sceneId];
    if (!updates) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.updateScene(sceneId, updates, token);
      
      setScenes(scenes => scenes.map(s => 
        s.id === sceneId ? { ...s, ...updates } : s
      ));
      
      setEditingScene(null);
      setEditValues(prev => {
        const next = { ...prev };
        delete next[sceneId];
        return next;
      });
      
      toast.success('Szene aktualisiert');
    } catch (error) {
      console.error('Error updating scene:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  // =====================================================
  // DELETE HANDLERS
  // =====================================================

  const handleDeleteAct = async (actId: string) => {
    if (!confirm('Act und alle untergeordneten Elemente löschen?')) return;

    const actSequences = sequences.filter(s => s.actId === actId);
    const sequenceIds = actSequences.map(s => s.id);
    const actScenes = scenes.filter(s => sequenceIds.includes(s.sequenceId));
    const sceneIds = actScenes.map(s => s.id);

    // Optimistic delete
    setActs(acts.filter(a => a.id !== actId));
    setSequences(seqs => seqs.filter(s => s.actId !== actId));
    setScenes(sc => sc.filter(s => !sequenceIds.includes(s.sequenceId)));
    setShots(sh => sh.filter(s => !sceneIds.includes(s.sceneId)));

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.deleteAct(actId, token);
      toast.success('Act gelöscht');
    } catch (error) {
      console.error('Error deleting act:', error);
      toast.error('Fehler beim Löschen');
      loadTimelineData(); // Reload on error
    }
  };

  const handleDuplicateAct = async (actId: string) => {
    const actToDuplicate = acts.find(a => a.id === actId);
    if (!actToDuplicate) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      // Show loading toast
      toast.loading('Act wird dupliziert...');

      // Create new act with duplicated data
      const maxActNumber = acts.reduce((max, a) => Math.max(max, a.actNumber), 0);
      const newAct = await TimelineAPI.createAct(projectId, {
        actNumber: maxActNumber + 1,
        title: `${actToDuplicate.title} (Kopie)`,
        description: actToDuplicate.description,
        color: actToDuplicate.color,
      }, token);

      // Get all sequences in this act
      const actSequences = sequences.filter(s => s.actId === actId);
      const newSequences: typeof sequences = [];
      const newScenes: typeof scenes = [];
      const newShots: typeof shots = [];

      // Duplicate each sequence
      for (const seq of actSequences) {
        const newSeq = await TimelineAPI.createSequence(newAct.id, {
          sequenceNumber: seq.sequenceNumber,
          title: seq.title,
          description: seq.description,
          color: seq.color,
        }, token);
        newSequences.push(newSeq);

        // Get all scenes in this sequence
        const seqScenes = scenes.filter(sc => sc.sequenceId === seq.id);
        
        // Duplicate each scene
        for (const scene of seqScenes) {
          const newScene = await TimelineAPI.createScene(newSeq.id, {
            sceneNumber: scene.sceneNumber,
            title: scene.title,
            description: scene.description,
            location: scene.location,
            timeOfDay: scene.timeOfDay,
            characters: scene.characters,
          }, token);
          newScenes.push(newScene);

          // Get all shots in this scene
          const sceneShots = shots.filter(sh => sh.sceneId === scene.id);
          
          // Duplicate each shot
          for (const shot of sceneShots) {
            const newShot = await ShotsAPI.createShot(newScene.id, {
              shotNumber: shot.shotNumber,
              description: shot.description,
              cameraAngle: shot.cameraAngle,
              cameraMovement: shot.cameraMovement,
              framing: shot.framing,
              lens: shot.lens,
              duration: shot.duration,
              shotlengthMinutes: shot.shotlengthMinutes,
              shotlengthSeconds: shot.shotlengthSeconds,
              notes: shot.notes,
              dialog: shot.dialog,
            }, token);
            newShots.push(newShot);
          }
        }
      }

      // Update state with all new items
      setActs([...acts, newAct]);
      setSequences([...sequences, ...newSequences]);
      setScenes([...scenes, ...newScenes]);
      setShots([...shots, ...newShots]);
      
      toast.dismiss();
      toast.success(`Act mit ${actSequences.length} Sequenzen, ${newScenes.length} Szenen und ${newShots.length} Shots dupliziert`);
    } catch (error) {
      console.error('Error duplicating act:', error);
      toast.dismiss();
      toast.error('Fehler beim Duplizieren');
    }
  };

  const handleDuplicateSequence = async (sequenceId: string) => {
    const sequenceToDuplicate = sequences.find(s => s.id === sequenceId);
    if (!sequenceToDuplicate) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      // Show loading toast
      toast.loading('Sequenz wird dupliziert...');

      // Create new sequence with duplicated data
      const actSequences = sequences.filter(s => s.actId === sequenceToDuplicate.actId);
      const maxSeqNumber = actSequences.reduce((max, s) => Math.max(max, s.sequenceNumber), 0);
      const newSequence = await TimelineAPI.createSequence(sequenceToDuplicate.actId, {
        sequenceNumber: maxSeqNumber + 1,
        title: `${sequenceToDuplicate.title} (Kopie)`,
        description: sequenceToDuplicate.description,
        color: sequenceToDuplicate.color,
      }, token);

      // Get all scenes in this sequence
      const seqScenes = scenes.filter(sc => sc.sequenceId === sequenceId);
      const newScenes: typeof scenes = [];
      const newShots: typeof shots = [];
      
      // Duplicate each scene
      for (const scene of seqScenes) {
        const newScene = await TimelineAPI.createScene(newSequence.id, {
          sceneNumber: scene.sceneNumber,
          title: scene.title,
          description: scene.description,
          location: scene.location,
          timeOfDay: scene.timeOfDay,
          characters: scene.characters,
        }, token);
        newScenes.push(newScene);

        // Get all shots in this scene
        const sceneShots = shots.filter(sh => sh.sceneId === scene.id);
        
        // Duplicate each shot
        for (const shot of sceneShots) {
          const newShot = await ShotsAPI.createShot(newScene.id, {
            shotNumber: shot.shotNumber,
            description: shot.description,
            cameraAngle: shot.cameraAngle,
            cameraMovement: shot.cameraMovement,
            framing: shot.framing,
            lens: shot.lens,
            duration: shot.duration,
            shotlengthMinutes: shot.shotlengthMinutes,
            shotlengthSeconds: shot.shotlengthSeconds,
            notes: shot.notes,
            dialog: shot.dialog,
          }, token);
          newShots.push(newShot);
        }
      }

      // Update state
      setSequences([...sequences, newSequence]);
      setScenes([...scenes, ...newScenes]);
      setShots([...shots, ...newShots]);
      
      toast.dismiss();
      toast.success(`Sequenz mit ${newScenes.length} Szenen und ${newShots.length} Shots dupliziert`);
    } catch (error) {
      console.error('Error duplicating sequence:', error);
      toast.dismiss();
      toast.error('Fehler beim Duplizieren');
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    const sceneToDuplicate = scenes.find(s => s.id === sceneId);
    if (!sceneToDuplicate) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      // Show loading toast
      toast.loading('Scene wird dupliziert...');

      // Create new scene with duplicated data
      const seqScenes = scenes.filter(s => s.sequenceId === sceneToDuplicate.sequenceId);
      const maxSceneNumber = seqScenes.reduce((max, s) => Math.max(max, s.sceneNumber), 0);
      const newScene = await TimelineAPI.createScene(sceneToDuplicate.sequenceId, {
        sceneNumber: maxSceneNumber + 1,
        title: `${sceneToDuplicate.title} (Kopie)`,
        description: sceneToDuplicate.description,
        location: sceneToDuplicate.location,
        timeOfDay: sceneToDuplicate.timeOfDay,
        characters: sceneToDuplicate.characters,
      }, token);

      // Get all shots in this scene
      const sceneShots = shots.filter(sh => sh.sceneId === sceneId);
      const newShots: typeof shots = [];
      
      // Duplicate each shot
      for (const shot of sceneShots) {
        const newShot = await ShotsAPI.createShot(newScene.id, {
          shotNumber: shot.shotNumber,
          description: shot.description,
          cameraAngle: shot.cameraAngle,
          cameraMovement: shot.cameraMovement,
          framing: shot.framing,
          lens: shot.lens,
          duration: shot.duration,
          shotlengthMinutes: shot.shotlengthMinutes,
          shotlengthSeconds: shot.shotlengthSeconds,
          notes: shot.notes,
          dialog: shot.dialog,
        }, token);
        newShots.push(newShot);
      }

      // Update state
      setScenes([...scenes, newScene]);
      setShots([...shots, ...newShots]);
      
      toast.dismiss();
      toast.success(`Scene mit ${newShots.length} Shots dupliziert`);
    } catch (error) {
      console.error('Error duplicating scene:', error);
      toast.dismiss();
      toast.error('Fehler beim Duplizieren');
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    if (!confirm('Sequenz und alle Szenen löschen?')) return;

    const seqScenes = scenes.filter(s => s.sequenceId === sequenceId);
    const sceneIds = seqScenes.map(s => s.id);

    // Optimistic delete
    setSequences(seqs => seqs.filter(s => s.id !== sequenceId));
    setScenes(sc => sc.filter(s => s.sequenceId !== sequenceId));
    setShots(sh => sh.filter(s => !sceneIds.includes(s.sceneId)));

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.deleteSequence(sequenceId, token);
      toast.success('Sequenz gelöscht');
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Fehler beim Löschen');
      loadTimelineData();
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Scene und alle Shots löschen?')) return;

    // Optimistic delete
    setScenes(scenes.filter(s => s.id !== sceneId));
    setShots(shots.filter(s => s.sceneId !== sceneId));

    try {
      const token = await getAccessToken();
      if (!token) return;

      await TimelineAPI.deleteScene(sceneId, token);
      toast.success('Scene gelöscht');
    } catch (error) {
      console.error('Error deleting scene:', error);
      toast.error('Fehler beim Löschen');
      loadTimelineData();
    }
  };

  const handleDeleteShot = async (shotId: string) => {
    // Optimistic delete
    setShots(shots.filter(s => s.id !== shotId));

    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.deleteShot(shotId, token);
      toast.success('Shot gelöscht');
    } catch (error) {
      console.error('Error deleting shot:', error);
      toast.error('Fehler beim Löschen');
      loadTimelineData();
    }
  };

  // =====================================================
  // DRAG & DROP HANDLERS
  // =====================================================

  const handleActReorder = async (draggedId: string, targetId: string) => {
    const draggedIndex = acts.findIndex(a => a.id === draggedId);
    const targetIndex = acts.findIndex(a => a.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...acts];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    setActs(reordered);

    try {
      const token = await getAccessToken();
      if (token) {
        const actIds = reordered.map(a => a.id);
        await TimelineAPI.reorderNodes(actIds, token);
        toast.success('Akt-Reihenfolge aktualisiert');
      }
    } catch (error) {
      console.error('Error reordering acts:', error);
      toast.error('Fehler beim Sortieren');
      loadTimelineData();
    }
  };

  const handleSequenceReorder = async (draggedId: string, targetId: string) => {
    const draggedSeq = sequences.find(s => s.id === draggedId);
    const targetSeq = sequences.find(s => s.id === targetId);
    
    if (!draggedSeq || !targetSeq || draggedSeq.actId !== targetSeq.actId) return;

    const actSequences = sequences.filter(s => s.actId === draggedSeq.actId);
    const draggedIndex = actSequences.findIndex(s => s.id === draggedId);
    const targetIndex = actSequences.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...actSequences];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const otherSequences = sequences.filter(s => s.actId !== draggedSeq.actId);
    setSequences([...otherSequences, ...reordered]);

    try {
      const token = await getAccessToken();
      if (token) {
        const seqIds = reordered.map(s => s.id);
        await TimelineAPI.reorderNodes(seqIds, token);
        toast.success('Sequenz-Reihenfolge aktualisiert');
      }
    } catch (error) {
      console.error('Error reordering sequences:', error);
      toast.error('Fehler beim Sortieren');
      loadTimelineData();
    }
  };

  const handleSceneReorder = async (draggedId: string, targetId: string) => {
    const draggedScene = scenes.find(s => s.id === draggedId);
    const targetScene = scenes.find(s => s.id === targetId);
    
    if (!draggedScene || !targetScene || draggedScene.sequenceId !== targetScene.sequenceId) return;

    const seqScenes = scenes.filter(s => s.sequenceId === draggedScene.sequenceId);
    const draggedIndex = seqScenes.findIndex(s => s.id === draggedId);
    const targetIndex = seqScenes.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...seqScenes];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const otherScenes = scenes.filter(s => s.sequenceId !== draggedScene.sequenceId);
    setScenes([...otherScenes, ...reordered]);

    try {
      const token = await getAccessToken();
      if (token) {
        const sceneIds = reordered.map(s => s.id);
        await TimelineAPI.reorderNodes(sceneIds, token);
        toast.success('Szenen-Reihenfolge aktualisiert');
      }
    } catch (error) {
      console.error('Error reordering scenes:', error);
      toast.error('Fehler beim Sortieren');
      loadTimelineData();
    }
  };

  // =====================================================
  // CROSS-CONTAINER DRAG & DROP
  // =====================================================

  const handleSceneMoveToSequence = async (sceneId: string, targetSequenceId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || scene.sequenceId === targetSequenceId) return;

    console.log('🔄 Moving scene to new sequence:', { sceneId, targetSequenceId });

    // Optimistic update
    setScenes(scenes => scenes.map(s => 
      s.id === sceneId ? { ...s, sequenceId: targetSequenceId } : s
    ));

    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        loadTimelineData();
        return;
      }

      await TimelineAPI.updateScene(sceneId, { 
        sequenceId: targetSequenceId 
      }, token);
      
      toast.success('Szene verschoben');
    } catch (error) {
      console.error('Error moving scene:', error);
      toast.error('Fehler beim Verschieben');
      loadTimelineData();
    }
  };

  const handleShotMoveToScene = async (shotId: string, targetSceneId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot || shot.sceneId === targetSceneId) return;

    console.log('🔄 Moving shot to new scene:', { shotId, targetSceneId });

    // Optimistic update
    setShots(shots => shots.map(s => 
      s.id === shotId ? { ...s, sceneId: targetSceneId } : s
    ));

    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        loadTimelineData();
        return;
      }

      await ShotsAPI.updateShot(shotId, { 
        sceneId: targetSceneId 
      }, token);
      
      toast.success('Shot verschoben');
    } catch (error) {
      console.error('Error moving shot:', error);
      toast.error('Fehler beim Verschieben');
      loadTimelineData();
    }
  };

  // =====================================================
  // SHOT HANDLERS
  // =====================================================

  const handleUpdateShot = async (shotId: string, updates: Partial<Shot>) => {
    // Optimistic update
    setShots(shots => shots.map(s => 
      s.id === shotId ? { ...s, ...updates } : s
    ));

    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.updateShot(shotId, updates, token);
      toast.success('Shot aktualisiert');
    } catch (error) {
      console.error('Error updating shot:', error);
      toast.error('Fehler beim Aktualisieren');
      loadTimelineData();
    }
  };

  const handleDuplicateShot = async (shotId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      const sceneShots = shots.filter(s => s.sceneId === shot.sceneId && !s.id.startsWith('temp-'));
      
      // Extract numeric part from shotNumber strings like "Shot 1", "Shot 2"
      const shotNumbers = sceneShots.map(s => {
        const match = String(s.shotNumber).match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });
      const maxShotNumber = Math.max(0, ...shotNumbers);
      
      const newShot = await ShotsAPI.createShot(shot.sceneId, {
        shotNumber: `${shot.shotNumber} (Kopie)`,
        description: shot.description,
        cameraAngle: shot.cameraAngle,
        cameraMovement: shot.cameraMovement,
        framing: shot.framing,
        lens: shot.lens,
        duration: shot.duration,
        shotlengthMinutes: shot.shotlengthMinutes,
        shotlengthSeconds: shot.shotlengthSeconds,
        notes: shot.notes,
        dialog: shot.dialog,
      }, token);

      setShots([...shots, newShot]);
      toast.success('Shot dupliziert');
    } catch (error) {
      console.error('Error duplicating shot:', error);
      toast.error('Fehler beim Duplizieren');
    }
  };

  const handleShotReorder = async (draggedId: string, targetId: string) => {
    const draggedShot = shots.find(s => s.id === draggedId);
    const targetShot = shots.find(s => s.id === targetId);
    
    if (!draggedShot || !targetShot || draggedShot.sceneId !== targetShot.sceneId) return;

    const sceneShots = shots.filter(s => s.sceneId === draggedShot.sceneId);
    const draggedIndex = sceneShots.findIndex(s => s.id === draggedId);
    const targetIndex = sceneShots.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...sceneShots];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const otherShots = shots.filter(s => s.sceneId !== draggedShot.sceneId);
    setShots([...otherShots, ...reordered]);

    try {
      const token = await getAccessToken();
      if (token) {
        const shotIds = reordered.map(s => s.id);
        await ShotsAPI.reorderShots(draggedShot.sceneId, shotIds, token);
        toast.success('Shot-Reihenfolge aktualisiert');
      }
    } catch (error) {
      console.error('Error reordering shots:', error);
      toast.error('Fehler beim Sortieren');
      loadTimelineData();
    }
  };

  const handleShotImageUpload = async (shotId: string, file: File) => {
    // Check file size (max 5MB per backend limit)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`Bild zu groß: ${fileSizeMB} MB (Max: ${maxSizeMB} MB)`);
      return;
    }

    // Optimistic UI: Zeige Preview sofort
    const previewUrl = URL.createObjectURL(file);
    setShots(shots => shots.map(s => 
      s.id === shotId ? { ...s, imageUrl: previewUrl } : s
    ));

    // Toast mit Loading-Anzeige
    toast.loading('Bild wird hochgeladen...');

    try {
      const token = await getAccessToken();
      if (!token) {
        toast.dismiss();
        toast.error('Nicht authentifiziert');
        URL.revokeObjectURL(previewUrl);
        setShots(shots => shots.map(s => 
          s.id === shotId ? { ...s, imageUrl: undefined } : s
        ));
        return;
      }

      const imageUrl = await ShotsAPI.uploadShotImage(shotId, file, token);
      
      // Cleanup temporary URL
      URL.revokeObjectURL(previewUrl);
      
      // Update mit echter URL
      setShots(shots => shots.map(s => 
        s.id === shotId ? { ...s, imageUrl } : s
      ));
      
      toast.dismiss();
      toast.success('Bild hochgeladen! ✅');
    } catch (error) {
      console.error('❌ Error uploading shot image:', error);
      
      // Revert optimistic update
      URL.revokeObjectURL(previewUrl);
      setShots(shots => shots.map(s => 
        s.id === shotId ? { ...s, imageUrl: undefined } : s
      ));
      
      toast.dismiss();
      toast.error(`Fehler beim Hochladen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const handleShotAudioUpload = async (
    shotId: string, 
    file: File, 
    type: 'music' | 'sfx', 
    label?: string,
    startTime?: number,
    endTime?: number,
    fadeIn?: number,
    fadeOut?: number
  ) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.uploadShotAudio(shotId, file, type, token, label, startTime, endTime, fadeIn, fadeOut);
      
      // Reload shot data to get new audio
      const updatedShot = await ShotsAPI.getShot(shotId, token);
      setShots(shots => shots.map(s => s.id === shotId ? updatedShot : s));
      
      toast.success('Audio hochgeladen');
    } catch (error) {
      console.error('Error uploading shot audio:', error);
      toast.error('Fehler beim Hochladen');
    }
  };

  const handleShotAudioDelete = async (audioId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.deleteShotAudio(audioId, token);
      
      // Remove audio from local state
      setShots(shots => shots.map(shot => ({
        ...shot,
        audioFiles: shot.audioFiles?.filter(a => a.id !== audioId)
      })));
      
      toast.success('Audio gelöscht');
    } catch (error) {
      console.error('Error deleting shot audio:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleShotAudioUpdate = async (
    audioId: string, 
    updates: { 
      label?: string; 
      startTime?: number; 
      endTime?: number; 
      fadeIn?: number; 
      fadeOut?: number 
    }
  ) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.updateShotAudio(audioId, updates, token);
      
      // Update audio in local state
      setShots(shots => shots.map(shot => ({
        ...shot,
        audioFiles: shot.audioFiles?.map(a => 
          a.id === audioId ? { ...a, ...updates } : a
        )
      })));
      
      toast.success('Audio aktualisiert');
    } catch (error) {
      console.error('Error updating shot audio:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleShotCharacterAdd = async (shotId: string, characterId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    const currentCharacters = shot.characters || [];
    if (currentCharacters.some(c => c.id === characterId)) {
      toast.error('Character bereits hinzugefügt');
      return;
    }

    // Find character data for optimistic update
    const character = characters.find(c => c.id === characterId);
    if (!character) {
      toast.error('Character nicht gefunden');
      return;
    }

    const optimisticCharacters = [...currentCharacters, character];

    // Optimistic update
    setShots(shots => shots.map(s => 
      s.id === shotId ? { ...s, characters: optimisticCharacters } : s
    ));

    try {
      const token = await getAccessToken();
      if (!token) {
        // Rollback
        setShots(shots => shots.map(s => 
          s.id === shotId ? { ...s, characters: currentCharacters } : s
        ));
        toast.error('Nicht angemeldet');
        return;
      }

      // Use the new dedicated API endpoint
      const updatedShot = await ShotsAPI.addCharacterToShot(shotId, characterId, token);
      
      // Update with real data from server
      setShots(shots => shots.map(s => 
        s.id === shotId ? { ...s, characters: updatedShot.characters } : s
      ));
      
      toast.success('Character hinzugefügt');
    } catch (error) {
      console.error('Error adding character to shot:', error);
      toast.error('Fehler beim Hinzufügen');
      // Rollback
      setShots(shots => shots.map(s => 
        s.id === shotId ? { ...s, characters: currentCharacters } : s
      ));
    }
  };

  const handleShotCharacterRemove = async (shotId: string, characterId: string) => {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) return;

    const currentCharacters = shot.characters || [];
    const updatedCharacters = currentCharacters.filter(c => c.id !== characterId);

    // Optimistic update
    setShots(shots => shots.map(s => 
      s.id === shotId ? { ...s, characters: updatedCharacters } : s
    ));

    try {
      const token = await getAccessToken();
      if (!token) {
        // Rollback
        setShots(shots => shots.map(s => 
          s.id === shotId ? { ...s, characters: currentCharacters } : s
        ));
        toast.error('Nicht angemeldet');
        return;
      }

      // Use the dedicated API endpoint
      await ShotsAPI.removeCharacterFromShot(shotId, characterId, token);
      
      toast.success('Character entfernt');
    } catch (error) {
      console.error('Error removing character from shot:', error);
      toast.error('Fehler beim Entfernen');
      // Rollback
      setShots(shots => shots.map(s => 
        s.id === shotId ? { ...s, characters: currentCharacters } : s
      ));
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Dropdown wird geladen...</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col gap-3">
        {/* Add Act Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddAct}
          disabled={creating === 'act'}
          className="w-1/2 md:w-1/4 ml-auto bg-white text-center border-2 border-dashed border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
        >
          <Plus className="size-3.5 mr-1.5" />
          Act hinzufügen
        </Button>

        {/* Acts */}
        {acts.map((act, actIndex) => {
          const actSequences = sequences.filter(s => s.actId === act.id);
          const isExpanded = expandedActs.has(act.id);
          const isEditing = editingAct === act.id;
          const isPending = pendingIds.has(act.id);

          return (
            <DraggableAct
              key={act.id}
              act={act}
              index={actIndex}
              moveAct={handleActReorder}
            >
              <div className={cn(
                "border-2 rounded-lg bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-700",
                isPending && "opacity-60"
              )}>
                {/* Act Header */}
                <div className="flex items-center gap-2 py-4 px-3">
                  <GripVertical className="size-4 text-muted-foreground cursor-move flex-shrink-0" />
                  
                  <button
                    onClick={() => {
                      const next = new Set(expandedActs);
                      if (isExpanded) {
                        next.delete(act.id);
                      } else {
                        next.add(act.id);
                      }
                      setExpandedActs(next);
                    }}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>

                  {isEditing ? (
                    <>
                      <Input
                        value={editValues[act.id]?.title ?? act.title}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [act.id]: { ...prev[act.id], title: e.target.value }
                        }))}
                        className="h-7 flex-1 bg-white text-[18px] border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500 focus-visible:ring-blue-400/20"
                        placeholder="Titel"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateAct(act.id)}
                        className="h-7 px-2"
                      >
                        Speichern
                      </Button>
                    </>
                  ) : (
                    <>
                      <span 
                        className="flex-1 font-semibold cursor-pointer text-[18px] text-[rgb(21,93,252)]"
                        onClick={() => {
                          const next = new Set(expandedActs);
                          if (isExpanded) {
                            next.delete(act.id);
                          } else {
                            next.add(act.id);
                          }
                          setExpandedActs(next);
                        }}
                      >
                        {act.title}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingAct(act.id);
                              setEditValues(prev => ({
                                ...prev,
                                [act.id]: { title: act.title, description: act.description }
                              }));
                            }}
                          >
                            <Edit className="size-3.5 mr-2" />
                            Edit Act
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateAct(act.id)}>
                            <Copy className="size-3.5 mr-2" />
                            Duplicate Act
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteAct(act.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            Delete Act
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>

                {/* Act Description */}
                {isExpanded && (
                  <div className="px-3 pb-2 space-y-2">
                    {isEditing ? (
                      <Textarea
                        value={editValues[act.id]?.description ?? act.description ?? ''}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          [act.id]: { ...prev[act.id], description: e.target.value }
                        }))}
                        className="bg-white text-sm border-blue-200 dark:border-blue-700 focus:border-blue-400 dark:focus:border-blue-500 focus-visible:ring-blue-400/20"
                        placeholder="Beschreibung"
                        rows={2}
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setEditingAct(act.id);
                          setEditValues(prev => ({
                            ...prev,
                            [act.id]: { title: act.title, description: act.description }
                          }));
                        }}
                        className="text-sm text-[rgb(21,93,252)] cursor-pointer hover:text-foreground transition-colors min-h-[2rem] flex items-center"
                      >
                        {act.description || '+ Beschreibung'}
                      </div>
                    )}
                  </div>
                )}

                {/* Sequences */}
                {isExpanded && (
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddSequence(act.id)}
                      disabled={creating === `sequence-${act.id}`}
                      className="w-1/2 md:w-1/4 ml-auto h-7 text-xs bg-white text-center border-2 border-dashed border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40"
                    >
                      <Plus className="size-3 mr-1" />
                      Sequenz hinzufügen
                    </Button>

                    {actSequences.map((sequence, seqIndex) => {
                      const seqScenes = scenes.filter(s => s.sequenceId === sequence.id);
                      const isSeqExpanded = expandedSequences.has(sequence.id);
                      const isSeqEditing = editingSequence === sequence.id;
                      const isSeqPending = pendingIds.has(sequence.id);

                      return (
                        <DraggableSequence
                          key={sequence.id}
                          sequence={sequence}
                          index={seqIndex}
                          moveSequence={handleSequenceReorder}
                          onSceneMoveToSequence={handleSceneMoveToSequence}
                        >
                          <div className={cn(
                            "border-2 rounded-lg bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-700",
                            isSeqPending && "opacity-60"
                          )}>
                            {/* Sequence Header */}
                            <div className="flex items-center gap-2 p-2">
                              <GripVertical className="size-3 text-muted-foreground cursor-move flex-shrink-0" />
                              
                              <button
                                onClick={() => {
                                  const next = new Set(expandedSequences);
                                  if (isSeqExpanded) {
                                    next.delete(sequence.id);
                                  } else {
                                    next.add(sequence.id);
                                  }
                                  setExpandedSequences(next);
                                }}
                                className="flex-shrink-0"
                              >
                                {isSeqExpanded ? (
                                  <ChevronDown className="size-3.5" />
                                ) : (
                                  <ChevronRight className="size-3.5" />
                                )}
                              </button>

                              {isSeqEditing ? (
                                <>
                                  <Input
                                    value={editValues[sequence.id]?.title ?? sequence.title}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      [sequence.id]: { ...prev[sequence.id], title: e.target.value }
                                    }))}
                                    className="h-6 flex-1 bg-white text-sm border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500 focus-visible:ring-green-400/20"
                                    placeholder="Titel"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateSequence(sequence.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Speichern
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span 
                                    className="flex-1 text-sm font-semibold cursor-pointer text-[14px] text-[rgb(0,166,62)]"
                                    onClick={() => {
                                      const next = new Set(expandedSequences);
                                      if (isSeqExpanded) {
                                        next.delete(sequence.id);
                                      } else {
                                        next.add(sequence.id);
                                      }
                                      setExpandedSequences(next);
                                    }}
                                  >
                                    {sequence.title}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="size-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setEditingSequence(sequence.id);
                                          setEditValues(prev => ({
                                            ...prev,
                                            [sequence.id]: { title: sequence.title, description: sequence.description }
                                          }));
                                        }}
                                      >
                                        <Edit className="size-3 mr-2" />
                                        Edit Sequence
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateSequence(sequence.id)}>
                                        <Copy className="size-3 mr-2" />
                                        Duplicate Sequence
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteSequence(sequence.id)}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        <Trash2 className="size-3 mr-2" />
                                        Delete Sequence
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>

                            {/* Sequence Description */}
                            {isSeqExpanded && (
                              <div className="px-2 pb-2 space-y-2">
                                {isSeqEditing ? (
                                  <Textarea
                                    value={editValues[sequence.id]?.description ?? sequence.description ?? ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      [sequence.id]: { ...prev[sequence.id], description: e.target.value }
                                    }))}
                                    className="bg-white text-xs border-green-200 dark:border-green-700 focus:border-green-400 dark:focus:border-green-500 focus-visible:ring-green-400/20"
                                    placeholder="Beschreibung"
                                    rows={2}
                                  />
                                ) : (
                                  <div
                                    onClick={() => {
                                      setEditingSequence(sequence.id);
                                      setEditValues(prev => ({
                                        ...prev,
                                        [sequence.id]: { title: sequence.title, description: sequence.description }
                                      }));
                                    }}
                                    className="text-xs text-[rgb(0,166,62)] cursor-pointer hover:text-foreground transition-colors min-h-[1.5rem] flex items-center"
                                  >
                                    {sequence.description || '+ Beschreibung'}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Scenes */}
                            {isSeqExpanded && (
                              <div className="px-2 pb-2 flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddScene(sequence.id)}
                                  disabled={creating === `scene-${sequence.id}`}
                                  className="w-1/2 md:w-1/4 ml-auto h-6 text-xs bg-white text-center border-2 border-dashed border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40"
                                >
                                  <Plus className="size-3 mr-1" />
                                  Scene hinzufügen
                                </Button>

                                {seqScenes.map((scene, sceneIndex) => {
                                  const sceneShots = shots.filter(s => s.sceneId === scene.id);
                                  const isSceneExpanded = expandedScenes.has(scene.id);
                                  const isSceneEditing = editingScene === scene.id;
                                  const isScenePending = pendingIds.has(scene.id);

                                  return (
                                    <DraggableScene
                                      key={scene.id}
                                      scene={scene}
                                      index={sceneIndex}
                                      moveScene={handleSceneReorder}
                                      onShotMoveToScene={handleShotMoveToScene}
                                    >
                                      <div className={cn(
                                        "border-2 rounded-lg bg-pink-50 border-pink-200 dark:bg-pink-950/40 dark:border-pink-700",
                                        isScenePending && "opacity-60"
                                      )}>
                                        {/* Scene Header */}
                                        <div className="flex items-center gap-2 p-2">
                                          <GripVertical className="size-3 text-muted-foreground cursor-move flex-shrink-0" />
                                          
                                          <button
                                            onClick={() => {
                                              const next = new Set(expandedScenes);
                                              if (isSceneExpanded) {
                                                next.delete(scene.id);
                                              } else {
                                                next.add(scene.id);
                                              }
                                              setExpandedScenes(next);
                                            }}
                                            className="flex-shrink-0"
                                          >
                                            {isSceneExpanded ? (
                                              <ChevronDown className="size-3.5" />
                                            ) : (
                                              <ChevronRight className="size-3.5" />
                                            )}
                                          </button>

                                          {isSceneEditing ? (
                                            <>
                                              <Input
                                                value={editValues[scene.id]?.title ?? scene.title}
                                                onChange={(e) => setEditValues(prev => ({
                                                  ...prev,
                                                  [scene.id]: { ...prev[scene.id], title: e.target.value }
                                                }))}
                                                className="h-6 flex-1 bg-white text-xs border-pink-200 dark:border-pink-700 focus:border-pink-400 dark:focus:border-pink-500 focus-visible:ring-pink-400/20"
                                                placeholder="Titel"
                                              />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleUpdateScene(scene.id)}
                                                className="h-6 px-2 text-xs"
                                              >
                                                Speichern
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <span 
                                                className="flex-1 text-xs font-semibold cursor-pointer text-[14px] text-[rgb(230,0,118)]"
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
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 px-1.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <MoreVertical className="size-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem 
                                                    onClick={() => {
                                                      setEditingScene(scene.id);
                                                      setEditValues(prev => ({
                                                        ...prev,
                                                        [scene.id]: { title: scene.title, description: scene.description }
                                                      }));
                                                    }}
                                                  >
                                                    <Edit className="size-3 mr-2" />
                                                    Edit Scene
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => handleDuplicateScene(scene.id)}>
                                                    <Copy className="size-3 mr-2" />
                                                    Duplicate Scene
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem 
                                                    onClick={() => handleDeleteScene(scene.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                  >
                                                    <Trash2 className="size-3 mr-2" />
                                                    Delete Scene
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </>
                                          )}
                                        </div>

                                        {/* Scene Description */}
                                        {isSceneExpanded && (
                                          <div className="px-2 pb-2 space-y-2">
                                            {isSceneEditing ? (
                                              <Textarea
                                                value={editValues[scene.id]?.description ?? scene.description ?? ''}
                                                onChange={(e) => setEditValues(prev => ({
                                                  ...prev,
                                                  [scene.id]: { ...prev[scene.id], description: e.target.value }
                                                }))}
                                                className="bg-white text-xs border-pink-200 dark:border-pink-700 focus:border-pink-400 dark:focus:border-pink-500 focus-visible:ring-pink-400/20"
                                                placeholder="Beschreibung"
                                                rows={2}
                                              />
                                            ) : (
                                              <div
                                                onClick={() => {
                                                  setEditingScene(scene.id);
                                                  setEditValues(prev => ({
                                                    ...prev,
                                                    [scene.id]: { title: scene.title, description: scene.description }
                                                  }));
                                                }}
                                                className="text-xs text-[rgb(230,0,118)] cursor-pointer hover:text-foreground transition-colors min-h-[1.5rem] flex items-center"
                                              >
                                                {scene.description || '+ Beschreibung'}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Shots */}
                                        {isSceneExpanded && (
                                          <div className="px-2 pb-2 flex flex-col gap-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleAddShot(scene.id)}
                                              disabled={creating === `shot-${scene.id}` || scene.id.startsWith('temp-') || pendingIds.has(scene.id)}
                                              className="w-1/2 md:w-1/4 ml-auto h-6 text-xs bg-white text-center border-2 border-dashed border-yellow-400 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                            >
                                              <Plus className="size-3 mr-1" />
                                              Shot hinzufügen
                                            </Button>

                                            {sceneShots.map((shot, shotIndex) => (
                                              <ShotCard
                                                key={shot.id}
                                                shot={shot}
                                                sceneId={scene.id}
                                                projectId={projectId}
                                                projectCharacters={characters}
                                                isExpanded={expandedShots.has(shot.id)}
                                                onToggleExpand={() => {
                                                  const next = new Set(expandedShots);
                                                  if (expandedShots.has(shot.id)) {
                                                    next.delete(shot.id);
                                                  } else {
                                                    next.add(shot.id);
                                                  }
                                                  setExpandedShots(next);
                                                }}
                                                onUpdate={handleUpdateShot}
                                                onDelete={handleDeleteShot}
                                                onDuplicate={handleDuplicateShot}
                                                onReorder={handleShotReorder}
                                                onImageUpload={handleShotImageUpload}
                                                onAudioUpload={handleShotAudioUpload}
                                                onAudioDelete={handleShotAudioDelete}
                                                onAudioUpdate={handleShotAudioUpdate}
                                                onCharacterAdd={handleShotCharacterAdd}
                                                onCharacterRemove={handleShotCharacterRemove}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </DraggableScene>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </DraggableSequence>
                      );
                    })}
                  </div>
                )}
              </div>
            </DraggableAct>
          );
        })}
      </div>
    </DndProvider>
  );
}
