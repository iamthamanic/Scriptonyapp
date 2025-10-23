import React, { useState } from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import svgPaths from '../../imports/svg-28xpmo6h4i';

interface BaseContainerProps {
  id: string;
  type: 'act' | 'sequence' | 'scene' | 'shot';
  label: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  depth: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNameChange?: (name: string) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  addButtonLabel?: string;
  onAdd?: () => void;
}

export function BaseContainer({
  id,
  type,
  label,
  name,
  color,
  bgColor,
  borderColor,
  depth,
  isCollapsed = false,
  onToggleCollapse,
  onNameChange,
  onDelete,
  children,
  addButtonLabel,
  onAdd,
}: BaseContainerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const handleNameSubmit = () => {
    if (editValue.trim() && onNameChange) {
      onNameChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  // Berechne Einrückung basierend auf Tiefe
  const leftOffset = 30 + depth * 78;
  const width = 342 - depth * 78;

  return (
    <div className="relative">
      {/* Haupt-Container */}
      <div
        className="relative rounded-[5px]"
        style={{
          backgroundColor: bgColor,
          marginLeft: `${leftOffset}px`,
          width: `${width}px`,
          minHeight: isCollapsed ? '77px' : '77px',
        }}
      >
        <div
          aria-hidden="true"
          className="absolute border border-solid inset-[-1px] pointer-events-none rounded-[6px]"
          style={{ borderColor }}
        />

        {/* Container Content */}
        <div className="relative p-2 flex items-start gap-2">
          {/* Collapse/Expand Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex-shrink-0 mt-1 hover:opacity-70 transition-opacity"
            >
              <ChevronDown
                size={12}
                className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
              />
            </button>
          )}

          {/* Label Badge */}
          <div
            className="rounded-[3px] px-2 py-0.5 flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <div
              aria-hidden="true"
              className="absolute border border-black border-solid inset-[-1px] pointer-events-none rounded-[4px]"
            />
            <p className="font-['Inter',_sans-serif] text-[8px] text-black leading-[24px] tracking-[-0.3125px] whitespace-nowrap">
              {label}
            </p>
          </div>

          {/* Name Input */}
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleKeyDown}
                className="w-full bg-white border border-neutral-400 rounded-[2px] px-1.5 py-0.5 text-[8px] text-neutral-700 leading-[24px] tracking-[-0.3125px] focus:outline-none focus:border-neutral-600"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full text-left bg-white border border-neutral-400 rounded-[2px] px-1.5 py-0.5 hover:border-neutral-600 transition-colors"
              >
                <p className="text-[8px] text-neutral-400 leading-[24px] tracking-[-0.3125px] truncate">
                  {name || `${label} Name`}
                </p>
              </button>
            )}
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity text-black"
            >
              <div className="w-3 h-3">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 12">
                  <path
                    d={svgPaths.p33acdb00}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Children (nested containers) */}
      {!isCollapsed && children && <div className="mt-4">{children}</div>}

      {/* Add Button */}
      {!isCollapsed && addButtonLabel && onAdd && (
        <button
          onClick={onAdd}
          className="mt-2 bg-white border border-solid rounded-[5px] px-2 py-1 hover:bg-neutral-50 transition-colors"
          style={{
            marginLeft: `${leftOffset + 78}px`,
            borderColor: color,
          }}
        >
          <p
            className="text-[8px] leading-[24px] tracking-[-0.3125px] whitespace-nowrap"
            style={{ color }}
          >
            {addButtonLabel}
          </p>
        </button>
      )}
    </div>
  );
}
