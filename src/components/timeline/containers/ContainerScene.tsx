import React from 'react';
import { BaseContainer } from '../BaseContainer';

interface ContainerSceneProps {
  id: string;
  sceneNumber: number;
  name: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  onAddShot?: () => void;
  children?: React.ReactNode;
}

export function ContainerScene({
  id,
  sceneNumber,
  name,
  isCollapsed = false,
  onToggleCollapse,
  onNameChange,
  onDelete,
  onAddShot,
  children,
}: ContainerSceneProps) {
  return (
    <BaseContainer
      id={id}
      type="scene"
      label={`Szene ${String(sceneNumber).padStart(2, '0')}`}
      name={name}
      color="#ea8778"
      bgColor="#ea8778"
      borderColor="#bfbfbf"
      depth={2}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onNameChange={onNameChange}
      onDelete={onDelete}
      addButtonLabel="+ Shot hinzufügen"
      onAdd={onAddShot}
    >
      {children}
    </BaseContainer>
  );
}
