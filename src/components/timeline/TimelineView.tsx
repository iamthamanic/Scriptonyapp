import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';
import { getUserAccessToken } from '../../utils/supabase/client';
import { TimelineAct, ProjectType, CollapseState } from './types';
import { getTemplate } from './templates/TemplateRegistry';
import { FilmTemplate } from './templates/FilmTemplate';
import { LoadingSpinner } from '../LoadingSpinner';

interface TimelineViewProps {
  projectId: string;
  projectType?: ProjectType;
}

export function TimelineView({ projectId: userProjectId, projectType = 'film' }: TimelineViewProps) {
  const [acts, setActs] = useState<TimelineAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapseState, setCollapseState] = useState<CollapseState>({
    acts: {},
    sequences: {},
    scenes: {},
    shots: {},
  });

  const template = getTemplate(projectType);
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;

  // Helper: Get auth headers
  const getAuthHeaders = async () => {
    const token = await getUserAccessToken();
    if (!token) {
      toast.error('Nicht angemeldet');
      throw new Error('No auth token');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/projects/${userProjectId}/acts`, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }

      const data = await response.json();
      setActs(data.acts || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Fehler beim Laden der Timeline');
    } finally {
      setLoading(false);
    }
  }, [userProjectId, baseUrl]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Toggle collapse state
  const handleToggleCollapse = useCallback((type: keyof CollapseState, id: string) => {
    setCollapseState((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [id]: !prev[type][id],
      },
    }));
  }, []);

  // Add Act
  const handleAddAct = useCallback(async () => {
    const actNumber = acts.length + 1;
    const optimisticAct: TimelineAct = {
      id: `temp-act-${Date.now()}`,
      act_number: actNumber,
      name: '',
      project_id: userProjectId,
      sequences: [],
    };

    // Optimistic update
    setActs((prev) => [...prev, optimisticAct]);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/acts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          project_id: userProjectId,
          act_number: actNumber,
          title: `Akt ${String(actNumber).padStart(2, '0')}`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create act');

      const newAct = await response.json();
      // Transform camelCase response to our format
      const transformedAct: TimelineAct = {
        id: newAct.id,
        act_number: newAct.actNumber || actNumber,
        name: newAct.title || '',
        description: newAct.description,
        project_id: userProjectId,
        sequences: [],
      };
      setActs((prev) => prev.map((a) => (a.id === optimisticAct.id ? transformedAct : a)));
      toast.success('Akt hinzugefügt');
    } catch (error) {
      console.error('Error creating act:', error);
      setActs((prev) => prev.filter((a) => a.id !== optimisticAct.id));
      toast.error('Fehler beim Erstellen des Akts');
    }
  }, [acts.length, userProjectId, baseUrl]);

  // Add Sequence
  const handleAddSequence = useCallback(
    async (actId: string) => {
      console.log('🔵 [Timeline v2.0] handleAddSequence called with actId:', actId);
      const act = acts.find((a) => a.id === actId);
      if (!act) {
        console.error('Act not found:', actId);
        toast.error('Akt nicht gefunden');
        return;
      }

      const sequenceNumber = act.sequences.length + 1;
      console.log('[Timeline v2.0] Act found:', { actId, sequencesCount: act.sequences.length, sequenceNumber });
      const optimisticSequence = {
        id: `temp-sequence-${Date.now()}`,
        sequence_number: sequenceNumber,
        name: '',
        act_id: actId,
        project_id: userProjectId,
        scenes: [],
      };

      // Optimistic update
      setActs((prev) =>
        prev.map((a) =>
          a.id === actId ? { ...a, sequences: [...a.sequences, optimisticSequence] } : a
        )
      );

      try {
        const requestBody = {
          act_id: actId,
          sequence_number: sequenceNumber,
          title: `Sequenz ${String(sequenceNumber).padStart(2, '0')}`,
        };
        console.log('🔵 [Timeline v2.0] Creating sequence with:', requestBody);
        console.log('🔵 [Timeline v2.0] Request body stringified:', JSON.stringify(requestBody));

        const headers = await getAuthHeaders();
        console.log('🔵 [Timeline v2.0] Headers:', headers);
        
        const response = await fetch(`${baseUrl}/sequences`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        console.log('🔵 [Timeline v2.0] Response status:', response.status);
        
        if (!response.ok) {
          let errorMessage = response.statusText;
          try {
            const errorData = await response.json();
            console.error('[Timeline] Error response:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Response ist kein JSON, vermutlich HTML Fehlerseite
            const errorText = await response.text();
            console.error('[Timeline] Error text:', errorText);
            errorMessage = errorText.substring(0, 200); // Erste 200 Zeichen
          }
          throw new Error(`Failed to create sequence (${response.status}): ${errorMessage}`);
        }

        const newSequence = await response.json();
        // Transform camelCase response
        const transformedSequence = {
          id: newSequence.id,
          sequence_number: newSequence.sequenceNumber || sequenceNumber,
          name: newSequence.title || '',
          description: newSequence.description,
          act_id: actId,
          project_id: userProjectId,
          scenes: [],
        };
        setActs((prev) =>
          prev.map((a) =>
            a.id === actId
              ? {
                  ...a,
                  sequences: a.sequences.map((s) =>
                    s.id === optimisticSequence.id ? transformedSequence : s
                  ),
                }
              : a
          )
        );
        toast.success('Sequenz hinzugefügt');
      } catch (error) {
        console.error('Error creating sequence:', error);
        setActs((prev) =>
          prev.map((a) =>
            a.id === actId
              ? { ...a, sequences: a.sequences.filter((s) => s.id !== optimisticSequence.id) }
              : a
          )
        );
        toast.error('Fehler beim Erstellen der Sequenz');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  // Add Scene
  const handleAddScene = useCallback(
    async (sequenceId: string) => {
      let targetAct: TimelineAct | undefined;
      let targetSequence;

      for (const act of acts) {
        const seq = act.sequences.find((s) => s.id === sequenceId);
        if (seq) {
          targetAct = act;
          targetSequence = seq;
          break;
        }
      }

      if (!targetAct || !targetSequence) return;

      const sceneNumber = targetSequence.scenes.length + 1;
      const optimisticScene = {
        id: `temp-scene-${Date.now()}`,
        scene_number: sceneNumber,
        name: '',
        sequence_id: sequenceId,
        project_id: userProjectId,
        shots: [],
      };

      // Optimistic update
      setActs((prev) =>
        prev.map((a) =>
          a.id === targetAct!.id
            ? {
                ...a,
                sequences: a.sequences.map((s) =>
                  s.id === sequenceId ? { ...s, scenes: [...s.scenes, optimisticScene] } : s
                ),
              }
            : a
        )
      );

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/scenes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sequence_id: sequenceId,
            scene_number: sceneNumber,
            title: `Szene ${String(sceneNumber).padStart(2, '0')}`,
          }),
        });

        if (!response.ok) throw new Error('Failed to create scene');

        const newScene = await response.json();
        // Transform camelCase response
        const transformedScene = {
          id: newScene.id,
          scene_number: newScene.sceneNumber || sceneNumber,
          name: newScene.title || '',
          description: newScene.description,
          location: newScene.location,
          sequence_id: sequenceId,
          project_id: userProjectId,
          shots: [],
        };
        setActs((prev) =>
          prev.map((a) =>
            a.id === targetAct!.id
              ? {
                  ...a,
                  sequences: a.sequences.map((s) =>
                    s.id === sequenceId
                      ? {
                          ...s,
                          scenes: s.scenes.map((sc) =>
                            sc.id === optimisticScene.id ? transformedScene : sc
                          ),
                        }
                      : s
                  ),
                }
              : a
          )
        );
        toast.success('Szene hinzugefügt');
      } catch (error) {
        console.error('Error creating scene:', error);
        setActs((prev) =>
          prev.map((a) =>
            a.id === targetAct!.id
              ? {
                  ...a,
                  sequences: a.sequences.map((s) =>
                    s.id === sequenceId
                      ? { ...s, scenes: s.scenes.filter((sc) => sc.id !== optimisticScene.id) }
                      : s
                  ),
                }
              : a
          )
        );
        toast.error('Fehler beim Erstellen der Szene');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  // Add Shot
  const handleAddShot = useCallback(
    async (sceneId: string) => {
      let targetAct: TimelineAct | undefined;
      let targetSequence;
      let targetScene;

      for (const act of acts) {
        for (const seq of act.sequences) {
          const scene = seq.scenes.find((sc) => sc.id === sceneId);
          if (scene) {
            targetAct = act;
            targetSequence = seq;
            targetScene = scene;
            break;
          }
        }
        if (targetScene) break;
      }

      if (!targetAct || !targetSequence || !targetScene) return;

      const shotNumber = targetScene.shots.length + 1;
      const optimisticShot = {
        id: `temp-shot-${Date.now()}`,
        shot_number: shotNumber,
        name: '',
        scene_id: sceneId,
        project_id: userProjectId,
      };

      // Optimistic update
      setActs((prev) =>
        prev.map((a) =>
          a.id === targetAct!.id
            ? {
                ...a,
                sequences: a.sequences.map((s) =>
                  s.id === targetSequence!.id
                    ? {
                        ...s,
                        scenes: s.scenes.map((sc) =>
                          sc.id === sceneId ? { ...sc, shots: [...sc.shots, optimisticShot] } : sc
                        ),
                      }
                    : s
                ),
              }
            : a
        )
      );

      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${baseUrl}/shots`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            scene_id: sceneId,
            shot_number: shotNumber,
            description: `Shot ${String(shotNumber).padStart(2, '0')}`,
          }),
        });

        if (!response.ok) throw new Error('Failed to create shot');

        const responseData = await response.json();
        const newShot = responseData.shot || responseData;
        // Transform response
        const transformedShot = {
          id: newShot.id,
          shot_number: newShot.shot_number || shotNumber,
          name: newShot.description || '',
          description: newShot.description,
          camera_movement: newShot.camera_movement,
          duration: newShot.duration,
          scene_id: sceneId,
          project_id: userProjectId,
        };
        setActs((prev) =>
          prev.map((a) =>
            a.id === targetAct!.id
              ? {
                  ...a,
                  sequences: a.sequences.map((s) =>
                    s.id === targetSequence!.id
                      ? {
                          ...s,
                          scenes: s.scenes.map((sc) =>
                            sc.id === sceneId
                              ? {
                                  ...sc,
                                  shots: sc.shots.map((sh) =>
                                    sh.id === optimisticShot.id ? transformedShot : sh
                                  ),
                                }
                              : sc
                          ),
                        }
                      : s
                  ),
                }
              : a
          )
        );
        toast.success('Shot hinzugefügt');
      } catch (error) {
        console.error('Error creating shot:', error);
        setActs((prev) =>
          prev.map((a) =>
            a.id === targetAct!.id
              ? {
                  ...a,
                  sequences: a.sequences.map((s) =>
                    s.id === targetSequence!.id
                      ? {
                          ...s,
                          scenes: s.scenes.map((sc) =>
                            sc.id === sceneId
                              ? { ...sc, shots: sc.shots.filter((sh) => sh.id !== optimisticShot.id) }
                              : sc
                          ),
                        }
                      : s
                  ),
                }
              : a
          )
        );
        toast.error('Fehler beim Erstellen des Shots');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  // Update handlers (name changes)
  const handleActNameChange = useCallback(
    async (actId: string, name: string) => {
      const previousActs = acts;
      setActs((prev) => prev.map((a) => (a.id === actId ? { ...a, name } : a)));

      try {
        const response = await fetch(`${baseUrl}/acts/${actId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: name }),
        });

        if (!response.ok) throw new Error('Failed to update act');
      } catch (error) {
        console.error('Error updating act:', error);
        setActs(previousActs);
        toast.error('Fehler beim Aktualisieren des Akts');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleSequenceNameChange = useCallback(
    async (sequenceId: string, name: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.map((s) => (s.id === sequenceId ? { ...s, name } : s)),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/sequences/${sequenceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: name }),
        });

        if (!response.ok) throw new Error('Failed to update sequence');
      } catch (error) {
        console.error('Error updating sequence:', error);
        setActs(previousActs);
        toast.error('Fehler beim Aktualisieren der Sequenz');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleSceneNameChange = useCallback(
    async (sceneId: string, name: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.map((s) => ({
            ...s,
            scenes: s.scenes.map((sc) => (sc.id === sceneId ? { ...sc, name } : sc)),
          })),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/scenes/${sceneId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: name }),
        });

        if (!response.ok) throw new Error('Failed to update scene');
      } catch (error) {
        console.error('Error updating scene:', error);
        setActs(previousActs);
        toast.error('Fehler beim Aktualisieren der Szene');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleShotNameChange = useCallback(
    async (shotId: string, name: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.map((s) => ({
            ...s,
            scenes: s.scenes.map((sc) => ({
              ...sc,
              shots: sc.shots.map((sh) => (sh.id === shotId ? { ...sh, name } : sh)),
            })),
          })),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/shots/${shotId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: name }),
        });

        if (!response.ok) throw new Error('Failed to update shot');
      } catch (error) {
        console.error('Error updating shot:', error);
        setActs(previousActs);
        toast.error('Fehler beim Aktualisieren des Shots');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  // Delete handlers
  const handleActDelete = useCallback(
    async (actId: string) => {
      const previousActs = acts;
      setActs((prev) => prev.filter((a) => a.id !== actId));

      try {
        const response = await fetch(`${baseUrl}/acts/${actId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete act');
        toast.success('Akt gelöscht');
      } catch (error) {
        console.error('Error deleting act:', error);
        setActs(previousActs);
        toast.error('Fehler beim Löschen des Akts');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleSequenceDelete = useCallback(
    async (sequenceId: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.filter((s) => s.id !== sequenceId),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/sequences/${sequenceId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete sequence');
        toast.success('Sequenz gelöscht');
      } catch (error) {
        console.error('Error deleting sequence:', error);
        setActs(previousActs);
        toast.error('Fehler beim Löschen der Sequenz');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleSceneDelete = useCallback(
    async (sceneId: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.map((s) => ({
            ...s,
            scenes: s.scenes.filter((sc) => sc.id !== sceneId),
          })),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/scenes/${sceneId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete scene');
        toast.success('Szene gelöscht');
      } catch (error) {
        console.error('Error deleting scene:', error);
        setActs(previousActs);
        toast.error('Fehler beim Löschen der Szene');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  const handleShotDelete = useCallback(
    async (shotId: string) => {
      const previousActs = acts;
      setActs((prev) =>
        prev.map((a) => ({
          ...a,
          sequences: a.sequences.map((s) => ({
            ...s,
            scenes: s.scenes.map((sc) => ({
              ...sc,
              shots: sc.shots.filter((sh) => sh.id !== shotId),
            })),
          })),
        }))
      );

      try {
        const response = await fetch(`${baseUrl}/shots/${shotId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (!response.ok) throw new Error('Failed to delete shot');
        toast.success('Shot gelöscht');
      } catch (error) {
        console.error('Error deleting shot:', error);
        setActs(previousActs);
        toast.error('Fehler beim Löschen des Shots');
      }
    },
    [acts, userProjectId, baseUrl]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[#6E59A5]">{template.name}</h2>
          <p className="text-neutral-600">{template.description}</p>
        </div>
        <button
          onClick={handleAddAct}
          className="bg-white border border-[#56cfec] rounded-[5px] px-4 py-2 hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <Plus size={16} className="text-[#56cfec]" />
          <span className="text-[#56cfec]">+ Akt hinzufügen</span>
        </button>
      </div>

      {/* Timeline */}
      {acts.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <p>Noch keine Akte vorhanden.</p>
          <p className="mt-2">Klicke auf "+ Akt hinzufügen" um zu starten.</p>
        </div>
      ) : (
        <FilmTemplate
          acts={acts}
          collapseState={collapseState}
          onToggleCollapse={handleToggleCollapse}
          onActNameChange={handleActNameChange}
          onSequenceNameChange={handleSequenceNameChange}
          onSceneNameChange={handleSceneNameChange}
          onShotNameChange={handleShotNameChange}
          onActDelete={handleActDelete}
          onSequenceDelete={handleSequenceDelete}
          onSceneDelete={handleSceneDelete}
          onShotDelete={handleShotDelete}
          onAddSequence={handleAddSequence}
          onAddScene={handleAddScene}
          onAddShot={handleAddShot}
        />
      )}
    </div>
  );
}
