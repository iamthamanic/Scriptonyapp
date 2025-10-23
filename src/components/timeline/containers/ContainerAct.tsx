import React from 'react';
import { BaseContainer } from '../BaseContainer';

interface ContainerActProps {
  id: string;
  actNumber: number;
  name: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  onAddSequence?: () => void;
  children?: React.ReactNode;
}

export function ContainerAct({
  id,
  actNumber,
  name,
  isCollapsed = false,
  onToggleCollapse,
  onNameChange,
  onDelete,
  onAddSequence,
  children,
}: ContainerActProps) {
  return (
    <BaseContainer
      id={id}
      type="act"
      label={`Akt ${String(actNumber).padStart(2, '0')}`}
      name={name}
      color="#56cfec"
      bgColor="#56cfec"
      borderColor="#bfbfbf"
      depth={0}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onNameChange={onNameChange}
      onDelete={onDelete}
      addButtonLabel="+ Sequenz hinzufügen"
      onAdd={onAddSequence}
    >
      {children}
    </BaseContainer>
  );
}
