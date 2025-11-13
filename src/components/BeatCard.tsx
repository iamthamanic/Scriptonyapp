import { ChevronDown, ChevronUp, MoreVertical, GripVertical, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

/**
 * 🎬 BEAT CARD - Phone-Screen Design
 * 
 * Großer, interaktiver Beat-Block im Phone-Screen-Stil:
 * - Header mit Prozent, Zeit, Von-Bis Dropdown
 * - Großer Beat-Titel
 * - Mehrere Hook-Labels (mit fading opacity)
 * - Grid-Icon
 * - Footer mit Position-Selector
 */

export interface BeatCardData {
  id: string;
  label: string;
  pctFrom: number;
  pctTo: number;
  color?: string;
  description?: string;
  // Position anchors
  fromAct?: string;
  fromSequence?: string;
  fromScene?: string;
  fromShot?: string;
  toAct?: string;
  toSequence?: string;
  toScene?: string;
  toShot?: string;
}

// Timeline data structure for dropdowns
export interface TimelineNode {
  id: string;
  title: string;
  sequences?: TimelineNode[];
  scenes?: TimelineNode[];
  shots?: TimelineNode[];
}

interface BeatCardProps {
  beat: BeatCardData;
  onUpdate?: (beatId: string, updates: Partial<BeatCardData>) => void;
  onDelete?: (beatId: string) => void;
  timelineData?: TimelineNode[]; // Acts with nested sequences/scenes/shots
  className?: string;
}

export function BeatCard({ beat, onUpdate, onDelete, timelineData, className = '' }: BeatCardProps) {
  const bgColor = beat.color || '#B8A8D8'; // Default violet
  const pctSpan = beat.pctTo - beat.pctFrom;
  const isHookBeat = beat.label === 'Hook';
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);

  // State for position selectors
  const [fromAct, setFromAct] = useState(beat.fromAct || '');
  const [fromSequence, setFromSequence] = useState(beat.fromSequence || '');
  const [fromScene, setFromScene] = useState(beat.fromScene || '');
  const [fromShot, setFromShot] = useState(beat.fromShot || '');
  const [toAct, setToAct] = useState(beat.toAct || '');
  const [toSequence, setToSequence] = useState(beat.toSequence || '');
  const [toScene, setToScene] = useState(beat.toScene || '');
  const [toShot, setToShot] = useState(beat.toShot || '');

  // Get nested data based on selections
  const selectedFromAct = timelineData?.find(a => a.id === fromAct);
  const selectedFromSequence = selectedFromAct?.sequences?.find(s => s.id === fromSequence);
  const selectedFromScene = selectedFromSequence?.scenes?.find(sc => sc.id === fromScene);
  
  const selectedToAct = timelineData?.find(a => a.id === toAct);
  const selectedToSequence = selectedToAct?.sequences?.find(s => s.id === toSequence);
  const selectedToScene = selectedToSequence?.scenes?.find(sc => sc.id === toScene);

  const handleSavePosition = () => {
    if (onUpdate) {
      // Save position IDs
      onUpdate(beat.id, {
        fromAct,
        fromSequence,
        fromScene,
        fromShot,
        toAct,
        toSequence,
        toScene,
        toShot,
      });
      
      // 🎯 Calculate pixel position and convert to percentage
      // Find the container (FilmDropdown)
      const container = document.querySelector('[data-beat-container]') as HTMLElement;
      if (!container) {
        console.warn('⚠️ Beat container not found for position calculation');
        setIsPositionDialogOpen(false);
        return;
      }
      
      // Find first and last act to determine content area
      const firstAct = container.querySelector('[data-act-card]') as HTMLElement;
      const allActs = container.querySelectorAll('[data-act-card]');
      const lastAct = allActs.length > 0 ? allActs[allActs.length - 1] as HTMLElement : null;
      
      if (!firstAct || !lastAct) {
        console.warn('⚠️ Acts not found for position calculation');
        setIsPositionDialogOpen(false);
        return;
      }
      
      const firstActTop = firstAct.offsetTop;
      const lastActBottom = lastAct.offsetTop + lastAct.offsetHeight;
      const contentHeight = lastActBottom - firstActTop;
      
      // Find "from" element (prefer shot > scene > sequence > act)
      let fromElement: HTMLElement | null = null;
      if (fromShot) {
        fromElement = container.querySelector(`[data-shot-id="${fromShot}"]`) as HTMLElement;
      } else if (fromScene) {
        fromElement = container.querySelector(`[data-scene-id="${fromScene}"]`) as HTMLElement;
      } else if (fromSequence) {
        fromElement = container.querySelector(`[data-sequence-id="${fromSequence}"]`) as HTMLElement;
      } else if (fromAct) {
        fromElement = container.querySelector(`[data-act-id="${fromAct}"]`) as HTMLElement;
      }
      
      // Find "to" element
      let toElement: HTMLElement | null = null;
      if (toShot) {
        toElement = container.querySelector(`[data-shot-id="${toShot}"]`) as HTMLElement;
      } else if (toScene) {
        toElement = container.querySelector(`[data-scene-id="${toScene}"]`) as HTMLElement;
      } else if (toSequence) {
        toElement = container.querySelector(`[data-sequence-id="${toSequence}"]`) as HTMLElement;
      } else if (toAct) {
        toElement = container.querySelector(`[data-act-id="${toAct}"]`) as HTMLElement;
      }
      
      if (fromElement && toElement && contentHeight > 0) {
        // Calculate positions relative to content area
        const fromTopPx = fromElement.offsetTop - firstActTop;
        const toBottomPx = (toElement.offsetTop + toElement.offsetHeight) - firstActTop;
        
        // Convert to percentage
        const fromPct = (fromTopPx / contentHeight) * 100;
        const toPct = (toBottomPx / contentHeight) * 100;
        
        console.log('🎯 Beat position calculated:', {
          fromTopPx,
          toBottomPx,
          contentHeight,
          fromPct,
          toPct,
        });
        
        // Update beat with new percentages
        onUpdate(beat.id, {
          pctFrom: Math.max(0, Math.min(100, fromPct)),
          pctTo: Math.max(0, Math.min(100, toPct)),
        });
      }
    }
    setIsPositionDialogOpen(false);
  };

  const handlePctChange = (field: 'pctFrom' | 'pctTo', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && onUpdate) {
      onUpdate(beat.id, { [field]: Math.max(0, Math.min(100, numValue)) });
    }
  };

  // 🎯 HOOK BEAT: Special layout - Compact vertical card WITHOUT inputs
  if (isHookBeat) {
    return (
      <Card 
        className="relative overflow-hidden border-2 w-full h-full flex flex-col"
        style={{
          backgroundColor: bgColor,
          borderColor: '#8B7AB8',
          borderRadius: '12px', // Rounded corners
        }}
      >
        {/* Header with percentage, time, dropdown, and menu */}
        <div 
          className="flex-shrink-0 px-2 py-2 flex flex-col gap-2 border-b-2"
          style={{ borderColor: '#8B7AB8', backgroundColor: '#9B8BC0' }}
        >
          {/* Row 1: Percentage + Time + Menu */}
          <div className="flex items-center justify-between gap-2">
            {/* Percentage */}
            <div className="bg-white/90 rounded-full px-2 py-1 text-[10px] font-semibold text-gray-800">
              {beat.pctFrom.toFixed(0)}%
            </div>
            {/* Time estimate */}
            <div className="text-[9px] text-white/90">
              10Min
            </div>
            {/* Menu button */}
            <button className="text-white/90 hover:text-white p-0.5">
              <MoreVertical className="w-3 h-3" />
            </button>
          </div>

          {/* Row 2: Von-Bis Dropdown (full width) */}
          <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="w-full bg-white/90 rounded px-2 py-1.5 flex items-center justify-between hover:bg-white transition-colors cursor-pointer"
              >
                <span className="text-[10px] font-semibold text-gray-800">
                  {beat.fromAct || beat.toAct ? '✓ Position gesetzt' : 'Von - Bis'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-600" />
              </button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Hook Position einstellen</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* FROM Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-violet-600">Von (Start)</h3>
                  
                  {/* Act */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Akt</label>
                    <Select value={fromAct} onValueChange={(v) => { setFromAct(v); setFromSequence(''); setFromScene(''); setFromShot(''); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Akt wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timelineData?.map((act) => (
                          <SelectItem key={act.id} value={act.id}>{act.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sequence - Always visible, disabled if no act selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Sequenz</label>
                    <Select 
                      value={fromSequence} 
                      onValueChange={(v) => { setFromSequence(v); setFromScene(''); setFromShot(''); }}
                      disabled={!fromAct || !selectedFromAct?.sequences}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sequenz wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFromAct?.sequences?.map((seq) => (
                          <SelectItem key={seq.id} value={seq.id}>{seq.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Scene - Always visible, disabled if no sequence selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Szene</label>
                    <Select 
                      value={fromScene} 
                      onValueChange={(v) => { setFromScene(v); setFromShot(''); }}
                      disabled={!fromSequence || !selectedFromSequence?.scenes}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Szene wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFromSequence?.scenes?.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>{scene.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shot - Always visible, disabled if no scene selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Shot</label>
                    <Select 
                      value={fromShot} 
                      onValueChange={setFromShot}
                      disabled={!fromScene || !selectedFromScene?.shots}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Shot wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFromScene?.shots?.map((shot) => (
                          <SelectItem key={shot.id} value={shot.id}>{shot.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* TO Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-violet-600">Bis (Ende)</h3>
                  
                  {/* Act */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Akt</label>
                    <Select value={toAct} onValueChange={(v) => { setToAct(v); setToSequence(''); setToScene(''); setToShot(''); }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Akt wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {timelineData?.map((act) => (
                          <SelectItem key={act.id} value={act.id}>{act.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sequence - Always visible, disabled if no act selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Sequenz</label>
                    <Select 
                      value={toSequence} 
                      onValueChange={(v) => { setToSequence(v); setToScene(''); setToShot(''); }}
                      disabled={!toAct || !selectedToAct?.sequences}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sequenz wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedToAct?.sequences?.map((seq) => (
                          <SelectItem key={seq.id} value={seq.id}>{seq.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Scene - Always visible, disabled if no sequence selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Szene</label>
                    <Select 
                      value={toScene} 
                      onValueChange={(v) => { setToScene(v); setToShot(''); }}
                      disabled={!toSequence || !selectedToSequence?.scenes}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Szene wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedToSequence?.scenes?.map((scene) => (
                          <SelectItem key={scene.id} value={scene.id}>{scene.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shot - Always visible, disabled if no scene selected */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Shot</label>
                    <Select 
                      value={toShot} 
                      onValueChange={setToShot}
                      disabled={!toScene || !selectedToScene?.shots}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Shot wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedToScene?.shots?.map((shot) => (
                          <SelectItem key={shot.id} value={shot.id}>{shot.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsPositionDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSavePosition} className="bg-violet-600 hover:bg-violet-700">
                    Speichern
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content Area with stacked Hook labels */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-2 min-h-0">
          {[100, 80, 60, 40, 25, 15].map((opacity, i) => (
            <div
              key={i}
              className="font-bold text-center leading-none"
              style={{
                opacity: opacity / 100,
                fontSize: i === 0 ? '13px' : '11px',
                color: '#2C2C2C',
              }}
            >
              Hook
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // 🎬 NORMAL BEAT: Regular card layout
  return (
    <Card 
      className={`relative overflow-hidden border-2 h-full flex flex-col ${className}`}
      style={{
        backgroundColor: bgColor,
        borderColor: '#8B7AB8',
        minHeight: '250px',
        borderRadius: '24px', // Phone-like rounded corners
      }}
    >
      {/* Header (Phone top bar style) */}
      <div 
        className="flex-shrink-0 px-3 py-2 flex items-center justify-center border-b-2"
        style={{ borderColor: '#8B7AB8', backgroundColor: '#9B8BC0' }}
      >
        {/* Percentage Chip */}
        <div className="bg-white/90 rounded-full px-2 py-0.5 text-[10px] font-semibold text-gray-800">
          {beat.pctFrom}%
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-start justify-center px-3 py-6 relative">
        {/* Grid Icon (left side) */}
        <div className="absolute left-2 top-4">
          <div className="grid grid-cols-2 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-black/70 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Beat Labels (stacked with fading opacity) */}
        <div className="flex flex-col items-center gap-1 mt-2">
          {[100, 70, 50, 30].map((opacity, i) => (
            <div
              key={i}
              className="font-bold text-center"
              style={{
                opacity: opacity / 100,
                fontSize: i === 0 ? '14px' : '12px',
                color: '#1F1F1F',
              }}
            >
              {beat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Footer (Phone bottom bar style) */}
      <div 
        className="flex-shrink-0 h-6 flex items-center justify-center border-t-2"
        style={{ borderColor: '#8B7AB8', backgroundColor: '#9B8BC0' }}
      >
        <div className="w-8 h-0.5 bg-white/60 rounded-full" />
      </div>
    </Card>
  );
}