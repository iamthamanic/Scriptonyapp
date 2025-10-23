import React from 'react';
import { BaseContainer } from '../BaseContainer';

interface ContainerSequenceProps {
  id: string;
  sequenceNumber: number;
  name: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  onAddScene?: () => void;
  children?: React.ReactNode;
}

export function ContainerSequence({
  id,
  sequenceNumber,
  name,
  isCollapsed = false,
  onToggleCollapse,
  onNameChange,
  onDelete,
  onAddScene,
  children,
}: ContainerSequenceProps) {
  return (
    <BaseContainer
      id={id}
      type="sequence"
      label={`Sequenz ${String(sequenceNumber).padStart(2, '0')}`}
      name={name}
      color="#85ea78"
      bgColor="#85ea78"
      borderColor="#bfbfbf"
      depth={1}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onNameChange={onNameChange}
      onDelete={onDelete}
      addButtonLabel="+ Szene hinzufügen"
      onAdd={onAddScene}
    >
      {children}
    </BaseContainer>
  );
}
