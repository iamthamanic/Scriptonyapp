import { useState } from 'react';
import { Upload, Trash2, X, Music, Volume2 } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import type { Shot, Character, ShotAudio } from '../lib/types';

const ItemTypes = {
  SHOT: 'shot',
};

// =============================================================================
// CINEMATOGRAPHY OPTIONS
// =============================================================================

export const CAMERA_ANGLES = [
  { value: 'Eye Level', label: 'Eye Level (Augenhöhe)' },
  { value: 'High Angle', label: 'High Angle (Aufsicht)' },
  { value: 'Low Angle', label: 'Low Angle (Untersicht)' },
  { value: "Bird's Eye View", label: "Bird's Eye View (Vogelperspektive)" },
  { value: 'Dutch Angle', label: 'Dutch Angle (Schräg)' },
  { value: 'Over-the-Shoulder', label: 'Over-the-Shoulder (Über Schulter)' },
  { value: 'POV', label: 'POV (Point of View)' },
];

export const FRAMING_OPTIONS = [
  { value: 'ECU', label: 'ECU - Extreme Close-Up' },
  { value: 'CU', label: 'CU - Close-Up' },
  { value: 'MCU', label: 'MCU - Medium Close-Up' },
  { value: 'MS', label: 'MS - Medium Shot (Halbnah)' },
  { value: 'MWS', label: 'MWS - Medium Wide Shot (Amerikanische)' },
  { value: 'WS', label: 'WS - Wide Shot (Totale)' },
  { value: 'EWS', label: 'EWS - Extreme Wide Shot (Supertotale)' },
  { value: 'TWO_SHOT', label: 'TWO SHOT - Zwei Personen' },
  { value: 'OTS', label: 'OTS - Over-the-Shoulder' },
];

export const MOVEMENT_OPTIONS = [
  { value: 'Static', label: 'Static (Statisch)' },
  { value: 'Pan', label: 'Pan (Schwenk horizontal)' },
  { value: 'Tilt', label: 'Tilt (Schwenk vertikal)' },
  { value: 'Dolly In', label: 'Dolly In (Heranfahrt)' },
  { value: 'Dolly Out', label: 'Dolly Out (Wegfahrt)' },
  { value: 'Truck', label: 'Truck (Seitwärtsfahrt)' },
  { value: 'Pedestal', label: 'Pedestal (Hoch/Runter)' },
  { value: 'Zoom In', label: 'Zoom In' },
  { value: 'Zoom Out', label: 'Zoom Out' },
  { value: 'Handheld', label: 'Handheld (Handkamera)' },
  { value: 'Steadicam', label: 'Steadicam' },
  { value: 'Crane', label: 'Crane (Kran)' },
  { value: 'Drone', label: 'Drone (Drohne)' },
  { value: 'Whip Pan', label: 'Whip Pan (Schneller Schwenk)' },
];

export const LENS_OPTIONS = [
  { value: '14mm', label: '14mm - Ultra Wide' },
  { value: '24mm', label: '24mm - Wide Angle' },
  { value: '35mm', label: '35mm - Standard Wide' },
  { value: '50mm', label: '50mm - Normal' },
  { value: '85mm', label: '85mm - Portrait' },
  { value: '100mm', label: '100mm - Telephoto' },
  { value: '200mm', label: '200mm - Super Telephoto' },
  { value: 'Fisheye', label: 'Fisheye (Fischauge)' },
  { value: 'Anamorphic', label: 'Anamorphic (Cinemascope)' },
];

// =============================================================================
// SHOT CARD COMPONENT
// =============================================================================

interface ShotCardProps {
  shot: Shot;
  sceneId: string;
  projectId: string;
  projectCharacters?: Character[]; // All characters in project for @-mention
  onUpdate: (shotId: string, updates: Partial<Shot>) => void;
  onDelete: (shotId: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onImageUpload: (shotId: string, file: File) => Promise<void>;
  onAudioUpload: (shotId: string, file: File, type: 'music' | 'sfx', label?: string) => Promise<void>;
  onAudioDelete: (audioId: string) => void;
  onCharacterAdd: (shotId: string, characterId: string) => void;
  onCharacterRemove: (shotId: string, characterId: string) => void;
}

export function ShotCard({
  shot,
  sceneId,
  projectId,
  projectCharacters = [],
  onUpdate,
  onDelete,
  onReorder,
  onImageUpload,
  onAudioUpload,
  onAudioDelete,
  onCharacterAdd,
  onCharacterRemove,
}: ShotCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);

  // Drag & Drop
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SHOT,
    item: { id: shot.id, type: ItemTypes.SHOT },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.SHOT,
    drop: (item: { id: string }) => {
      if (item.id !== shot.id) {
        onReorder(item.id, shot.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine drag and drop refs
  const combinedRef = (node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImageUpload(shot.id, file);
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (type: 'music' | 'sfx', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const label = prompt(`Label for ${type === 'music' ? 'Musik' : 'SFX'}:`);
      await onAudioUpload(shot.id, file, type, label || undefined);
    }
  };

  // Handle @-mention in dialog
  const handleDialogChange = (value: string) => {
    // Check if @ was just typed
    if (value.endsWith('@')) {
      setShowCharacterPicker(true);
    }
    onUpdate(shot.id, { dialog: value });
  };

  // Insert character mention
  const insertCharacterMention = (character: Character) => {
    const currentDialog = shot.dialog || '';
    const newDialog = currentDialog + character.name + ' ';
    onUpdate(shot.id, { dialog: newDialog });
    setShowCharacterPicker(false);
    
    // Also add character to shot if not already there
    if (!shot.characters?.find(c => c.id === character.id)) {
      onCharacterAdd(shot.id, character.id);
    }
  };

  return (
    <div
      ref={combinedRef}
      className={cn(
        'bg-white rounded-[20px] border border-[#bfbfbf] p-6 transition-all',
        isDragging && 'opacity-50',
        isOver && 'ring-2 ring-purple-500 ring-offset-2'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-black">{shot.shotNumber}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(shot.id)}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Image Preview */}
      <div className="mb-4">
        <label className="block mb-2">
          <div className="relative bg-[#f8f3f3] border border-[#bfbfbf] rounded-[20px] h-[86px] w-full flex items-center justify-center cursor-pointer hover:bg-gray-100">
            {shot.imageUrl ? (
              <img
                src={shot.imageUrl}
                alt="Shot preview"
                className="w-full h-full object-cover rounded-[20px]"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload className="w-6 h-6" />
                <span className="text-xs">Bild hochladen</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </label>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#f8f3f3] border border-[#bfbfbf] rounded-[20px] p-4 space-y-4">
        {/* Characters */}
        <div>
          <label className="text-neutral-400 block mb-2">Charakter</label>
          <div className="flex gap-2 flex-wrap">
            {shot.characters?.map((character) => (
              <div key={character.id} className="relative group">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={character.imageUrl} />
                  <AvatarFallback>{character.name[0]}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => onCharacterRemove(shot.id, character.id)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowCharacterPicker(!showCharacterPicker)}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-500 hover:text-purple-500"
            >
              +
            </button>
          </div>
          
          {/* Character Picker Dropdown */}
          {showCharacterPicker && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto">
              {projectCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    onCharacterAdd(shot.id, character.id);
                    setShowCharacterPicker(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={character.imageUrl} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{character.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Camera Settings Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Camera Angle */}
          <div>
            <label className="text-neutral-400 text-sm block mb-1">Camera Angle</label>
            <Select
              value={shot.cameraAngle || ''}
              onValueChange={(value) => onUpdate(shot.id, { cameraAngle: value })}
            >
              <SelectTrigger className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px]">
                <SelectValue placeholder="Front" />
              </SelectTrigger>
              <SelectContent>
                {CAMERA_ANGLES.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Framing */}
          <div>
            <label className="text-neutral-400 text-sm block mb-1">Framing</label>
            <Select
              value={shot.framing || ''}
              onValueChange={(value) => onUpdate(shot.id, { framing: value })}
            >
              <SelectTrigger className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px]">
                <SelectValue placeholder="MS Halbnah" />
              </SelectTrigger>
              <SelectContent>
                {FRAMING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement */}
          <div>
            <label className="text-neutral-400 text-sm block mb-1">Movement</label>
            <Select
              value={shot.cameraMovement || ''}
              onValueChange={(value) => onUpdate(shot.id, { cameraMovement: value })}
            >
              <SelectTrigger className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px]">
                <SelectValue placeholder="Static" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lens */}
          <div>
            <label className="text-neutral-400 text-sm block mb-1">Lens</label>
            <Select
              value={shot.lens || ''}
              onValueChange={(value) => onUpdate(shot.id, { lens: value })}
            >
              <SelectTrigger className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px]">
                <SelectValue placeholder="35mm" />
              </SelectTrigger>
              <SelectContent>
                {LENS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shotlength */}
        <div>
          <label className="text-neutral-400 text-sm block mb-1">Shotlength</label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              max="999"
              value={shot.shotlengthMinutes || 0}
              onChange={(e) => onUpdate(shot.id, { shotlengthMinutes: parseInt(e.target.value) || 0 })}
              className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px] w-16"
              placeholder="Min"
            />
            <span className="text-sm">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={shot.shotlengthSeconds || 0}
              onChange={(e) => onUpdate(shot.id, { shotlengthSeconds: parseInt(e.target.value) || 0 })}
              className="bg-[#cacaca] border-0 h-[21px] text-[13px] rounded-[5px] w-16"
              placeholder="Sek"
            />
          </div>
        </div>

        {/* Musik Upload */}
        <div>
          <label className="text-neutral-400 text-sm block mb-1">Musik</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[21px] px-2 flex items-center text-xs text-gray-500">
              {shot.audioFiles?.filter(a => a.type === 'music').map(a => a.label || a.fileName).join(', ') || 'Keine Datei'}
            </div>
            <label className="bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[21px] w-[34px] flex items-center justify-center cursor-pointer hover:bg-gray-200">
              <Upload className="w-4 h-4 text-gray-500" />
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleAudioUpload('music', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* SFX Upload */}
        <div>
          <label className="text-neutral-400 text-sm block mb-1">SFX</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[21px] px-2 flex items-center text-xs text-gray-500">
              {shot.audioFiles?.filter(a => a.type === 'sfx').map(a => a.label || a.fileName).join(', ') || 'Keine Datei'}
            </div>
            <label className="bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[21px] w-[34px] flex items-center justify-center cursor-pointer hover:bg-gray-200">
              <Upload className="w-4 h-4 text-gray-500" />
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleAudioUpload('sfx', e)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Dialog & Notes in 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Dialog */}
          <div>
            <label className="text-neutral-400 text-sm block mb-1">Dialog</label>
            <div className="relative">
              <Textarea
                value={shot.dialog || ''}
                onChange={(e) => handleDialogChange(e.target.value)}
                className="bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[80px] text-sm resize-none"
                placeholder="@Charakter erwähnen..."
              />
              {showCharacterPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 max-h-32 overflow-y-auto w-full">
                  {projectCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => insertCharacterMention(character)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                    >
                      @{character.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-black text-sm block mb-1">Notes</label>
            <Textarea
              value={shot.notes || ''}
              onChange={(e) => onUpdate(shot.id, { notes: e.target.value })}
              className="bg-[#f8f3f3] border border-[#bfbfbf] rounded-[5px] h-[80px] text-sm resize-none"
              placeholder="Notizen..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
