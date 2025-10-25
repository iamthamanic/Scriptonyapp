import { useState, useEffect } from 'react';
import { Film, Plus, Trash2, Edit2, Save, X, GripVertical, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { ShotCard } from './ShotCard';
import { useAuth } from '../hooks/useAuth';
import * as ShotsAPI from '../lib/api/shots-api';
import * as TimelineAPI from '../lib/api/timeline-api';
import type { Act, Sequence, Scene, Shot, Character } from '../lib/types';
import { toast } from 'sonner';

interface FilmTimelineProps {
  projectId: string;
}

type ZoomLevel = 'overview' | 'acts' | 'sequences' | 'scenes' | 'shots';

// DnD Types
const ItemTypes = {
  ACT: 'act',
  SEQUENCE: 'sequence',
  SCENE: 'scene',
  SHOT: 'shot',
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function FilmTimeline({ projectId }: FilmTimelineProps) {
  const { getAccessToken } = useAuth();
  
  const [acts, setActs] = useState<Act[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('acts');
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  // Load data from API
  useEffect(() => {
    loadTimelineData();
  }, [projectId]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      // Load Acts
      let loadedActs = await TimelineAPI.getActs(projectId, token);
      
      // If no acts exist, initialize 3-Act structure
      if (loadedActs.length === 0) {
        console.log('No acts found, initializing 3-Act structure...');
        await ShotsAPI.initializeThreeActStructure(projectId, token);
        // Reload acts after initialization
        loadedActs = await TimelineAPI.getActs(projectId, token);
      }
      
      setActs(loadedActs);

      // Load all Sequences for all Acts
      const allSequences: Sequence[] = [];
      for (const act of loadedActs) {
        try {
          const actSequences = await TimelineAPI.getSequences(act.id, token);
          allSequences.push(...actSequences);
        } catch (err) {
          console.error(`Error loading sequences for act ${act.id}:`, err);
        }
      }
      setSequences(allSequences);

      // Load all Scenes for all Sequences
      const allScenes: Scene[] = [];
      for (const sequence of allSequences) {
        try {
          const seqScenes = await TimelineAPI.getScenes(sequence.id, token);
          allScenes.push(...seqScenes);
        } catch (err) {
          console.error(`Error loading scenes for sequence ${sequence.id}:`, err);
        }
      }
      setScenes(allScenes);
      
      // Load all Shots for all Scenes
      const allShots: Shot[] = [];
      for (const scene of allScenes) {
        try {
          const sceneShots = await ShotsAPI.getShots(scene.id, token);
          allShots.push(...sceneShots);
        } catch (err) {
          console.error(`Error loading shots for scene ${scene.id}:`, err);
        }
      }
      setShots(allShots);

      // Load characters for the project
      // TODO: Replace with actual characters API when available
      setCharacters([]);

      // Auto-expand first act
      if (loadedActs.length > 0) {
        setExpandedActs(new Set([loadedActs[0].id]));
      }
    } catch (error) {
      console.error('Error loading timeline data:', error);
      toast.error('Fehler beim Laden der Timeline-Daten');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse
  const toggleAct = (actId: string) => {
    const newSet = new Set(expandedActs);
    if (newSet.has(actId)) {
      newSet.delete(actId);
      // Collapse all sequences in this act
      const actSequences = sequences.filter(s => s && s.actId === actId);
      actSequences.forEach(seq => {
        expandedSequences.delete(seq.id);
        // Collapse all scenes in these sequences
        const seqScenes = scenes.filter(sc => sc && sc.sequenceId === seq.id);
        seqScenes.forEach(scene => expandedScenes.delete(scene.id));
      });
      setExpandedSequences(new Set(expandedSequences));
      setExpandedScenes(new Set(expandedScenes));
    } else {
      newSet.add(actId);
    }
    setExpandedActs(newSet);
  };

  const toggleSequence = (sequenceId: string) => {
    const newSet = new Set(expandedSequences);
    if (newSet.has(sequenceId)) {
      newSet.delete(sequenceId);
      // Collapse all scenes in this sequence
      const seqScenes = scenes.filter(sc => sc && sc.sequenceId === sequenceId);
      seqScenes.forEach(scene => expandedScenes.delete(scene.id));
      setExpandedScenes(new Set(expandedScenes));
    } else {
      newSet.add(sequenceId);
    }
    setExpandedSequences(newSet);
  };

  const toggleScene = (sceneId: string) => {
    const newSet = new Set(expandedScenes);
    if (newSet.has(sceneId)) {
      newSet.delete(sceneId);
    } else {
      newSet.add(sceneId);
    }
    setExpandedScenes(newSet);
  };

  // Expand all based on zoom level
  const handleZoomChange = (level: ZoomLevel) => {
    setZoomLevel(level);
    
    if (level === 'overview') {
      setExpandedActs(new Set());
      setExpandedSequences(new Set());
      setExpandedScenes(new Set());
    } else if (level === 'acts') {
      setExpandedActs(new Set(acts.map(a => a.id)));
      setExpandedSequences(new Set());
      setExpandedScenes(new Set());
    } else if (level === 'sequences') {
      setExpandedActs(new Set(acts.map(a => a.id)));
      setExpandedSequences(new Set(sequences.map(s => s.id)));
      setExpandedScenes(new Set());
    } else if (level === 'scenes') {
      setExpandedActs(new Set(acts.map(a => a.id)));
      setExpandedSequences(new Set(sequences.map(s => s.id)));
      setExpandedScenes(new Set(scenes.map(sc => sc.id)));
    } else if (level === 'shots') {
      setExpandedActs(new Set(acts.map(a => a.id)));
      setExpandedSequences(new Set(sequences.map(s => s.id)));
      setExpandedScenes(new Set(scenes.map(sc => sc.id)));
    }
  };

  const handleAddAct = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const newAct = await TimelineAPI.createAct(projectId, {
        actNumber: acts.length + 1,
        title: `Act ${acts.length + 1}`,
        color: '#6E59A5',
      }, token);

      setActs([...acts, newAct]);
      toast.success('Act erstellt');
    } catch (error) {
      console.error('Error creating act:', error);
      toast.error('Fehler beim Erstellen des Acts');
    }
  };

  const handleAddSequence = async (actId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const actSequences = sequences.filter(s => s && s.actId === actId);
      const newSequence = await TimelineAPI.createSequence(actId, {
        sequenceNumber: actSequences.length + 1,
        title: `Sequence ${actSequences.length + 1}`,
        color: '#98E5B4',
      }, token);

      setSequences([...sequences, newSequence]);
      setExpandedActs(new Set([...expandedActs, actId]));
      toast.success('Sequenz erstellt');
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Fehler beim Erstellen der Sequenz');
    }
  };

  const handleAddScene = async (sequenceId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const seqScenes = scenes.filter(s => s && s.sequenceId === sequenceId);
      const newScene = await TimelineAPI.createScene(sequenceId, {
        number: scenes.length + 1,
        title: `Scene ${scenes.length + 1}`,
      }, token);

      setScenes([...scenes, newScene]);
      setExpandedSequences(new Set([...expandedSequences, sequenceId]));
      toast.success('Szene erstellt');
    } catch (error) {
      console.error('Error creating scene:', error);
      toast.error('Fehler beim Erstellen der Szene');
    }
  };

  const handleAddShot = async (sceneId: string) => {
    console.log('[Timeline] handleAddShot called with sceneId:', sceneId);
    try {
      const token = await getAccessToken();
      console.log('[Timeline] Got token:', token ? 'yes' : 'no');
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const sceneShots = shots.filter(s => s && s.sceneId === sceneId);
      console.log('[Timeline] Creating shot for scene:', sceneId, 'Current shots:', sceneShots.length);
      
      const newShot = await ShotsAPI.createShot(sceneId, {
        shotNumber: `${sceneShots.length + 1}`,
        cameraAngle: 'medium',
        cameraMovement: 'static',
        lens: '50mm',
      }, token);

      console.log('[Timeline] Shot created:', newShot);
      setShots([...shots, newShot]);
      setExpandedScenes(new Set([...expandedScenes, sceneId]));
      toast.success('Shot erstellt');
    } catch (error) {
      console.error('Error creating shot:', error);
      toast.error('Fehler beim Erstellen des Shots');
    }
  };

  // Shot Handlers
  const handleShotUpdate = async (shotId: string, updates: Partial<Shot>) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const updatedShot = await ShotsAPI.updateShot(shotId, updates, token);
      setShots(shots.map(s => s.id === shotId ? updatedShot : s));
      toast.success('Shot aktualisiert');
    } catch (error) {
      console.error('Error updating shot:', error);
      toast.error('Fehler beim Aktualisieren des Shots');
    }
  };

  const handleShotDelete = async (shotId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      await ShotsAPI.deleteShot(shotId, token);
      setShots(shots.filter(s => s.id !== shotId));
      toast.success('Shot gelöscht');
    } catch (error) {
      console.error('Error deleting shot:', error);
      toast.error('Fehler beim Löschen des Shots');
    }
  };

  const handleShotReorder = async (sceneId: string, shotIds: string[]) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await ShotsAPI.reorderShots(sceneId, shotIds, token);
      // Reload shots for this scene
      const updatedShots = await ShotsAPI.getShots(sceneId, token);
      setShots([...shots.filter(s => s && s.sceneId !== sceneId), ...updatedShots]);
    } catch (error) {
      console.error('Error reordering shots:', error);
      toast.error('Fehler beim Umsortieren der Shots');
    }
  };

  const handleImageUpload = async (shotId: string, file: File) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const result = await ShotsAPI.uploadShotImage(shotId, file, token);
      setShots(shots.map(s => s.id === shotId ? { ...s, imageUrl: result.url } : s));
      toast.success('Bild hochgeladen');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Fehler beim Hochladen des Bildes');
    }
  };

  const handleAudioUpload = async (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      const audioFile = await ShotsAPI.uploadShotAudio(shotId, file, type, label, token);
      
      // Reload shot to get updated audioFiles array
      const sceneId = shots.find(s => s && s.id === shotId)?.sceneId;
      if (sceneId) {
        const updatedShots = await ShotsAPI.getShots(sceneId, token);
        setShots([...shots.filter(s => s && s.sceneId !== sceneId), ...updatedShots]);
      }
      
      toast.success('Audio hochgeladen');
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Fehler beim Hochladen der Audio-Datei');
    }
  };

  const handleAudioDelete = async (audioId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      await ShotsAPI.deleteShotAudio(audioId, token);
      
      // Reload all shots to update audioFiles
      const allShots: Shot[] = [];
      for (const scene of scenes) {
        const sceneShots = await ShotsAPI.getShots(scene.id, token);
        allShots.push(...sceneShots);
      }
      setShots(allShots);
      
      toast.success('Audio gelöscht');
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Fehler beim Löschen der Audio-Datei');
    }
  };

  const handleCharacterAdd = async (shotId: string, characterId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      await ShotsAPI.addCharacterToShot(shotId, characterId, token);
      
      // Reload shot to get updated characters
      const sceneId = shots.find(s => s && s.id === shotId)?.sceneId;
      if (sceneId) {
        const updatedShots = await ShotsAPI.getShots(sceneId, token);
        setShots([...shots.filter(s => s && s.sceneId !== sceneId), ...updatedShots]);
      }
      
      toast.success('Character hinzugefügt');
    } catch (error) {
      console.error('Error adding character:', error);
      toast.error('Fehler beim Hinzufügen des Characters');
    }
  };

  const handleCharacterRemove = async (shotId: string, characterId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        toast.error('Nicht angemeldet');
        return;
      }

      await ShotsAPI.removeCharacterFromShot(shotId, characterId, token);
      
      // Reload shot to get updated characters
      const sceneId = shots.find(s => s && s.id === shotId)?.sceneId;
      if (sceneId) {
        const updatedShots = await ShotsAPI.getShots(sceneId, token);
        setShots([...shots.filter(s => s && s.sceneId !== sceneId), ...updatedShots]);
      }
      
      toast.success('Character entfernt');
    } catch (error) {
      console.error('Error removing character:', error);
      toast.error('Fehler beim Entfernen des Characters');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Film className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Lade Timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full">
        {/* Header with Zoom Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-gray-500 text-sm">
              {acts.length} Acts • {sequences.length} Sequenzen • {scenes.length} Szenen • {shots.length} Shots
            </p>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <Button
                variant={zoomLevel === 'overview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleZoomChange('overview')}
                className="h-7 px-2 text-xs"
              >
                <Maximize2 className="w-3 h-3 mr-1" />
                Overview
              </Button>
              <Button
                variant={zoomLevel === 'acts' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleZoomChange('acts')}
                className="h-7 px-2 text-xs"
              >
                Acts
              </Button>
              <Button
                variant={zoomLevel === 'sequences' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleZoomChange('sequences')}
                className="h-7 px-2 text-xs"
              >
                Sequenzen
              </Button>
              <Button
                variant={zoomLevel === 'scenes' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleZoomChange('scenes')}
                className="h-7 px-2 text-xs"
              >
                Szenen
              </Button>
              <Button
                variant={zoomLevel === 'shots' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleZoomChange('shots')}
                className="h-7 px-2 text-xs"
              >
                <ZoomIn className="w-3 h-3 mr-1" />
                Shots
              </Button>
            </div>
            
            <Button onClick={handleAddAct} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Act
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {acts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Film className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="font-semibold mb-2">Noch keine Acts</h3>
              <p className="text-gray-500 text-sm mb-4">
                Erstelle deinen ersten Act, um dein Film zu strukturieren.
              </p>
              <Button onClick={handleAddAct} size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Ersten Act erstellen
              </Button>
            </div>
          ) : (
            acts.map((act) => (
              <ActContainer
                key={act.id}
                act={act}
                sequences={sequences.filter(s => s && s.actId === act.id)}
                scenes={scenes}
                shots={shots}
                isExpanded={expandedActs.has(act.id)}
                expandedSequences={expandedSequences}
                expandedScenes={expandedScenes}
                onToggle={() => toggleAct(act.id)}
                onToggleSequence={toggleSequence}
                onToggleScene={toggleScene}
                onAddSequence={() => handleAddSequence(act.id)}
                onAddScene={handleAddScene}
                onAddShot={handleAddShot}
                projectCharacters={characters}
                onShotUpdate={handleShotUpdate}
                onShotDelete={handleShotDelete}
                onShotReorder={handleShotReorder}
                onImageUpload={handleImageUpload}
                onAudioUpload={handleAudioUpload}
                onAudioDelete={handleAudioDelete}
                onCharacterAdd={handleCharacterAdd}
                onCharacterRemove={handleCharacterRemove}
              />
            ))
          )}
        </div>
      </div>
    </DndProvider>
  );
}

// =====================================================
// ACT CONTAINER (3D Layer Effect)
// =====================================================

interface ActContainerProps {
  act: Act;
  sequences: Sequence[];
  scenes: Scene[];
  shots: Shot[];
  isExpanded: boolean;
  expandedSequences: Set<string>;
  expandedScenes: Set<string>;
  onToggle: () => void;
  onToggleSequence: (id: string) => void;
  onToggleScene: (id: string) => void;
  onAddSequence: () => void;
  onAddScene: (sequenceId: string) => void;
  onAddShot: (sceneId: string) => void;
  projectCharacters: Character[];
  onShotUpdate: (shotId: string, updates: Partial<Shot>) => void;
  onShotDelete: (shotId: string) => void;
  onShotReorder: (sceneId: string, shotIds: string[]) => void;
  onImageUpload: (shotId: string, file: File) => void;
  onAudioUpload: (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => void;
  onAudioDelete: (audioId: string) => void;
  onCharacterAdd: (shotId: string, characterId: string) => void;
  onCharacterRemove: (shotId: string, characterId: string) => void;
}

function ActContainer({
  act,
  sequences,
  scenes,
  shots,
  isExpanded,
  expandedSequences,
  expandedScenes,
  onToggle,
  onToggleSequence,
  onToggleScene,
  onAddSequence,
  onAddScene,
  onAddShot,
  projectCharacters,
  onShotUpdate,
  onShotDelete,
  onShotReorder,
  onImageUpload,
  onAudioUpload,
  onAudioDelete,
  onCharacterAdd,
  onCharacterRemove,
}: ActContainerProps) {
  return (
    <div className="relative">
      {/* Act Header (Always visible, 3D layer base) */}
      <div
        className="rounded-lg p-4 cursor-pointer transition-all hover:shadow-md"
        style={{ backgroundColor: act.color || '#6E59A5' }}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <div>
              <h3 className="font-semibold">Act {act.actNumber}</h3>
              {act.title && <p className="text-sm opacity-90">{act.title}</p>}
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {sequences.length} Sequenzen
          </Badge>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 ml-6 space-y-3">
          {sequences.length === 0 ? (
            <div className="p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Noch keine Sequenzen</p>
              <Button variant="outline" size="sm" onClick={onAddSequence}>
                <Plus className="w-4 h-4 mr-1" />
                Erste Sequenz hinzufügen
              </Button>
            </div>
          ) : (
            <>
              {sequences.map((sequence) => (
                <SequenceContainer
                  key={sequence.id}
                  sequence={sequence}
                  scenes={scenes.filter(s => s && s.sequenceId === sequence.id)}
                  shots={shots}
                  isExpanded={expandedSequences.has(sequence.id)}
                  expandedScenes={expandedScenes}
                  onToggle={() => onToggleSequence(sequence.id)}
                  onToggleScene={onToggleScene}
                  onAddScene={() => onAddScene(sequence.id)}
                  onAddShot={onAddShot}
                  projectCharacters={projectCharacters}
                  onShotUpdate={onShotUpdate}
                  onShotDelete={onShotDelete}
                  onShotReorder={onShotReorder}
                  onImageUpload={onImageUpload}
                  onAudioUpload={onAudioUpload}
                  onAudioDelete={onAudioDelete}
                  onCharacterAdd={onCharacterAdd}
                  onCharacterRemove={onCharacterRemove}
                />
              ))}
              <Button variant="outline" size="sm" onClick={onAddSequence} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                Sequenz hinzufügen
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SEQUENCE CONTAINER (3D Layer Level 2)
// =====================================================

interface SequenceContainerProps {
  sequence: Sequence;
  scenes: Scene[];
  shots: Shot[];
  isExpanded: boolean;
  expandedScenes: Set<string>;
  onToggle: () => void;
  onToggleScene: (id: string) => void;
  onAddScene: () => void;
  onAddShot: (sceneId: string) => void;
  projectCharacters: Character[];
  onShotUpdate: (shotId: string, updates: Partial<Shot>) => void;
  onShotDelete: (shotId: string) => void;
  onShotReorder: (sceneId: string, shotIds: string[]) => void;
  onImageUpload: (shotId: string, file: File) => void;
  onAudioUpload: (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => void;
  onAudioDelete: (audioId: string) => void;
  onCharacterAdd: (shotId: string, characterId: string) => void;
  onCharacterRemove: (shotId: string, characterId: string) => void;
}

function SequenceContainer({
  sequence,
  scenes,
  shots,
  isExpanded,
  expandedScenes,
  onToggle,
  onToggleScene,
  onAddScene,
  onAddShot,
  projectCharacters,
  onShotUpdate,
  onShotDelete,
  onShotReorder,
  onImageUpload,
  onAudioUpload,
  onAudioDelete,
  onCharacterAdd,
  onCharacterRemove,
}: SequenceContainerProps) {
  return (
    <div className="relative">
      {/* Sequence Header (3D Layer 2) */}
      <div
        className="rounded-lg p-3 cursor-pointer transition-all hover:shadow-md"
        style={{ backgroundColor: sequence.color || '#98E5B4' }}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between text-gray-800">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <div>
              <h4 className="font-semibold text-sm">Sequence {sequence.sequenceNumber}</h4>
              {sequence.title && <p className="text-xs opacity-80">{sequence.title}</p>}
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/40">
            {scenes.length} Szenen
          </Badge>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 ml-6 space-y-2">
          {scenes.length === 0 ? (
            <div className="p-3 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Noch keine Szenen</p>
              <Button variant="outline" size="sm" onClick={onAddScene}>
                <Plus className="w-3 h-3 mr-1" />
                Erste Szene hinzufügen
              </Button>
            </div>
          ) : (
            <>
              {scenes.filter(scene => scene && scene.id).map((scene) => (
                <SceneContainer
                  key={scene.id}
                  scene={scene}
                  shots={shots.filter(s => s && s.sceneId === scene.id)}
                  isExpanded={expandedScenes.has(scene.id)}
                  onToggle={() => onToggleScene(scene.id)}
                  onAddShot={() => onAddShot(scene.id)}
                  projectId={scene.projectId}
                  projectCharacters={projectCharacters}
                  onShotUpdate={onShotUpdate}
                  onShotDelete={onShotDelete}
                  onShotReorder={onShotReorder}
                  onImageUpload={onImageUpload}
                  onAudioUpload={onAudioUpload}
                  onAudioDelete={onAudioDelete}
                  onCharacterAdd={onCharacterAdd}
                  onCharacterRemove={onCharacterRemove}
                />
              ))}
              <Button variant="outline" size="sm" onClick={onAddScene} className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Szene hinzufügen
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SCENE CONTAINER (3D Layer Level 3)
// =====================================================

interface SceneContainerProps {
  scene: Scene;
  shots: Shot[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddShot: () => void;
  projectId: string;
  projectCharacters: Character[];
  onShotUpdate: (shotId: string, updates: Partial<Shot>) => void;
  onShotDelete: (shotId: string) => void;
  onShotReorder: (sceneId: string, shotIds: string[]) => void;
  onImageUpload: (shotId: string, file: File) => void;
  onAudioUpload: (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => void;
  onAudioDelete: (audioId: string) => void;
  onCharacterAdd: (shotId: string, characterId: string) => void;
  onCharacterRemove: (shotId: string, characterId: string) => void;
}

function SceneContainer({
  scene,
  shots,
  isExpanded,
  onToggle,
  onAddShot,
  projectId,
  projectCharacters,
  onShotUpdate,
  onShotDelete,
  onShotReorder,
  onImageUpload,
  onAudioUpload,
  onAudioDelete,
  onCharacterAdd,
  onCharacterRemove,
}: SceneContainerProps) {
  return (
    <div className="relative">
      {/* Scene Header (3D Layer 3) */}
      <div
        className="rounded-lg p-3 cursor-pointer transition-all hover:shadow-md bg-pink-100 border border-pink-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-pink-700" />
            ) : (
              <ChevronRight className="w-4 h-4 text-pink-700" />
            )}
            <div>
              <h5 className="font-semibold text-sm text-pink-900">Scene {scene.number}</h5>
              <div className="flex items-center gap-2 text-xs text-pink-700">
                {scene.title && <span>{scene.title}</span>}
                {scene.location && <span>• {scene.location}</span>}
                {scene.timeOfDay && <span>• {scene.timeOfDay}</span>}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-pink-200 text-pink-800">
            {shots.length} Shots
          </Badge>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 ml-6 space-y-2">
          {shots.length === 0 ? (
            <div className="p-3 border-2 border-dashed rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Noch keine Shots</p>
              <Button variant="outline" size="sm" onClick={onAddShot}>
                <Plus className="w-3 h-3 mr-1" />
                Ersten Shot hinzufügen
              </Button>
            </div>
          ) : (
            <>
              {shots.map((shot) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  sceneId={scene.id}
                  projectId={projectId}
                  projectCharacters={projectCharacters}
                  onUpdate={(updates) => onShotUpdate(shot.id, updates)}
                  onDelete={() => onShotDelete(shot.id)}
                  onReorder={(shotIds) => onShotReorder(scene.id, shotIds)}
                  onImageUpload={(file) => onImageUpload(shot.id, file)}
                  onAudioUpload={(file, type, label) => onAudioUpload(shot.id, file, type, label)}
                  onAudioDelete={onAudioDelete}
                  onCharacterAdd={(characterId) => onCharacterAdd(shot.id, characterId)}
                  onCharacterRemove={(characterId) => onCharacterRemove(shot.id, characterId)}
                />
              ))}
              <Button variant="outline" size="sm" onClick={onAddShot} className="w-full">
                <Plus className="w-3 h-3 mr-1" />
                Shot hinzufügen
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


