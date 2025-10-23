import React from 'react';
import { TimelineAct } from '../types';
import { ContainerAct } from '../containers/ContainerAct';
import { ContainerSequence } from '../containers/ContainerSequence';
import { ContainerScene } from '../containers/ContainerScene';
import { ContainerShot } from '../containers/ContainerShot';

interface FilmTemplateProps {
  acts: TimelineAct[];
  collapseState: {
    acts: Record<string, boolean>;
    sequences: Record<string, boolean>;
    scenes: Record<string, boolean>;
    shots: Record<string, boolean>;
  };
  onToggleCollapse: (type: string, id: string) => void;
  onActNameChange: (actId: string, name: string) => void;
  onSequenceNameChange: (sequenceId: string, name: string) => void;
  onSceneNameChange: (sceneId: string, name: string) => void;
  onShotNameChange: (shotId: string, name: string) => void;
  onActDelete: (actId: string) => void;
  onSequenceDelete: (sequenceId: string) => void;
  onSceneDelete: (sceneId: string) => void;
  onShotDelete: (shotId: string) => void;
  onAddSequence: (actId: string) => void;
  onAddScene: (sequenceId: string) => void;
  onAddShot: (sceneId: string) => void;
}

export function FilmTemplate({
  acts,
  collapseState,
  onToggleCollapse,
  onActNameChange,
  onSequenceNameChange,
  onSceneNameChange,
  onShotNameChange,
  onActDelete,
  onSequenceDelete,
  onSceneDelete,
  onShotDelete,
  onAddSequence,
  onAddScene,
  onAddShot,
}: FilmTemplateProps) {
  return (
    <div className="space-y-4">
      {acts.map((act) => (
        <ContainerAct
          key={act.id}
          id={act.id}
          actNumber={act.act_number}
          name={act.name}
          isCollapsed={collapseState.acts[act.id]}
          onToggleCollapse={() => onToggleCollapse('acts', act.id)}
          onNameChange={(name) => onActNameChange(act.id, name)}
          onDelete={() => onActDelete(act.id)}
          onAddSequence={() => onAddSequence(act.id)}
        >
          <div className="space-y-4">
            {act.sequences.map((sequence) => (
              <ContainerSequence
                key={sequence.id}
                id={sequence.id}
                sequenceNumber={sequence.sequence_number}
                name={sequence.name}
                isCollapsed={collapseState.sequences[sequence.id]}
                onToggleCollapse={() => onToggleCollapse('sequences', sequence.id)}
                onNameChange={(name) => onSequenceNameChange(sequence.id, name)}
                onDelete={() => onSequenceDelete(sequence.id)}
                onAddScene={() => onAddScene(sequence.id)}
              >
                <div className="space-y-4">
                  {sequence.scenes.map((scene) => (
                    <ContainerScene
                      key={scene.id}
                      id={scene.id}
                      sceneNumber={scene.scene_number}
                      name={scene.name}
                      isCollapsed={collapseState.scenes[scene.id]}
                      onToggleCollapse={() => onToggleCollapse('scenes', scene.id)}
                      onNameChange={(name) => onSceneNameChange(scene.id, name)}
                      onDelete={() => onSceneDelete(scene.id)}
                      onAddShot={() => onAddShot(scene.id)}
                    >
                      <div className="space-y-4">
                        {scene.shots.map((shot) => (
                          <ContainerShot
                            key={shot.id}
                            id={shot.id}
                            shotNumber={shot.shot_number}
                            name={shot.name}
                            isCollapsed={collapseState.shots[shot.id]}
                            onToggleCollapse={() => onToggleCollapse('shots', shot.id)}
                            onNameChange={(name) => onShotNameChange(shot.id, name)}
                            onDelete={() => onShotDelete(shot.id)}
                          />
                        ))}
                      </div>
                    </ContainerScene>
                  ))}
                </div>
              </ContainerSequence>
            ))}
          </div>
        </ContainerAct>
      ))}
    </div>
  );
}
