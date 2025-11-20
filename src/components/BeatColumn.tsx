import { useEffect, useRef, useState } from 'react';
import { BeatCard, type BeatCardData, type TimelineNode } from './BeatCard';
import { HookBar } from './HookBar';

/**
 * 🎬 BEAT COLUMN
 * 
 * Vertikale Spalte mit Beat-Cards, die proportional zum Container-Stack positioniert werden.
 * - Beats werden ABSOLUT positioniert basierend auf pctFrom/pctTo
 * - Synchronisiert mit Container-Stack-Höhe via ResizeObserver + MutationObserver
 * - Fixed width (50px)
 * - 🆕 FL Studio-style Push: Beats schieben andere Beats aus dem Weg
 */

interface BeatColumnProps {
  beats: BeatCardData[];
  onUpdateBeat?: (beatId: string, updates: Partial<BeatCardData>) => void;
  onDeleteBeat?: (beatId: string) => void;
  containerStackRef?: React.RefObject<HTMLDivElement>;
  timelineData?: TimelineNode[]; // Acts with nested sequences/scenes/shots
  className?: string;
  // 🎯 Collapse states for dynamic alignment
  expandedActs?: Set<string>;
  expandedSequences?: Set<string>;
  expandedScenes?: Set<string>;
}

export function BeatColumn({ 
  beats, 
  onUpdateBeat, 
  onDeleteBeat, 
  containerStackRef,
  timelineData,
  expandedActs,
  expandedSequences,
  expandedScenes,
  className = '' 
}: BeatColumnProps) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState<{ top: number; height: number } | null>(null);
  const [resizingBeatId, setResizingBeatId] = useState<string | null>(null);
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null); // 🎯 Selected beat

  // 🎯 FL Studio-style Push Logic - Beats dürfen sich NIE überlappen
  // 🚧 STRIKTE GRENZEN: Oberster Beat max bei 0%, unterster Beat max bei 100%
  const handleBeatResize = (beatId: string, handle: 'top' | 'bottom', newPctFrom: number, newPctTo: number) => {
    if (!onUpdateBeat) return;

    const currentBeat = beats.find(b => b.id === beatId);
    if (!currentBeat) return;

    // Sort all beats by position
    const sortedBeats = [...beats].sort((a, b) => a.pctFrom - b.pctFrom);
    const currentIndex = sortedBeats.findIndex(b => b.id === beatId);

    // Calculate updates
    const updatedBeats: Array<{ id: string; updates: Partial<BeatCardData> }> = [];

    if (handle === 'bottom') {
      // Expanding bottom → push ALL beats below
      const oldEnd = currentBeat.pctTo;
      const newEnd = newPctTo;
      
      // Update current beat
      updatedBeats.push({ id: beatId, updates: { pctFrom: currentBeat.pctFrom, pctTo: newEnd } });

      // Push all beats below - maintain their size, just shift position
      let previousEnd = newEnd;
      for (let i = currentIndex + 1; i < sortedBeats.length; i++) {
        const beat = sortedBeats[i];
        const beatSize = beat.pctTo - beat.pctFrom;
        
        const newFrom = previousEnd;
        const newTo = previousEnd + beatSize;
        
        // 🚧 GRENZE: Unterster Beat darf nicht über 100% hinaus
        if (newTo > 100) {
          console.log(`🚫 Beat "${beat.label}" würde über 100% hinausgehen - Resize abgebrochen`);
          return; // Abort entire resize operation
        }
        
        updatedBeats.push({ 
          id: beat.id, 
          updates: { 
            pctFrom: newFrom, 
            pctTo: newTo 
          } 
        });
        
        previousEnd = newTo;
      }

    } else if (handle === 'top') {
      // Expanding top → push ALL beats above
      const oldStart = currentBeat.pctFrom;
      const newStart = newPctFrom;
      
      // Update current beat
      updatedBeats.push({ id: beatId, updates: { pctFrom: newStart, pctTo: currentBeat.pctTo } });

      // Push all beats above - maintain their size, just shift position
      let nextStart = newStart;
      for (let i = currentIndex - 1; i >= 0; i--) {
        const beat = sortedBeats[i];
        const beatSize = beat.pctTo - beat.pctFrom;
        
        const newFrom = nextStart - beatSize;
        const newTo = nextStart;
        
        // 🚧 GRENZE: Oberster Beat darf nicht unter 0% hinaus
        if (newFrom < 0) {
          console.log(`🚫 Beat "${beat.label}" würde unter 0% hinausgehen - Resize abgebrochen`);
          return; // Abort entire resize operation
        }
        
        updatedBeats.push({ 
          id: beat.id, 
          updates: { 
            pctFrom: newFrom, 
            pctTo: newTo 
          } 
        });
        
        nextStart = newFrom;
      }
    }

    // Apply all updates
    updatedBeats.forEach(({ id, updates }) => {
      onUpdateBeat(id, updates);
    });
  };

  // 🎯 Calculate container bounds (first act top to last act bottom)
  useEffect(() => {
    const containerStack = containerStackRef?.current;
    if (!containerStack) {
      console.log('⚠️ BeatColumn: No containerStack ref');
      return;
    }

    console.log(' BeatColumn: Initializing bounds tracking');

    const updateBounds = () => {
      // Find first and last act containers
      const allActs = containerStack.querySelectorAll('[data-act-card]');
      console.log(`🔍 Found ${allActs.length} act containers`);
      
      if (allActs.length === 0) {
        // Fallback: Use entire container stack height
        const stackHeight = containerStack.scrollHeight;
        console.log(`⚠️ No acts found, using full stack height: ${stackHeight}px`);
        setContainerBounds({ top: 0, height: Math.max(stackHeight, 600) });
        return;
      }

      const firstAct = allActs[0] as HTMLElement;
      const lastAct = allActs[allActs.length - 1] as HTMLElement;

      // Get bounding rects relative to the column
      const columnRect = columnRef.current?.getBoundingClientRect();
      const firstActRect = firstAct.getBoundingClientRect();
      const lastActRect = lastAct.getBoundingClientRect();

      if (!columnRect) {
        console.log('⚠️ Column rect not ready');
        return;
      }

      // Calculate bounds relative to column
      const top = firstActRect.top - columnRect.top;
      const bottom = lastActRect.bottom - columnRect.top;
      const height = bottom - top;

      setContainerBounds({ top, height });
      
      console.log(`📏 BeatColumn bounds: top=${top}px, height=${height}px (${allActs.length} acts)`);
    };

    // Initial update with multiple retries (increased delays for Book projects)
    const timer1 = setTimeout(() => updateBounds(), 200);
    const timer2 = setTimeout(() => updateBounds(), 500);
    const timer3 = setTimeout(() => updateBounds(), 1000);
    const timer4 = setTimeout(() => updateBounds(), 2000);

    // ResizeObserver for layout changes
    const resizeObserver = new ResizeObserver(() => {
      console.log('🔄 BeatColumn: ResizeObserver triggered');
      updateBounds();
    });
    resizeObserver.observe(containerStack);

    // MutationObserver for DOM changes (collapsibles opening/closing)
    const mutationObserver = new MutationObserver(() => {
      console.log('🔄 BeatColumn: MutationObserver triggered');
      setTimeout(updateBounds, 50);
    });
    mutationObserver.observe(containerStack, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-state'],
    });

    // Window resize
    window.addEventListener('resize', updateBounds);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [containerStackRef?.current, expandedActs, expandedSequences, expandedScenes]);

  // 🎯 Handle click to jump Hook bar to position
  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!columnRef.current || !onUpdateBeat || !containerBounds) return;
    
    // Don't trigger if clicking on a beat card itself
    if ((e.target as HTMLElement).closest('[id^="beat-card-"]')) {
      return;
    }

    const rect = columnRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Calculate percentage within container bounds
    const relativeY = clickY - containerBounds.top;
    const clickPct = (relativeY / containerBounds.height) * 100;
    const clampedPct = Math.max(0, Math.min(100, clickPct));
    
    // Find the Hook beat and update its position
    const hookBeat = beats.find(b => b.label === 'Hook');
    if (hookBeat) {
      const beatHeight = 5; // 5% height for Hook bar
      onUpdateBeat(hookBeat.id, {
        pctFrom: Math.max(0, clampedPct - beatHeight / 2),
        pctTo: Math.min(100, clampedPct + beatHeight / 2),
      });
      
      console.log(`📍 Hook jumped to ${clampedPct.toFixed(1)}%`);
    }
  };

  return (
    <div 
      ref={columnRef}
      className={`relative flex-shrink-0 w-[100px] overflow-visible ${className}`}
      style={{
        height: containerBounds ? `${containerBounds.top + containerBounds.height + 100}px` : 'auto',
        minHeight: '600px',
      }}
      onClick={handleColumnClick}
    >
      {/* Beats - positioned dynamically within container bounds */}
      {beats.length === 0 ? (
        <div className="absolute top-1/3 left-0 right-0 text-center text-muted-foreground text-[8px] px-1">
          Keine Beats
        </div>
      ) : containerBounds ? (
        beats.map((beat) => {
          // Calculate position within container bounds (0-100% maps to first act top to last act bottom)
          const topPercent = beat.pctFrom / 100;
          const bottomPercent = beat.pctTo / 100;
          
          const topPx = containerBounds.top + (topPercent * containerBounds.height);
          const bottomPx = containerBounds.top + (bottomPercent * containerBounds.height);
          const heightPx = Math.max(bottomPx - topPx, 15); // Min 15px for compact view
          
          console.log(`🎵 Beat "${beat.label}": ${beat.pctFrom}%-${beat.pctTo}% → top=${topPx.toFixed(1)}px, height=${heightPx.toFixed(1)}px`);
          
          return (
            <div
              key={beat.id}
              id={`beat-card-${beat.id}`}
              className="absolute left-0 right-0 px-0.5"
              style={{
                top: `${topPx}px`,
                height: `${heightPx}px`,
                paddingBottom: '2px', // 2px gap between beats
              }}
            >
              <BeatCard
                beat={beat}
                onUpdate={onUpdateBeat}
                onDelete={onDeleteBeat}
                timelineData={timelineData}
                onResize={handleBeatResize}
                resizing={resizingBeatId === beat.id}
                setResizing={setResizingBeatId}
                selected={selectedBeatId === beat.id}
                setSelected={setSelectedBeatId}
              />
            </div>
          );
        })
      ) : null}
    </div>
  );
}