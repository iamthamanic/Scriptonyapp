/**
 * 📱 BOOK DROPDOWN MOBILE - Flache Akkordeon-Struktur für Bücher auf Mobile
 * 
 * Optimiert für Touch-Interaktion und schmale Screens
 * - Flache Liste: Akte > Kapitel > Abschnitte
 * - Große Touch-Targets (min 44x44px)
 * - Swipe-Gesten für Actions
 * - Vereinfachte Navigation
 */

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, MoreVertical, Edit, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from './ui/utils';
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
import { ReadonlyTiptapView } from './ReadonlyTiptapView';
import type { Act, Sequence, Scene } from '../lib/types';
import { toast } from 'sonner';

interface BookDropdownMobileProps {
  acts: Act[];
  sequences: Sequence[];
  scenes: Scene[];
  onAddAct: () => void;
  onAddSequence: (actId: string) => void;
  onAddScene: (sequenceId: string) => void;
  onUpdateAct: (actId: string, updates: Partial<Act>) => void;
  onUpdateSequence: (sequenceId: string, updates: Partial<Sequence>) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteAct: (actId: string) => void;
  onDeleteSequence: (sequenceId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onEditSceneContent: (sceneId: string) => void;
  projectId: string;
  projectType?: string;
}

export function BookDropdownMobile({
  acts,
  sequences,
  scenes,
  onAddAct,
  onAddSequence,
  onAddScene,
  onUpdateAct,
  onUpdateSequence,
  onUpdateScene,
  onDeleteAct,
  onDeleteSequence,
  onDeleteScene,
  onEditSceneContent,
  projectId,
  projectType = 'book',
}: BookDropdownMobileProps) {
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'act' | 'sequence' | 'scene' } | null>(null);
  const [statsNode, setStatsNode] = useState<{ id: string; type: string; title: string } | null>(null);

  const toggleAct = useCallback((actId: string) => {
    setExpandedActs(prev => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  }, []);

  const toggleSequence = useCallback((sequenceId: string) => {
    setExpandedSequences(prev => {
      const next = new Set(prev);
      if (next.has(sequenceId)) {
        next.delete(sequenceId);
      } else {
        next.add(sequenceId);
      }
      return next;
    });
  }, []);

  const toggleScene = useCallback((sceneId: string) => {
    setExpandedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  }, []);

  const getActLabel = () => {
    switch (projectType) {
      case 'audiobook': return 'Akt';
      default: return 'Akt';
    }
  };

  const getSequenceLabel = () => {
    switch (projectType) {
      case 'audiobook': return 'Kapitel';
      default: return 'Kapitel';
    }
  };

  const getSceneLabel = () => {
    switch (projectType) {
      case 'audiobook': return 'Abschnitt';
      default: return 'Abschnitt';
    }
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Mobile Header mit Add Button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-3">
        <Button 
          onClick={onAddAct}
          className="w-full h-12 text-base"
          variant="outline"
        >
          <Plus className="mr-2 h-5 w-5" />
          {getActLabel()} hinzufügen
        </Button>
      </div>

      {/* Acts Liste */}
      {acts.map((act) => {
        const actSequences = sequences.filter(s => s.actId === act.id);
        const isActExpanded = expandedActs.has(act.id);

        return (
          <Collapsible
            key={act.id}
            open={isActExpanded}
            onOpenChange={() => toggleAct(act.id)}
            className="border rounded-lg bg-card"
          >
            <div className="p-3">
              {/* Act Header - Touch-optimiert (min 44px) */}
              <div className="flex items-center gap-2 min-h-[44px]">
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-11 w-11 p-0 shrink-0"
                  >
                    {isActExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                {editingItem?.id === act.id && editingItem.type === 'act' ? (
                  <Input
                    defaultValue={act.title}
                    autoFocus
                    onBlur={(e) => {
                      onUpdateAct(act.id, { title: e.target.value });
                      setEditingItem(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onUpdateAct(act.id, { title: e.currentTarget.value });
                        setEditingItem(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingItem(null);
                      }
                    }}
                    className="flex-1 h-11"
                  />
                ) : (
                  <button
                    onClick={() => setEditingItem({ id: act.id, type: 'act' })}
                    className="flex-1 text-left px-2 py-2 rounded hover:bg-accent min-h-[44px] flex items-center"
                  >
                    <span className="font-medium">{act.title || `${getActLabel()} ${act.actNumber}`}</span>
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-11 w-11 p-0 shrink-0"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditingItem({ id: act.id, type: 'act' })}>
                      <Edit className="mr-2 h-4 w-4" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatsNode({ id: act.id, type: 'act', title: act.title })}>
                      <Info className="mr-2 h-4 w-4" />
                      Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm(`${getActLabel()} "${act.title}" wirklich löschen?`)) {
                          onDeleteAct(act.id);
                        }
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Act Metadata */}
              {act.description && (
                <p className="text-sm text-muted-foreground mt-2 px-2">
                  {act.description}
                </p>
              )}

              <CollapsibleContent>
                <div className="mt-3 space-y-3">
                  {/* Add Sequence Button */}
                  <Button
                    onClick={() => onAddSequence(act.id)}
                    variant="outline"
                    size="sm"
                    className="w-full h-11"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {getSequenceLabel()} hinzufügen
                  </Button>

                  {/* Kapitel (Sequences) */}
                  {actSequences.map((sequence) => {
                    const sequenceScenes = scenes.filter(sc => sc.sequenceId === sequence.id);
                    const isSequenceExpanded = expandedSequences.has(sequence.id);

                    return (
                      <Collapsible
                        key={sequence.id}
                        open={isSequenceExpanded}
                        onOpenChange={() => toggleSequence(sequence.id)}
                        className="border rounded-md bg-background/50 ml-4"
                      >
                        <div className="p-2">
                          {/* Kapitel Header */}
                          <div className="flex items-center gap-2 min-h-[44px]">
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-10 w-10 p-0 shrink-0"
                              >
                                {isSequenceExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>

                            {editingItem?.id === sequence.id && editingItem.type === 'sequence' ? (
                              <Input
                                defaultValue={sequence.title}
                                autoFocus
                                onBlur={(e) => {
                                  onUpdateSequence(sequence.id, { title: e.target.value });
                                  setEditingItem(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onUpdateSequence(sequence.id, { title: e.currentTarget.value });
                                    setEditingItem(null);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingItem(null);
                                  }
                                }}
                                className="flex-1 h-10"
                              />
                            ) : (
                              <button
                                onClick={() => setEditingItem({ id: sequence.id, type: 'sequence' })}
                                className="flex-1 text-left px-2 py-2 rounded hover:bg-accent min-h-[44px] flex items-center text-sm"
                              >
                                {sequence.title || `${getSequenceLabel()} ${sequence.sequenceNumber}`}
                              </button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-10 w-10 p-0 shrink-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setEditingItem({ id: sequence.id, type: 'sequence' })}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatsNode({ id: sequence.id, type: 'sequence', title: sequence.title })}>
                                  <Info className="mr-2 h-4 w-4" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (confirm(`${getSequenceLabel()} "${sequence.title}" wirklich löschen?`)) {
                                      onDeleteSequence(sequence.id);
                                    }
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <CollapsibleContent>
                            <div className="mt-2 space-y-2">
                              {/* Add Scene Button */}
                              <Button
                                onClick={() => onAddScene(sequence.id)}
                                variant="outline"
                                size="sm"
                                className="w-full h-10"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {getSceneLabel()} hinzufügen
                              </Button>

                              {/* Abschnitte (Scenes) */}
                              {sequenceScenes.map((scene) => {
                                const isSceneExpanded = expandedScenes.has(scene.id);

                                return (
                                  <Collapsible
                                    key={scene.id}
                                    open={isSceneExpanded}
                                    onOpenChange={() => toggleScene(scene.id)}
                                    className="border rounded-md bg-card ml-4"
                                  >
                                    <div className="p-2">
                                      {/* Scene Header */}
                                      <div className="flex items-center gap-2 min-h-[44px]">
                                        <CollapsibleTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="h-10 w-10 p-0 shrink-0"
                                          >
                                            {isSceneExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </CollapsibleTrigger>

                                        {editingItem?.id === scene.id && editingItem.type === 'scene' ? (
                                          <Input
                                            defaultValue={scene.title}
                                            autoFocus
                                            onBlur={(e) => {
                                              onUpdateScene(scene.id, { title: e.target.value });
                                              setEditingItem(null);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                onUpdateScene(scene.id, { title: e.currentTarget.value });
                                                setEditingItem(null);
                                              }
                                              if (e.key === 'Escape') {
                                                setEditingItem(null);
                                              }
                                            }}
                                            className="flex-1 h-10"
                                          />
                                        ) : (
                                          <button
                                            onClick={() => setEditingItem({ id: scene.id, type: 'scene' })}
                                            className="flex-1 text-left px-2 py-2 rounded hover:bg-accent min-h-[44px] flex items-center text-sm"
                                          >
                                            {scene.title || `${getSceneLabel()} ${scene.sceneNumber}`}
                                          </button>
                                        )}

                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              className="h-10 w-10 p-0 shrink-0"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => setEditingItem({ id: scene.id, type: 'scene' })}>
                                              <Edit className="mr-2 h-4 w-4" />
                                              Titel bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEditSceneContent(scene.id)}>
                                              <Edit className="mr-2 h-4 w-4" />
                                              Text bearbeiten
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setStatsNode({ id: scene.id, type: 'scene', title: scene.title })}>
                                              <Info className="mr-2 h-4 w-4" />
                                              Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => {
                                                if (confirm(`${getSceneLabel()} "${scene.title}" wirklich löschen?`)) {
                                                  onDeleteScene(scene.id);
                                                }
                                              }}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Löschen
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>

                                      {/* Scene Content Preview */}
                                      <CollapsibleContent>
                                        <div className="mt-2 ml-4">
                                          {scene.content ? (
                                            <div 
                                              className="bg-background/50 rounded-md p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                                              onClick={() => onEditSceneContent(scene.id)}
                                            >
                                              <ReadonlyTiptapView content={scene.content} maxHeight="150px" />
                                              <div className="text-xs text-muted-foreground mt-2 text-right">
                                                Tippen zum Bearbeiten
                                              </div>
                                            </div>
                                          ) : (
                                            <Button
                                              onClick={() => onEditSceneContent(scene.id)}
                                              variant="outline"
                                              size="sm"
                                              className="w-full h-10"
                                            >
                                              <Edit className="mr-2 h-4 w-4" />
                                              Text hinzufügen
                                            </Button>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {/* Stats Dialog */}
      {statsNode && (
        <TimelineNodeStatsDialog
          nodeId={statsNode.id}
          nodeType={statsNode.type}
          nodeTitle={statsNode.title}
          isOpen={true}
          onClose={() => setStatsNode(null)}
        />
      )}
    </div>
  );
}
