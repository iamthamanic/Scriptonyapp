import React from 'react';
import { BaseContainer } from '../BaseContainer';

interface ContainerShotProps {
  id: string;
  shotNumber: number;
  name: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
}

export function ContainerShot({
  id,
  shotNumber,
  name,
  isCollapsed = false,
  onToggleCollapse,
  onNameChange,
  onDelete,
}: ContainerShotProps) {
  return (
    <BaseContainer
      id={id}
      type="shot"
      label={`Shot ${String(shotNumber).padStart(2, '0')}`}
      name={name}
      color="#dee1de"
      bgColor="#dee1de"
      borderColor="#bfbfbf"
      depth={3}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onNameChange={onNameChange}
      onDelete={onDelete}
    />
  );
}
