import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import * as BeatsAPI from '../lib/api/beats-api';
import type { TimelineData } from './FilmDropdown';
import type { BookTimelineData } from './BookDropdown';

/**
 * 🎬 VIDEO EDITOR TIMELINE (CapCut Style)
 * 
 * Features:
 * - Preview area with video player
 * - Multi-track timeline (Beats, Acts, Sequences, Scenes, Shots, Audio)
 * - Real data integration from FilmDropdown/BookDropdown
 * - CRUD operations for all hierarchy levels
 * - Pinch-to-zoom & pan gestures
 * - Draggable playhead
 * - Horizontal timeline ruler
 * - Full Dark Mode Support with App Design System
 */

interface VideoEditorTimelineProps {
  projectId: string;
  projectType?: string;
  initialData?: TimelineData | BookTimelineData | null;
  onDataChange?: (data: TimelineData | BookTimelineData) => void;
  duration?: number; // Total duration in seconds (default: 300 = 5 minutes)
}

export function VideoEditorTimeline({ 
  projectId, 
  projectType = 'film',
  initialData, 
  onDataChange,
  duration = 300 
}: VideoEditorTimelineProps) {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Zoom & Pan state
  const [zoom, setZoom] = useState(1.5); // Default zoom
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  
  // Timeline data
  const [timelineData, setTimelineData] = useState<TimelineData | BookTimelineData | null>(initialData || null);
  
  // 🎬 Real beats from database
  const [beats, setBeats] = useState<BeatsAPI.StoryBeat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);
  
  // Determine if it's a book project
  const isBookProject = projectType === 'book';
  
  // Track configuration based on project type
  const trackConfig = isBookProject ? [
    { id: 'beat', label: 'Beat', height: 'h-8' },
    { id: 'act', label: 'Act', height: 'h-12' },
    { id: 'chapter', label: 'Kapitel', height: 'h-10' },
    { id: 'section', label: 'Abschnitt', height: 'h-10' },
  ] : [
    { id: 'beat', label: 'Beat', height: 'h-8' },
    { id: 'act', label: 'Act', height: 'h-12' },
    { id: 'sequence', label: 'Seq', height: 'h-10' },
    { id: 'scene', label: 'Scene', height: 'h-10' },
    { id: 'shot', label: 'Shot', height: 'h-16' },
    { id: 'audio', label: 'Audio', height: 'h-8' },
  ];
  
  // Sync with parent data changes
  useEffect(() => {
    if (initialData) {
      setTimelineData(initialData);
    }
  }, [initialData]);
  
  // 🎬 Load beats from database
  useEffect(() => {
    const loadBeats = async () => {
      try {
        setBeatsLoading(true);
        const fetchedBeats = await BeatsAPI.getBeats(projectId);
        setBeats(fetchedBeats);
      } catch (error) {
        console.error('[VideoEditorTimeline] Failed to load beats:', error);
      } finally {
        setBeatsLoading(false);
      }
    };
    
    loadBeats();
  }, [projectId]);
  
  // Calculate timeline width based on zoom level
  const pixelsPerSecond = 10 * zoom;
  const timelineWidth = duration * pixelsPerSecond;
  
  // Convert time to pixel position
  const timeToPixels = (time: number) => time * pixelsPerSecond;
  
  // Convert pixel position to time
  const pixelsToTime = (pixels: number) => pixels / pixelsPerSecond;
  
  // Timeline ruler markers (every 30 seconds)
  const rulerMarkers = [];
  for (let t = 0; t <= duration; t += 30) {
    rulerMarkers.push(t);
  }
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle playhead click
  const handlePlayheadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const newTime = pixelsToTime(clickX);
    
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
  };
  
  // Handle zoom (mouse wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.001;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + zoomDelta)));
    }
  };
  
  // Handle touch gestures (pinch-to-zoom & pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      setTouchStartX(e.touches[0].clientX);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const zoomDelta = (distance - lastTouchDistance) * 0.005;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + zoomDelta)));
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isPanning && scrollContainerRef.current) {
      const deltaX = touchStartX - e.touches[0].clientX;
      scrollContainerRef.current.scrollLeft += deltaX;
      setTouchStartX(e.touches[0].clientX);
    }
  };
  
  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };
  
  // Map duration to timeline position (0-100%)
  const getDurationPercentage = (duration: number | undefined): number => {
    if (!duration) return 5; // Default 5% if no duration
    return (duration / this.duration) * 100;
  };
  
  // Calculate item positions based on hierarchical data
  const calculateItemPosition = (
    actIndex: number, 
    sequenceIndex?: number, 
    sceneIndex?: number
  ) => {
    if (!timelineData?.acts) return { start: 0, end: 100 };
    
    const totalActs = timelineData.acts.length;
    const actDuration = 100 / totalActs;
    
    if (sequenceIndex === undefined) {
      // Act level
      return {
        start: actIndex * actDuration,
        end: (actIndex + 1) * actDuration,
      };
    }
    
    const act = timelineData.acts[actIndex];
    const sequences = timelineData.sequences?.filter(s => s.actId === act.id) || [];
    const totalSequences = sequences.length || 1;
    const sequenceDuration = actDuration / totalSequences;
    
    if (sceneIndex === undefined) {
      // Sequence level
      return {
        start: actIndex * actDuration + sequenceIndex * sequenceDuration,
        end: actIndex * actDuration + (sequenceIndex + 1) * sequenceDuration,
      };
    }
    
    const sequence = sequences[sequenceIndex];
    const scenes = timelineData.scenes?.filter(s => s.sequenceId === sequence.id) || [];
    const totalScenes = scenes.length || 1;
    const sceneDuration = sequenceDuration / totalScenes;
    
    // Scene level
    return {
      start: actIndex * actDuration + sequenceIndex * sequenceDuration + sceneIndex * sceneDuration,
      end: actIndex * actDuration + sequenceIndex * sequenceDuration + (sceneIndex + 1) * sceneDuration,
    };
  };
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Preview Area */}
      <div className="flex-shrink-0 bg-card p-6 border-b border-border">
        <div className="text-sm text-muted-foreground mb-2">Videoplayer Ansicht</div>
        <div className="max-w-xs mx-auto">
          {/* Video Player */}
          <div className="relative aspect-video bg-muted rounded overflow-hidden border-2 border-border">
            <img 
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop"
              alt="Preview"
              className="w-full h-full object-cover"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="default"
                size="icon"
                className="rounded-full bg-background/20 hover:bg-background/30 backdrop-blur-sm w-12 h-12"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-6 h-6 text-foreground" /> : <Play className="w-6 h-6 text-foreground ml-1" />}
              </Button>
            </div>
            
            {/* Timecode */}
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-mono">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Ruler (Top) */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="flex">
          {/* Track Labels Spacer */}
          <div className="w-20 flex-shrink-0 bg-card" />
          
          {/* Ruler */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div 
              ref={timelineContainerRef}
              className="relative h-8 bg-card"
              style={{ width: `${timelineWidth}px` }}
              onClick={handlePlayheadClick}
            >
              {/* Time Markers */}
              {rulerMarkers.map(time => (
                <div
                  key={time}
                  className="absolute top-0 bottom-0"
                  style={{ left: `${timeToPixels(time)}px` }}
                >
                  <div className="w-px h-2 bg-border" />
                  <span className="absolute top-3 -translate-x-1/2 text-[9px] text-muted-foreground font-mono">
                    {formatTime(time)}
                  </span>
                </div>
              ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-30"
                style={{ left: `${timeToPixels(currentTime)}px` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline Tracks */}
      <div 
        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex">
          {/* Track Labels Column */}
          <div className="w-20 flex-shrink-0 bg-card border-r border-border">
            {trackConfig.map(track => (
              <div key={track.id} className={cn(track.height, "border-b border-border px-2 flex items-center")}>
                <span className="text-[9px] text-foreground font-medium">{track.label}</span>
              </div>
            ))}
          </div>
          
          {/* Track Content Area */}
          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden"
            style={{ width: `${timelineWidth}px` }}
          >
            <div style={{ width: `${timelineWidth}px` }}>
              {/* Beat Track */}
              <div className="relative h-8 border-b border-border bg-muted/30">
                {beats.map(beat => {
                  const left = timeToPixels((beat.pct_from / 100) * duration);
                  const width = timeToPixels(((beat.pct_to - beat.pct_from) / 100) * duration);
                  
                  return (
                    <div
                      key={beat.id}
                      className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        backgroundColor: beat.color || 'hsl(var(--primary) / 0.6)',
                      }}
                    >
                      <div className="h-full flex items-center px-2">
                        <span className="text-[9px] text-primary-foreground font-medium truncate">
                          {beat.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                  style={{ left: `${timeToPixels(currentTime)}px` }}
                />
              </div>
              
              {/* Act Track */}
              <div className="relative h-12 border-b border-border bg-muted/30">
                {timelineData?.acts?.map((act, actIndex) => {
                  const position = calculateItemPosition(actIndex);
                  const left = timeToPixels((position.start / 100) * duration);
                  const width = timeToPixels(((position.end - position.start) / 100) * duration);
                  
                  return (
                    <div
                      key={act.id}
                      className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-blue-500/70 dark:bg-blue-400/70"
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                      }}
                    >
                      <div className="h-full flex items-center px-2 overflow-hidden">
                        <span className="text-[10px] text-white dark:text-black font-medium truncate">
                          {act.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                  style={{ left: `${timeToPixels(currentTime)}px` }}
                />
              </div>
              
              {/* Sequence/Chapter Track */}
              <div className="relative h-10 border-b border-border bg-muted/30">
                {timelineData?.acts?.map((act, actIndex) => {
                  const sequences = timelineData.sequences?.filter(s => s.actId === act.id) || [];
                  
                  return sequences.map((sequence, seqIndex) => {
                    const position = calculateItemPosition(actIndex, seqIndex);
                    const left = timeToPixels((position.start / 100) * duration);
                    const width = timeToPixels(((position.end - position.start) / 100) * duration);
                    
                    return (
                      <div
                        key={sequence.id}
                        className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-emerald-400/70 dark:bg-emerald-500/70"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                        }}
                      >
                        <div className="h-full flex items-center px-2 overflow-hidden">
                          <span className="text-[9px] text-black dark:text-white font-medium truncate">
                            {sequence.title}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                  style={{ left: `${timeToPixels(currentTime)}px` }}
                />
              </div>
              
              {/* Scene/Section Track */}
              <div className="relative h-10 border-b border-border bg-muted/30">
                {timelineData?.acts?.map((act, actIndex) => {
                  const sequences = timelineData.sequences?.filter(s => s.actId === act.id) || [];
                  
                  return sequences.map((sequence, seqIndex) => {
                    const scenes = timelineData.scenes?.filter(s => s.sequenceId === sequence.id) || [];
                    
                    return scenes.map((scene, sceneIndex) => {
                      const position = calculateItemPosition(actIndex, seqIndex, sceneIndex);
                      const left = timeToPixels((position.start / 100) * duration);
                      const width = timeToPixels(((position.end - position.start) / 100) * duration);
                      
                      return (
                        <div
                          key={scene.id}
                          className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-muted-foreground/50"
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                          }}
                        >
                          <div className="h-full flex items-center px-2 overflow-hidden">
                            <span className="text-[9px] text-foreground font-medium truncate">
                              {scene.title}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  });
                })}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                  style={{ left: `${timeToPixels(currentTime)}px` }}
                />
              </div>
              
              {/* Shot Track (Film only) */}
              {!isBookProject && (
                <div className="relative h-16 border-b border-border bg-muted/30">
                  {(timelineData as TimelineData)?.shots?.slice(0, 1).map((shot, index) => {
                    // Show first shot as example (will need proper positioning logic)
                    const left = timeToPixels(0);
                    const width = timeToPixels(30);
                    
                    return (
                      <div
                        key={shot.id}
                        className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity overflow-hidden bg-muted border border-border"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                        }}
                      >
                        <img 
                          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&h=60&fit=crop"
                          alt="Shot thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                  
                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                    style={{ left: `${timeToPixels(currentTime)}px` }}
                  />
                </div>
              )}
              
              {/* Audio/Dialog Track (Film only) */}
              {!isBookProject && (
                <div className="relative h-8 border-b border-border bg-muted/30">
                  {/* Example audio clip */}
                  <div
                    className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-yellow-500/70 dark:bg-yellow-400/70"
                    style={{
                      left: `${timeToPixels(0)}px`,
                      width: `${timeToPixels(25)}px`,
                    }}
                  >
                    <div className="h-full flex items-center px-2">
                      <span className="text-[9px] text-black dark:text-black font-medium truncate">
                        Dialog
                      </span>
                    </div>
                  </div>
                  
                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                    style={{ left: `${timeToPixels(currentTime)}px` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-card border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>
    </div>
  );
}