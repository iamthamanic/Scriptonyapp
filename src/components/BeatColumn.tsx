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
  const [stackHeight, setStackHeight] = useState<number>(0);
  const [paddingTopOffset, setPaddingTopOffset] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const columnRef = useRef<HTMLDivElement>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  // 🎯 DYNAMIC ALIGNMENT: Calculate beat position based on visible elements
  useEffect(() => {
    if (!containerStackRef?.current || !onUpdateBeat) return;
    
    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      const container = containerStackRef.current;
      if (!container) return;
      
      // 🎯 Calculate contentHeight THE SAME WAY as updateBeatPositions!
      const firstAct = container.querySelector('[data-act-card]');
      
      if (!firstAct) {
        console.log('⚠️ Dynamic alignment: Act cards not found yet');
        return;
      }
      
      const firstActTop = (firstAct as HTMLElement).offsetTop;
      
      // 🎯 Find the LAST VISIBLE ELEMENT (could be a shot, scene, sequence, or act)
      const allShots = Array.from(container.querySelectorAll('[data-shot-id]'));
      const allScenes = Array.from(container.querySelectorAll('[data-scene-id]'));
      const allSequences = Array.from(container.querySelectorAll('[data-sequence-id]'));
      const allActs = Array.from(container.querySelectorAll('[data-act-card]'));
      
      const allElements = [...allShots, ...allScenes, ...allSequences, ...allActs] as HTMLElement[];
      
      let lastBottom = firstActTop + 64; // Fallback
      
      if (allElements.length > 0) {
        // Find the element with the highest bottom position
        lastBottom = Math.max(...allElements.map(el => el.offsetTop + el.offsetHeight));
      }
      
      const contentHeight = lastBottom - firstActTop;
      
      if (contentHeight === 0) {
        console.log('⚠️ Dynamic alignment: Content height is 0');
        return;
      }
      
      console.log('🎯 Dynamic alignment triggered! Processing', beats.length, 'beats');
      console.log('🎯 Content height for alignment:', contentHeight, 'px (firstActTop:', firstActTop, ', lastBottom:', lastBottom, ')');
      console.log('🎯 Elements found:', {
        shots: allShots.length,
        scenes: allScenes.length,
        sequences: allSequences.length,
        acts: allActs.length,
      });
      
      // Update each beat's position based on what's visible
      beats.forEach((beat) => {
        if (!beat.fromAct && !beat.toAct) {
          console.log(`⚠️ Beat "${beat.label}" has no position set - skipping`);
          return; // No position set
        }
        
        console.log(`🎯 Processing beat "${beat.label}":`, {
          fromAct: beat.fromAct,
          fromSequence: beat.fromSequence,
          fromScene: beat.fromScene,
          fromShot: beat.fromShot,
          toAct: beat.toAct,
          toSequence: beat.toSequence,
          toScene: beat.toScene,
          toShot: beat.toShot,
        });
        
        // 🎯 Find the VISIBLE "from" element
        let fromElement: HTMLElement | null = null;
        
        // Helper: Check if element is actually visible (not collapsed inside a parent)
        const isElementVisible = (el: HTMLElement | null): boolean => {
          if (!el) return false;
          // offsetHeight/offsetWidth are 0 when the element is collapsed/hidden!
          return el.offsetHeight > 0 && el.offsetWidth > 0;
        };
        
        // 🎯 Helper: Get the best alignment target for an act
        // If act is collapsed, use the header; otherwise use the full container
        const getActAlignmentElement = (actId: string): HTMLElement | null => {
          const actContainer = container.querySelector(`[data-act-id="${actId}"]`) as HTMLElement;
          if (!actContainer) return null;
          
          // Check if act is expanded by looking for visible children
          const hasVisibleChildren = container.querySelector(
            `[data-act-id="${actId}"] [data-sequence-id]`
          ) as HTMLElement;
          
          const isExpanded = hasVisibleChildren && isElementVisible(hasVisibleChildren);
          
          if (!isExpanded) {
            // Act is collapsed → use header for alignment
            const actHeader = container.querySelector(`[data-act-header-id="${actId}"]`) as HTMLElement;
            if (actHeader) {
              console.log(`  🎯 Act ${actId} is collapsed - using header for alignment`);
              return actHeader;
            }
          }
          
          // Act is expanded or no header found → use full container
          return actContainer;
        };
        
        // Try shot first (most specific) - no need to check if expanded, just try to find it!
        if (beat.fromShot) {
          fromElement = container.querySelector(`[data-shot-id="${beat.fromShot}"]`) as HTMLElement;
          if (fromElement && !isElementVisible(fromElement)) {
            console.log(`  ⏭️ from-shot exists but not visible (collapsed) - trying fallback`);
            fromElement = null; // Reset to try fallback
          } else if (fromElement) {
            console.log(`  ✅ Found from-shot: ${beat.fromShot}`);
          }
        }
        
        // Fall back to scene if shot not found
        if (!fromElement && beat.fromScene) {
          fromElement = container.querySelector(`[data-scene-id="${beat.fromScene}"]`) as HTMLElement;
          if (fromElement && !isElementVisible(fromElement)) {
            console.log(`  ⏭️ from-scene exists but not visible (collapsed) - trying fallback`);
            fromElement = null;
          } else if (fromElement) {
            console.log(`  ✅ Found from-scene: ${beat.fromScene}`);
          }
        }
        
        // Fall back to sequence if scene not found
        if (!fromElement && beat.fromSequence) {
          fromElement = container.querySelector(`[data-sequence-id="${beat.fromSequence}"]`) as HTMLElement;
          if (fromElement && !isElementVisible(fromElement)) {
            console.log(`  ⏭️ from-sequence exists but not visible (collapsed) - trying fallback`);
            fromElement = null;
          } else if (fromElement) {
            console.log(`  ✅ Found from-sequence: ${beat.fromSequence}`);
          }
        }
        
        // Fall back to act
        if (!fromElement && beat.fromAct) {
          fromElement = getActAlignmentElement(beat.fromAct);
          if (fromElement) console.log(`  ✅ Found from-act: ${beat.fromAct}`);
        }
        
        if (!fromElement) {
          console.warn(`  ⚠️ Could not find from-element for beat "${beat.label}"`);
        }
        
        // 🎯 Find the VISIBLE "to" element
        let toElement: HTMLElement | null = null;
        
        // Try shot first (most specific)
        if (beat.toShot) {
          toElement = container.querySelector(`[data-shot-id="${beat.toShot}"]`) as HTMLElement;
          if (toElement && !isElementVisible(toElement)) {
            console.log(`  ⏭️ to-shot exists but not visible (collapsed) - trying fallback`);
            toElement = null;
          } else if (toElement) {
            console.log(`  ✅ Found to-shot: ${beat.toShot}`);
          }
        }
        
        // Fall back to scene
        if (!toElement && beat.toScene) {
          toElement = container.querySelector(`[data-scene-id="${beat.toScene}"]`) as HTMLElement;
          if (toElement && !isElementVisible(toElement)) {
            console.log(`  ⏭️ to-scene exists but not visible (collapsed) - trying fallback`);
            toElement = null;
          } else if (toElement) {
            console.log(`  ✅ Found to-scene: ${beat.toScene}`);
          }
        }
        
        // Fall back to sequence
        if (!toElement && beat.toSequence) {
          toElement = container.querySelector(`[data-sequence-id="${beat.toSequence}"]`) as HTMLElement;
          if (toElement && !isElementVisible(toElement)) {
            console.log(`  ⏭️ to-sequence exists but not visible (collapsed) - trying fallback`);
            toElement = null;
          } else if (toElement) {
            console.log(`  ✅ Found to-sequence: ${beat.toSequence}`);
          }
        }
        
        // Fall back to act
        if (!toElement && beat.toAct) {
          toElement = getActAlignmentElement(beat.toAct);
          if (toElement) console.log(`  ✅ Found to-act: ${beat.toAct}`);
        }
        
        if (!toElement) {
          console.warn(`  ⚠️ Could not find to-element for beat "${beat.label}"`);
        }
        
        // Calculate new percentage positions
        if (fromElement && toElement) {
          // 🎯 Use getBoundingClientRect for accurate viewport-relative positions!
          const firstActRect = firstAct.getBoundingClientRect();
          const fromRect = fromElement.getBoundingClientRect();
          const toRect = toElement.getBoundingClientRect();
          
          // Calculate positions relative to first act (viewport-relative, then subtract first act top)
          let fromTopPx = fromRect.top - firstActRect.top;
          let toBottomPx = toRect.bottom - firstActRect.top;
          
          // 🎯 SPECIAL CASE: If both from and to are the same collapsed act header
          // → Make the beat card a thin line at the top instead of covering the whole header
          const isFromActHeader = fromElement.hasAttribute('data-act-header');
          const isToActHeader = toElement.hasAttribute('data-act-header');
          const isSameElement = fromElement === toElement;
          
          if (isSameElement && isFromActHeader && isToActHeader) {
            console.log(`  🎯 Same collapsed act detected - using minimal height at top`);
            toBottomPx = fromTopPx + 20; // Minimal 20px height at the top
          }
          
          const fromPct = (fromTopPx / contentHeight) * 100;
          const toPct = (toBottomPx / contentHeight) * 100;
          
          console.log(`🎯 Dynamic alignment for ${beat.label}:`, {
            fromElement: fromElement.getAttribute('data-shot-id') || fromElement.getAttribute('data-scene-id') || fromElement.getAttribute('data-sequence-id') || fromElement.getAttribute('data-act-id'),
            toElement: toElement.getAttribute('data-shot-id') || toElement.getAttribute('data-scene-id') || toElement.getAttribute('data-sequence-id') || toElement.getAttribute('data-act-id'),
            fromTopPx,
            toBottomPx,
            contentHeight,
            fromPct: fromPct.toFixed(2),
            toPct: toPct.toFixed(2),
          });
          
          // Update beat position
          onUpdateBeat(beat.id, {
            pctFrom: Math.max(0, Math.min(100, fromPct)),
            pctTo: Math.max(0, Math.min(100, toPct)),
          });
        } else {
          console.warn(`  ⚠️ Skipping beat "${beat.label}" - missing elements`);
        }
      });
    });
  }, [beats, expandedActs, expandedSequences, expandedScenes, containerStackRef, onUpdateBeat]);

  // 🎯 Handle click to jump Hook bar to position
  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!columnRef.current || !onUpdateBeat) return;
    
    // Don't trigger if clicking on a beat card itself
    if ((e.target as HTMLElement).closest('[id^="beat-card-"]')) {
      return;
    }

    const rect = columnRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    
    // Calculate percentage within content area (from first act to last act)
    const clickPct = ((clickY - paddingTopOffset) / contentHeight) * 100;
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

  // 🎯 Wait for containerStackRef to be available
  useEffect(() => {
    const containerStack = containerStackRef.current;
    if (!containerStack) {
      // Silent wait - no warning needed, component is mounting
      return;
    }

    setIsContainerReady(true);
    
    const updateBeatPositions = () => {
      const stackHeight = containerStack.scrollHeight;
      
      if (stackHeight === 0) {
        // Silent wait - content is still loading
        return;
      }
      
      setStackHeight(stackHeight);
      console.log(`📏 BeatColumn: Container height = ${stackHeight}px`);
      
      // 🎯 Find the FIRST ACT CARD to get its offsetTop (start point)
      const firstActCard = containerStack.querySelector('[data-act-card]');
      
      if (!firstActCard) {
        console.warn('⚠️ BeatColumn: First act card not found');
        return;
      }
      
      // 🎯 CRITICAL FIX: Use getBoundingClientRect to get ABSOLUTE positions!
      // The BeatColumn and containerStack are NOT in the same container hierarchy,
      // so we can't use offsetTop directly. We need viewport-relative positions.
      const columnRect = columnRef.current?.getBoundingClientRect();
      const firstActRect = (firstActCard as HTMLElement).getBoundingClientRect();
      const containerRect = containerStack.getBoundingClientRect();
      
      if (!columnRect) {
        console.warn('⚠️ BeatColumn: Column rect not found');
        return;
      }
      
      // Calculate offset: How far is the first act from the top of the BeatColumn?
      const firstActOffsetFromColumn = firstActRect.top - columnRect.top;
      
      console.log('📏 BeatColumn: Position details:', {
        columnTop: columnRect.top,
        firstActTop: firstActRect.top,
        containerTop: containerRect.top,
        firstActOffsetFromColumn,
      });
      
      // 🎯 Get container's padding-top to align BeatColumn with FilmDropdown
      const containerStyles = window.getComputedStyle(containerStack);
      const containerPaddingTop = parseFloat(containerStyles.paddingTop) || 0;
      
      console.log('📏 BeatColumn: Container padding-top =', containerPaddingTop, 'px');
      
      // 🎯 Find the LAST VISIBLE ELEMENT (could be a shot, scene, sequence, or act)
      // This gives us the REAL bottom of the content
      const allShots = Array.from(containerStack.querySelectorAll('[data-shot-id]'));
      const allScenes = Array.from(containerStack.querySelectorAll('[data-scene-id]'));
      const allSequences = Array.from(containerStack.querySelectorAll('[data-sequence-id]'));
      const allActs = Array.from(containerStack.querySelectorAll('[data-act-card]'));
      
      const allElements = [...allShots, ...allScenes, ...allSequences, ...allActs] as HTMLElement[];
      
      let lastBottomOffsetFromColumn = firstActOffsetFromColumn + 64; // Fallback to first act height
      
      if (allElements.length > 0) {
        // Find the element with the highest bottom position (viewport-relative)
        const lastElementBottoms = allElements.map(el => {
          const rect = el.getBoundingClientRect();
          return rect.bottom - columnRect.top; // Distance from BeatColumn top
        });
        lastBottomOffsetFromColumn = Math.max(...lastElementBottoms);
      }
      
      // 🎯 Content area is from first act top to last element bottom (both relative to BeatColumn)
      const contentHeight = lastBottomOffsetFromColumn - firstActOffsetFromColumn;
      
      console.log('📏 BeatColumn: Container details:', {
        containerHeight: stackHeight,
        firstActCard: firstActCard ? 'found' : 'NOT FOUND',
        firstActOffsetTop: firstActOffsetFromColumn,
        lastBottom: lastBottomOffsetFromColumn,
        contentHeight,
        numElements: allElements.length,
        numShots: allShots.length,
        numScenes: allScenes.length,
        numSequences: allSequences.length,
        numActs: allActs.length,
      });
      
      if (contentHeight === 0) {
        console.warn('⚠️ BeatColumn: Content height is 0, skipping update');
        return;
      }
      
      setPaddingTopOffset(firstActOffsetFromColumn);
      setContentHeight(contentHeight);
      
      beats.forEach((beat) => {
        const beatEl = document.getElementById(`beat-card-${beat.id}`);
        if (!beatEl) {
          console.warn(`⚠️ BeatColumn: Beat element not found for ${beat.id}`);
          return;
        }

        // Calculate position based on percentage within the content area (first act to last act)
        const topPct = beat.pctFrom / 100;
        const bottomPct = beat.pctTo / 100;
        
        const topPx = topPct * contentHeight;
        const bottomPx = bottomPct * contentHeight;
        const heightPx = bottomPx - topPx;

        // 🎯 REMOVED minHeight - Beat cards should match EXACT element bounds!
        // If a beat spans just one shot, it should be shot-height, not artificially inflated.
        const finalHeight = Math.max(heightPx, 20); // Only minimal 20px to ensure visibility

        // Add first act offset so beats start at Akt I top
        // (firstActOffsetFromColumn is already viewport-relative, no need to add padding!)
        let finalTopPx = topPx + firstActOffsetFromColumn;
        
        // Clamp to stay within act bounds
        if (finalTopPx + finalHeight > lastBottomOffsetFromColumn) {
          finalTopPx = Math.max(firstActOffsetFromColumn, lastBottomOffsetFromColumn - finalHeight);
        }

        beatEl.style.top = `${finalTopPx}px`;
        beatEl.style.height = `${finalHeight}px`;
        
        console.log(`📍 Beat ${beat.label}: ${finalTopPx}px (${beat.pctFrom}%) - height ${finalHeight}px (ends at ${finalTopPx + finalHeight}px)`);
      });
    };

    // Initial update with multiple retries
    setTimeout(() => updateBeatPositions(), 100);
    setTimeout(() => updateBeatPositions(), 300);
    setTimeout(() => updateBeatPositions(), 600);
    setTimeout(() => updateBeatPositions(), 1000);

    // ResizeObserver for layout changes
    const resizeObserver = new ResizeObserver(() => {
      console.log('🔄 BeatColumn: ResizeObserver triggered');
      updateBeatPositions();
    });
    resizeObserver.observe(containerStack);

    // MutationObserver for DOM changes (collapsibles opening/closing)
    const mutationObserver = new MutationObserver(() => {
      console.log('🔄 BeatColumn: MutationObserver triggered');
      setTimeout(updateBeatPositions, 50); // Small delay for layout to settle
    });
    mutationObserver.observe(containerStack, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    // Window resize
    window.addEventListener('resize', updateBeatPositions);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updateBeatPositions);
    };
  }, [beats, containerStackRef, isContainerReady]);

  return (
    <div 
      ref={columnRef}
      className={`relative flex-shrink-0 w-[100px] overflow-visible ${className}`}
      style={{
        height: stackHeight > 0 ? `${stackHeight}px` : 'auto',
      }}
      onClick={handleColumnClick}
    >
      {/* Beats */}
      {beats.length === 0 ? (
        <div className="absolute top-1/3 left-0 right-0 text-center text-muted-foreground text-[8px] px-1">
          Keine Beats
        </div>
      ) : (
        beats.map((beat) => {
          return (
            <div
              key={beat.id}
              id={`beat-card-${beat.id}`}
              className="absolute left-0 right-0 px-0"
              style={{
                top: 0,
                height: '60px', // Initial height - will be updated by dynamic system
              }}
            >
              <BeatCard
                beat={beat}
                onUpdate={onUpdateBeat}
                onDelete={onDeleteBeat}
                timelineData={timelineData}
              />
            </div>
          );
        })
      )}
    </div>
  );
}