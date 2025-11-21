import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { BeatColumn } from './BeatColumn';
import { BeatTimeline } from './BeatTimeline';
import { VideoEditorTimeline } from './VideoEditorTimeline';
import type { BeatCardData, TimelineNode } from './BeatCard';
import { FilmDropdown, type TimelineData } from './FilmDropdown';
import { BookDropdown, type BookTimelineData } from './BookDropdown';
import { NativeBookView } from './NativeBookView';
import { NativeScreenplayView } from './NativeScreenplayView';
import { NativeAudiobookView } from './NativeAudiobookView';
import { generateBeatsFromTemplate, LITE_7_TEMPLATE, SAVE_THE_CAT_TEMPLATE } from '../lib/beat-templates';
import * as BeatsAPI from '../lib/api/beats-api';
import * as TimelineAPI from '../lib/api/timeline-api';
import { toast } from 'sonner';

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
  projectType?: string; // 🎯 NEW: Project type for dynamic labels (film/series/book/audio)
  beatTemplate?: string; // 🎯 NEW: Beat template from project (e.g., "lite-7", "save-the-cat")
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

export function StructureBeatsSection({ projectId, projectType, beatTemplate, initialData, onDataChange, className = '' }: StructureBeatsSectionProps) {
  const containerStackRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(true); // DEFAULT: OPEN
  const [structureView, setStructureView] = useState<'dropdown' | 'timeline' | 'native'>('dropdown');
  
  // 🎬 Initialize with Save the Cat 15 Beats
  const [beats, setBeats] = useState<BeatCardData[]>(() => 
    generateBeatsFromTemplate(SAVE_THE_CAT_TEMPLATE).map((beat, index) => ({
      ...beat,
      // Ensure beats have minimum height for visibility
      pctTo: beat.pctFrom === beat.pctTo ? beat.pctFrom + 2 : Math.max(beat.pctTo, beat.pctFrom + 2),
    }))
  );
  
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

  // 🎬 AUTO-GENERATE: Create default beats if none exist
  useEffect(() => {
    const autoGenerateBeats = async () => {
      try {
        // Check if beats already exist
        const existingBeats = await BeatsAPI.getBeats(projectId);
        
        if (existingBeats.length === 0 && beatTemplate) {
          console.log(`[StructureBeatsSection] 🎬 No beats found, auto-generating ${beatTemplate} template...`);
          
          // Get first act to use as container
          const acts = await TimelineAPI.getActs(projectId);
          
          if (acts.length === 0) {
            console.log('[StructureBeatsSection] ⚠️ No acts found, creating default acts first...');
            // Create 3 default acts if none exist
            for (let i = 1; i <= 3; i++) {
              await TimelineAPI.createAct({
                projectId,
                actNumber: i,
                title: `Akt ${i}`,
                description: '',
              });
            }
            // Reload acts after creation
            const newActs = await TimelineAPI.getActs(projectId);
            console.log('[StructureBeatsSection] ✅ Created 3 default acts:', newActs);
          }
          
          // 🎯 Select template based on project's beat_template
          const templateMap: Record<string, any> = {
            'lite-7': LITE_7_TEMPLATE,
            'save-the-cat': SAVE_THE_CAT_TEMPLATE,
            // Add more templates as needed
          };
          
          const selectedTemplate = templateMap[beatTemplate] || SAVE_THE_CAT_TEMPLATE;
          const generatedBeats = generateBeatsFromTemplate(selectedTemplate);
          
          // Get acts again (in case we just created them)
          const finalActs = await TimelineAPI.getActs(projectId);
          const firstActId = finalActs[0]?.id || 'placeholder-act';
          const lastActId = finalActs[finalActs.length - 1]?.id || firstActId;
          
          console.log(`[StructureBeatsSection] 🎯 Creating ${generatedBeats.length} beats from ${beatTemplate} template...`);
          
          // Create beats in database
          const createdBeats = [];
          for (let i = 0; i < generatedBeats.length; i++) {
            const beat = generatedBeats[i];
            try {
              const newBeat = await BeatsAPI.createBeat({
                project_id: projectId,
                label: beat.label,
                template_abbr: beat.templateAbbr || beatTemplate.toUpperCase().replace('-', ''),
                description: beat.items?.join(', ') || '',
                from_container_id: firstActId,
                to_container_id: lastActId,
                pct_from: beat.pctFrom,
                pct_to: beat.pctTo === beat.pctFrom ? beat.pctFrom + 2 : beat.pctTo,
                color: beat.color,
                order_index: i,
              });
              createdBeats.push(newBeat);
            } catch (error) {
              console.error(`[StructureBeatsSection] ❌ Failed to create beat "${beat.label}":`, error);
            }
          }
          
          console.log(`[StructureBeatsSection] ✅ Successfully created ${createdBeats.length} beats`);
          setBeats(createdBeats);
          toast.success(`${createdBeats.length} Story Beats automatisch generiert`);
        } else if (existingBeats.length > 0) {
          console.log(`[StructureBeatsSection] ℹ️ Found ${existingBeats.length} existing beats`);
          setBeats(existingBeats);
        }
      } catch (error) {
        console.error('[StructureBeatsSection] ❌ Error in auto-generate:', error);
        toast.error('Fehler beim Generieren der Beats');
      }
    };

    autoGenerateBeats();
  }, [projectId, beatTemplate]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#6E59A5] text-white h-8 flex items-center">Structure & Beats</Badge>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={structureView} onValueChange={(v) => setStructureView(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="dropdown" className="text-xs md:text-sm px-2 md:px-3">Dropdown</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs md:text-sm px-2 md:px-3">Timeline</TabsTrigger>
              <TabsTrigger value="native" className="text-xs md:text-sm px-2 md:px-3">Native</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <CollapsibleContent>
        <div className="flex border border-border rounded-lg overflow-hidden bg-background" style={{ height: structureView === 'timeline' ? '600px' : 'auto' }}>
          {/* Container Stack - Dynamic Dropdown based on projectType */}
          <div className="flex-1 overflow-y-auto h-full">
            {structureView === 'dropdown' ? (
              projectType === 'book' ? (
                <BookDropdown
                  projectId={projectId}
                  projectType={projectType}
                  initialData={initialData}
                  onDataChange={handleTimelineChange}
                  containerRef={containerStackRef}
                  expandedActs={expandedActs}
                  expandedSequences={expandedSequences}
                  onExpandedActsChange={setExpandedActs}
                  onExpandedSequencesChange={setExpandedSequences}
                />
              ) : (
                <FilmDropdown
                  projectId={projectId}
                  projectType={projectType}
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
              )
            ) : structureView === 'timeline' ? (
              <VideoEditorTimeline
                projectId={projectId}
                projectType={projectType}
                initialData={timelineData}
                onDataChange={handleTimelineChange}
                duration={300}
              />
            ) : structureView === 'native' ? (
              projectType === 'book' ? (
                <NativeBookView
                  key={`native-book-${projectId}-${structureView}`}
                  projectId={projectId}
                  projectType={projectType}
                  initialData={initialData}
                />
              ) : projectType === 'film' || projectType === 'series' ? (
                <NativeScreenplayView
                  key={`native-screenplay-${projectId}-${structureView}`}
                  projectId={projectId}
                  projectType={projectType}
                  initialData={initialData}
                />
              ) : projectType === 'audio' ? (
                <NativeAudiobookView
                  key={`native-audiobook-${projectId}-${structureView}`}
                  projectId={projectId}
                  projectType={projectType}
                  initialData={initialData}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Native View für diesen Projekttyp noch nicht verfügbar
                </div>
              )
            ) : null}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}