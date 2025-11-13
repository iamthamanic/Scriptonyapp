import { useState, useRef } from 'react';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { BeatColumn } from './BeatColumn';
import type { BeatCardData, TimelineNode } from './BeatCard';
import { FilmDropdown, type TimelineData } from './FilmDropdown';
import { generateBeatsFromTemplate, LITE_7_TEMPLATE } from '../lib/beat-templates';

/**
 * 🎬 STRUCTURE & BEATS SECTION
 * 
 * Collapsible-Section für Project-Detail-Page mit:
 * - Dropdown/Timeline Toggle
 * - Beat-Rail (80px links)
 * - Container-Stack (Acts → Sequences → Scenes → Shots)
 * - Beats sind inline editierbar
 */

interface StructureBeatsSectionProps {
  projectId: string;
  className?: string;
  initialData?: TimelineData; // Pre-loaded timeline data from parent
  onDataChange?: (data: TimelineData) => void; // Callback when timeline changes
}

// LITE-7 Story Beat Preset (minimales Template für schnelles Prototyping)
const MOCK_BEATS: BeatCardData[] = generateBeatsFromTemplate(LITE_7_TEMPLATE);

// 🧪 TEST: Hook bei 5% positionieren (oben sichtbar)
const TEST_BEAT_HOOK: BeatCardData = {
  ...MOCK_BEATS[0], // Hook (0-1%)
  pctFrom: 2, // Start bei 2%
  pctTo: 8,   // Ende bei 8% (6% hoch = ca. 60px bei 1000px Höhe)
};

export function StructureBeatsSection({ projectId, initialData, onDataChange, className = '' }: StructureBeatsSectionProps) {
  const containerStackRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true); // DEFAULT: OPEN
  const [structureView, setStructureView] = useState<'dropdown' | 'timeline'>('dropdown');
  
  // 🧪 TEST: Nur Hook anzeigen
  const [beats, setBeats] = useState<BeatCardData[]>([TEST_BEAT_HOOK]);
  
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  
  // 🎯 Collapse States for dynamic alignment
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  
  const handleUpdateBeat = (beatId: string, updates: Partial<BeatCardData>) => {
    setBeats(prev => prev.map(beat => 
      beat.id === beatId ? { ...beat, ...updates } : beat
    ));
  };

  const handleDeleteBeat = (beatId: string) => {
    setBeats(prev => prev.filter(beat => beat.id !== beatId));
  };

  const handleTimelineChange = (data: TimelineData) => {
    setTimelineData(data);
    if (onDataChange) {
      onDataChange(data);
    }
  };

  // 🎯 Convert FilmDropdown TimelineData to BeatCard TimelineNode format
  const convertToTimelineNodes = (data: TimelineData | null): TimelineNode[] => {
    if (!data || !data.acts || !Array.isArray(data.acts)) return [];
    
    // Build hierarchical structure from flat arrays
    const { acts, sequences, scenes, shots } = data;
    
    // 🔍 DEBUG: Log shots data
    console.log('[StructureBeatsSection] Converting timeline data:', {
      acts: acts.length,
      sequences: sequences?.length || 0,
      scenes: scenes?.length || 0,
      shots: shots?.length || 0,
      allShots: shots
    });
    
    return acts.map(act => ({
      id: act.id,
      title: act.title,
      sequences: sequences
        ?.filter(seq => seq.actId === act.id)
        .map(seq => ({
          id: seq.id,
          title: seq.title,
          scenes: scenes
            ?.filter(scene => scene.sequenceId === seq.id)
            .map(scene => {
              const sceneShots = shots?.filter(shot => shot.sceneId === scene.id) || [];
              console.log(`[StructureBeatsSection] Scene "${scene.title}" (${scene.id}) has ${sceneShots.length} shots:`, sceneShots);
              
              return {
                id: scene.id,
                title: scene.title,
                shots: sceneShots.map(shot => ({
                  id: shot.id,
                  title: shot.shotNumber || shot.description || 'Untitled Shot',
                })),
              };
            }) || [],
        })) || [],
    }));
  };

  const timelineNodes = convertToTimelineNodes(timelineData);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              Structure & Beats
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </h2>
          </Button>
        </CollapsibleTrigger>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={structureView} onValueChange={(v) => setStructureView(v as any)}>
            <TabsList>
              <TabsTrigger value="dropdown">Dropdown</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator orientation="vertical" className="h-6" />

          {/* Add Act Button */}
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => {
              // TODO: Add Act
              console.log('Add Act');
            }}
            className="h-8 bg-[rgba(110,89,165,1)] text-[rgba(255,255,255,1)]"
          >
            <Plus className="size-3.5 mr-1.5" />
            Act hinzufügen
          </Button>
        </div>
      </div>

      {/* Content */}
      <CollapsibleContent>
        <div className="flex border border-border rounded-lg overflow-hidden bg-background">
          {/* Beat Column (Left) */}
          <BeatColumn
            beats={beats}
            onUpdateBeat={handleUpdateBeat}
            onDeleteBeat={handleDeleteBeat}
            containerStackRef={containerStackRef}
            timelineData={timelineNodes}
            expandedActs={expandedActs}
            expandedSequences={expandedSequences}
            expandedScenes={expandedScenes}
          />

          {/* Separator */}
          <Separator orientation="vertical" className="h-auto" />

          {/* Container Stack - FilmDropdown (Right) */}
          <div className="flex-1 overflow-y-auto">
            {structureView === 'dropdown' ? (
              <FilmDropdown
                projectId={projectId}
                initialData={initialData}
                onDataChange={handleTimelineChange}
                containerRef={containerStackRef}
                expandedActs={expandedActs}
                expandedSequences={expandedSequences}
                expandedScenes={expandedScenes}
                onExpandedActsChange={setExpandedActs}
                onExpandedSequencesChange={setExpandedSequences}
                onExpandedScenesChange={setExpandedScenes}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Timeline View (Coming Soon)
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}