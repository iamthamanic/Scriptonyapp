import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import * as BeatsAPI from '../lib/api/beats-api';
import * as TimelineAPI from '../lib/api/timeline-api';
import { useAuth } from '../hooks/useAuth';
import type { TimelineData } from './FilmDropdown';
import type { BookTimelineData } from './BookDropdown';
import { RichTextEditorModal } from './RichTextEditorModal';
import { ReadonlyTiptapView } from './ReadonlyTiptapView';
import { TimelineTextPreview } from './TimelineTextPreview';

/**
 * 🎬 VIDEO EDITOR TIMELINE (CapCut Style)
 * 
 * NEW ARCHITECTURE:
 * - Unit-based system (seconds or reading-seconds)
 * - Dynamic ticks based on zoom level (no overlaps!)
 * - Anchor-based zoom (zooms to cursor position)
 * - Viewport culling (only render visible items)
 * - Auto-fit initial zoom
 */

interface VideoEditorTimelineProps {
  projectId: string;
  projectType?: string;
  initialData?: TimelineData | BookTimelineData | null;
  onDataChange?: (data: TimelineData | BookTimelineData) => void;
  duration?: number; // Total duration in SECONDS (for both films and books)
  beats?: any[];
  totalWords?: number;
  wordsPerPage?: number;
  targetPages?: number;
  readingSpeedWpm?: number; // Reading speed in words per minute for books
}

// 🎯 ZOOM CONFIGURATION
const MIN_PX_PER_SEC = 2;    // Maximum zoom out
const MAX_PX_PER_SEC = 200;  // Maximum zoom in

// 🎯 TICK CONFIGURATION
const MIN_LABEL_SPACING_PX = 80; // Minimum space between labels

// Time steps for ruler markers (in seconds)
const TIME_STEPS_SECONDS = [
  1, 2, 5, 10, 15, 30,
  60, 120, 300, 600, 900,
  1800, 3600, 7200, 10800
];

// Convert zoom [0-1] to pixels per second (exponential for natural feel)
function pxPerSecFromZoom(zoom: number): number {
  const ratio = MAX_PX_PER_SEC / MIN_PX_PER_SEC;
  return MIN_PX_PER_SEC * Math.pow(ratio, zoom);
}

// Convert pixels per second to zoom [0-1]
function zoomFromPxPerSec(px: number): number {
  const ratio = MAX_PX_PER_SEC / MIN_PX_PER_SEC;
  return Math.log(px / MIN_PX_PER_SEC) / Math.log(ratio);
}

// Choose tick step based on current zoom to avoid overlaps
function chooseTickStep(pxPerSecond: number): number {
  const minSecondsBetweenTicks = MIN_LABEL_SPACING_PX / pxPerSecond;
  return (
    TIME_STEPS_SECONDS.find(step => step >= minSecondsBetweenTicks) ??
    TIME_STEPS_SECONDS[TIME_STEPS_SECONDS.length - 1]
  );
}

// Format time label (HH:MM:SS or MM:SS)
function formatTimeLabel(totalSeconds: number): string {
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

// 📖 Calculate word count from TipTap content (same logic as BookDropdown)
function calculateWordCountFromContent(content: any): number {
  if (!content?.content || !Array.isArray(content.content)) {
    return 0;
  }
  
  let totalWords = 0;
  for (const node of content.content) {
    if (node.type === 'paragraph' && node.content) {
      for (const child of node.content) {
        if (child.type === 'text' && child.text) {
          const words = child.text.trim().split(/\s+/).filter((w: string) => w.length > 0);
          totalWords += words.length;
        }
      }
    }
  }
  return totalWords;
}

export function VideoEditorTimeline({ 
  projectId, 
  projectType = 'film',
  initialData, 
  onDataChange,
  duration = 300,
  beats: parentBeats,
  totalWords,
  wordsPerPage = 250,
  targetPages,
  readingSpeedWpm = 150, // Default reading speed in words per minute
}: VideoEditorTimelineProps) {
  const { getAccessToken } = useAuth();
  
  // 🎨 DESIGN SYSTEM: Beat Styling
  const BEAT_STYLES = {
    container: 'bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-700',
    text: 'text-purple-900 dark:text-purple-100',
  };
  
  // 🎯 ZOOM & VIEWPORT STATE (MUST BE DECLARED FIRST!)
  const [zoom, setZoom] = useState(0.5);
  const [pxPerSec, setPxPerSec] = useState(() => pxPerSecFromZoom(0.5));
  
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Track if initial zoom has been set
  const initialZoomSetRef = useRef(false);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Timeline data
  const [timelineData, setTimelineData] = useState<TimelineData | BookTimelineData | null>(initialData || null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Beats from database
  const [beats, setBeats] = useState<BeatsAPI.StoryBeat[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(false);
  
  // 🎯 MODAL STATE: Scene Content Editor
  const [editingSceneForModal, setEditingSceneForModal] = useState<any | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  
  // 🎯 DURATION & VIEWPORT (NOW SAFE TO USE timelineData!)
  const totalDurationMin = duration / 60; // Total timeline duration in MINUTES (from prop)
  const totalDurationSec = duration; // Convert to SECONDS for timeline calculations
  
  // 📖 BOOK METRICS: Default duration for empty acts
  const DEFAULT_EMPTY_ACT_MIN = 5; // 5 minutes
  const isBookProject = projectType === 'book';
  
  // 📖 PLAYBACK STATE: Word-by-word text display (MUST BE AFTER isBookProject)
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [wordsArray, setWordsArray] = useState<string[]>([]);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackAnimationRef = useRef<number | null>(null);
  const sceneBlocksRef = useRef<any[]>([]);
  
  // 🎯 CURSOR DRAG STATE
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  
  // 🎯 FULLSCREEN STATE
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 🎯 TRACK HEIGHTS (CapCut-Style with localStorage)
  const TRACK_CONSTRAINTS = {
    beat: { min: 40, max: 120, default: 64 },
    act: { min: 40, max: 100, default: 48 },
    sequence: { min: 40, max: 80, default: 40 },
    scene: { min: 80, max: 400, default: 120 }
  };
  
  const STORAGE_KEY = `scriptony-timeline-heights-${projectId}`;
  
  const [trackHeights, setTrackHeights] = useState(() => {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('[VideoEditorTimeline] Failed to parse stored heights:', e);
        }
      }
    }
    return {
      beat: TRACK_CONSTRAINTS.beat.default,
      act: TRACK_CONSTRAINTS.act.default,
      sequence: TRACK_CONSTRAINTS.sequence.default,
      scene: TRACK_CONSTRAINTS.scene.default
    };
  });
  
  // 🎯 RESIZE STATE
  const [resizingTrack, setResizingTrack] = useState<string | null>(null);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(0);
  
  // 💾 SAVE HEIGHTS TO LOCALSTORAGE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackHeights));
      console.log('[VideoEditorTimeline] 💾 Saved track heights:', trackHeights);
    }
  }, [trackHeights, STORAGE_KEY]);
  
  // 🎯 RESIZE HANDLERS
  const handleResizeStart = (track: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingTrack(track);
    resizeStartYRef.current = e.clientY;
    resizeStartHeightRef.current = trackHeights[track as keyof typeof trackHeights];
    console.log(`[Resize] 🎯 Start resizing ${track} at Y=${e.clientY}, height=${resizeStartHeightRef.current}px`);
  };
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingTrack) return;
    
    const deltaY = e.clientY - resizeStartYRef.current;
    const newHeight = resizeStartHeightRef.current + deltaY;
    const constraints = TRACK_CONSTRAINTS[resizingTrack as keyof typeof TRACK_CONSTRAINTS];
    const clampedHeight = Math.max(constraints.min, Math.min(constraints.max, newHeight));
    
    setTrackHeights(prev => ({
      ...prev,
      [resizingTrack]: clampedHeight
    }));
  };
  
  const handleResizeEnd = () => {
    if (resizingTrack) {
      console.log(`[Resize] ✅ Finished resizing ${resizingTrack} to ${trackHeights[resizingTrack as keyof typeof trackHeights]}px`);
    }
    setResizingTrack(null);
  };
  
  // 🎯 GLOBAL RESIZE LISTENERS
  useEffect(() => {
    if (resizingTrack) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingTrack, trackHeights]);
  
  console.log('[VideoEditorTimeline] 📖 Book Timeline:', {
    isBookProject,
    totalWords,
    wordsPerPage,
    targetPages,
    readingSpeedWpm,
  });
  
  // 📖 HELPER: Extract text from TipTap JSON and split into words
  const extractWordsFromContent = (content: any): string[] => {
    if (!content?.content || !Array.isArray(content.content)) {
      return [];
    }
    
    let text = '';
    for (const node of content.content) {
      if (node.type === 'paragraph' && node.content) {
        for (const child of node.content) {
          if (child.type === 'text' && child.text) {
            text += child.text + ' ';
          }
        }
        text += ' '; // Space between paragraphs
      }
    }
    
    return text.trim().split(/\s+/).filter(w => w.length > 0);
  };
  
  // 📖 PLAYBACK LOOP: Animate word-by-word
  useEffect(() => {
    if (!isPlaying || !isBookProject) return;
    
    const msPerWord = 60000 / readingSpeedWpm; // Convert WPM to ms per word
    
    const animate = (timestamp: number) => {
      if (!playbackStartTimeRef.current) {
        playbackStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - playbackStartTimeRef.current;
      const wordsElapsed = Math.floor(elapsed / msPerWord);
      
      if (wordsElapsed < wordsArray.length) {
        // Still within current scene
        setCurrentWordIndex(wordsElapsed);
        
        // Update timeline cursor
        const secondsPerWord = 60 / readingSpeedWpm;
        const newTime = currentTime + (wordsElapsed * secondsPerWord);
        setCurrentTime(newTime);
        
        playbackAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Scene complete - advance to next scene
        console.log('[Playback] 🎬 Scene complete, advancing to next...');
        advanceToNextScene();
      }
    };
    
    playbackAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (playbackAnimationRef.current) {
        cancelAnimationFrame(playbackAnimationRef.current);
        playbackAnimationRef.current = null;
      }
    };
  }, [isPlaying, wordsArray.length, currentTime, readingSpeedWpm, isBookProject]);
  
  // 🚀 ADVANCE TO NEXT SCENE
  const advanceToNextScene = () => {
    const scenes = sceneBlocksRef.current.filter(s => s.startSec >= currentTime);
    
    if (scenes.length > 0) {
      const nextScene = scenes[0];
      console.log('[Playback] ➡️ Loading next scene:', nextScene.title);
      
      // Load words from next scene
      const words = extractWordsFromContent(nextScene.content);
      
      if (words.length > 0) {
        setCurrentSceneId(nextScene.id);
        setWordsArray(words);
        setCurrentWordIndex(0);
        setCurrentTime(nextScene.startSec);
        playbackStartTimeRef.current = 0; // Reset timer
      } else {
        // Empty scene - skip to next
        setCurrentTime(nextScene.endSec);
        advanceToNextScene();
      }
    } else {
      // End of timeline
      console.log('[Playback] 🛑 End of timeline');
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentWordIndex(0);
      setWordsArray([]);
      setCurrentSceneId(null);
    }
  };
  
  // 🎬 HANDLE PLAY/PAUSE TOGGLE
  const handlePlayPause = () => {
    if (!isBookProject) {
      // Film projects: not implemented yet
      console.log('[Playback] ⚠️ Playback only supported for book projects');
      return;
    }
    
    if (!isPlaying) {
      // START PLAYBACK
      console.log('[Playback] ▶️ Starting playback...');
      
      // Find scene at current time or start from beginning
      const currentScene = sceneBlocksRef.current.find(s => 
        currentTime >= s.startSec && currentTime <= s.endSec
      ) || sceneBlocksRef.current[0];
      
      if (!currentScene) {
        console.error('[Playback] ❌ No scenes found');
        return;
      }
      
      // Extract words from scene content
      const words = extractWordsFromContent(currentScene.content);
      
      if (words.length === 0) {
        console.error('[Playback] ❌ Scene has no text content');
        return;
      }
      
      console.log(`[Playback] 📖 Loaded ${words.length} words from "${currentScene.title}"`);
      
      setCurrentSceneId(currentScene.id);
      setWordsArray(words);
      setCurrentWordIndex(0);
      setCurrentTime(currentScene.startSec);
      playbackStartTimeRef.current = 0;
      setIsPlaying(true);
    } else {
      // PAUSE PLAYBACK
      console.log('[Playback] ⏸️ Pausing playback...');
      setIsPlaying(false);
      playbackStartTimeRef.current = 0;
    }
  };
  
  // 📏 MEASURE VIEWPORT WIDTH
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);
  
  // 📏 TRACK SCROLL POSITION
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  
  // 🎯 INITIAL ZOOM: Fit entire timeline to viewport (ONCE!)
  useEffect(() => {
    // Only run once when viewport and duration are first available
    if (initialZoomSetRef.current || !viewportWidth || totalDurationSec <= 0) return;
    
    const pxFit = viewportWidth / totalDurationSec;
    const clamped = Math.min(MAX_PX_PER_SEC, Math.max(MIN_PX_PER_SEC, pxFit));
    const z = zoomFromPxPerSec(clamped);
    
    console.log('[VideoEditorTimeline] 🎯 Initial zoom:', {
      viewportWidth,
      durationSec: `${totalDurationSec.toFixed(0)}s`,
      durationMin: `${(totalDurationSec/60).toFixed(1)}min`,
      pxFit: pxFit.toFixed(2),
      pxPerSec: clamped.toFixed(2),
      zoom: z.toFixed(2)
    });
    
    setZoom(z);
    setPxPerSec(clamped);
    initialZoomSetRef.current = true;
  }, [viewportWidth, totalDurationSec]);
  
  // 🎯 CALCULATED VALUES
  const totalWidthPx = totalDurationSec * pxPerSec;
  const viewStartSec = scrollLeft / pxPerSec;
  const viewEndSec = viewStartSec + (viewportWidth || 0) / pxPerSec;
  
  // 📏 DYNAMIC TICKS (no overlaps!)
  const tickStep = chooseTickStep(pxPerSec);
  const firstTick = Math.floor(viewStartSec / tickStep) * tickStep;
  const lastTick = Math.ceil(viewEndSec / tickStep) * tickStep;
  
  const ticks: { x: number; label: string; sec: number }[] = [];
  for (let t = firstTick; t <= lastTick; t += tickStep) {
    const x = (t - viewStartSec) * pxPerSec;
    ticks.push({ x, label: formatTimeLabel(t), sec: t });
  }
  
  console.log('[VideoEditorTimeline] 📏 Ticks:', {
    pxPerSec: pxPerSec.toFixed(2),
    tickStep: `${tickStep}s`,
    tickCount: ticks.length,
    firstTick: formatTimeLabel(firstTick),
    lastTick: formatTimeLabel(lastTick)
  });
  
  // 🎯 ZOOM HANDLER (with anchor)
  const setZoomAroundCursor = (newZoom: number, anchorX?: number) => {
    const el = scrollRef.current;
    if (!el || !viewportWidth) {
      setZoom(newZoom);
      setPxPerSec(pxPerSecFromZoom(newZoom));
      return;
    }
    
    const oldPx = pxPerSec;
    const nextPx = pxPerSecFromZoom(newZoom);
    const cursorX = anchorX ?? viewportWidth / 2;
    const unitUnderCursor = (el.scrollLeft + cursorX) / oldPx;
    const newScrollLeft = unitUnderCursor * nextPx - cursorX;
    
    setZoom(newZoom);
    setPxPerSec(nextPx);
    
    requestAnimationFrame(() => {
      el.scrollLeft = newScrollLeft;
    });
  };
  
  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = Number(e.target.value);
    setZoomAroundCursor(newZoom);
  };
  
  // 🎯 TRACKPAD ZOOM (Ctrl+Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.001; // Negative because wheel down = zoom out
      const newZoom = Math.max(0, Math.min(1, zoom + zoomDelta));
      
      // Get cursor position relative to viewport
      const rect = viewportRef.current?.getBoundingClientRect();
      const cursorX = rect ? e.clientX - rect.left : viewportWidth / 2;
      
      setZoomAroundCursor(newZoom, cursorX);
    }
  };
  
  // 📊 LOAD TIMELINE DATA
  useEffect(() => {
    if (initialData) {
      setTimelineData(initialData);
    }
  }, [initialData]);
  
  useEffect(() => {
    const loadTimelineData = async () => {
      if (timelineData || isLoadingData) return;
      
      try {
        setIsLoadingData(true);
        const token = await getAccessToken();
        if (!token) return;
        
        console.log('[VideoEditorTimeline] 📥 Loading timeline data...');
        
        const loadedActs = await TimelineAPI.getActs(projectId, token);
        const allSequences = await TimelineAPI.getAllSequencesByProject(projectId, token);
        const allScenes = await TimelineAPI.getAllScenesByProject(projectId, token);
        
        if (isBookProject) {
          // Helper to extract text from Tiptap JSON
          const extractTextFromTiptap = (node: any): string => {
            if (!node) return '';
            let text = '';
            if (node.text) {
              text += node.text;
            }
            if (node.content && Array.isArray(node.content)) {
              node.content.forEach((child: any) => {
                text += extractTextFromTiptap(child);
                if (child.type === 'paragraph' || child.type === 'heading') {
                  text += ' ';
                }
              });
            }
            return text;
          };
          
          const parsedScenes = allScenes.map(scene => {
            // 🚀 PRIORITY: Use wordCount from database (metadata->wordCount) if available
            if (scene.metadata?.wordCount !== undefined && scene.metadata?.wordCount !== null) {
              return { ...scene, wordCount: scene.metadata.wordCount };
            }
            
            // 🔄 FALLBACK: Calculate from TipTap content if DB value is missing
            const contentSource = scene.content || scene.metadata?.content;
            
            if (contentSource && typeof contentSource === 'string') {
              try {
                const parsed = JSON.parse(contentSource);
                const textContent = extractTextFromTiptap(parsed);
                const wordCount = textContent.trim() 
                  ? textContent.trim().split(/\s+/).filter(w => w.length > 0).length 
                  : 0;
                return { ...scene, content: parsed, wordCount };
              } catch (e) {
                const textContent = typeof contentSource === 'string' ? contentSource : '';
                const wordCount = textContent.trim() 
                  ? textContent.trim().split(/\s+/).filter(w => w.length > 0).length 
                  : 0;
                return { ...scene, wordCount };
              }
            }
            
            return { ...scene, wordCount: 0 };
          });
          
          const sequencesWithWordCounts = allSequences.map(seq => {
            // 🚀 Use DB wordCount if available
            const dbWordCount = seq.metadata?.wordCount;
            if (dbWordCount !== undefined && dbWordCount !== null) {
              return { ...seq, wordCount: dbWordCount };
            }
            // Fallback: Calculate from scenes
            const sequenceScenes = parsedScenes.filter(sc => sc.sequenceId === seq.id);
            const totalWords = sequenceScenes.reduce((sum, sc) => sum + (sc.wordCount || 0), 0);
            return { ...seq, wordCount: totalWords };
          });
          
          const actsWithWordCounts = loadedActs.map(act => {
            // 🚀 Use DB wordCount if available
            const dbWordCount = act.metadata?.wordCount;
            if (dbWordCount !== undefined && dbWordCount !== null) {
              return { ...act, wordCount: dbWordCount };
            }
            // Fallback: Calculate from sequences
            const actSequences = sequencesWithWordCounts.filter(s => s.actId === act.id);
            const totalWords = actSequences.reduce((sum, s) => sum + (s.wordCount || 0), 0);
            return { ...act, wordCount: totalWords };
          });
          
          const data: BookTimelineData = {
            acts: actsWithWordCounts,
            sequences: sequencesWithWordCounts,
            scenes: parsedScenes,
          };
          
          setTimelineData(data);
          onDataChange?.(data);
        } else {
          const data: TimelineData = {
            acts: loadedActs,
            sequences: allSequences,
            scenes: allScenes,
            shots: [],
          };
          
          setTimelineData(data);
          onDataChange?.(data);
        }
      } catch (error) {
        console.error('[VideoEditorTimeline] Error loading timeline data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadTimelineData();
  }, [projectId, timelineData, isLoadingData, isBookProject, getAccessToken, onDataChange]);
  
  // 🎬 LOAD BEATS
  useEffect(() => {
    if (parentBeats && parentBeats.length > 0) {
      const convertedBeats: BeatsAPI.StoryBeat[] = parentBeats.map(beat => ({
        id: beat.id || '',
        project_id: projectId,
        user_id: '',
        label: beat.label || '',
        template_abbr: beat.templateAbbr,
        description: beat.description,
        from_container_id: '',
        to_container_id: '',
        pct_from: beat.pctFrom || 0,
        pct_to: beat.pctTo || 0,
        color: beat.color,
        notes: beat.notes,
        order_index: 0,
        created_at: '',
        updated_at: '',
      }));
      setBeats(convertedBeats);
    } else {
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
    }
  }, [projectId, parentBeats]);
  
  // 🎯 MAP BEATS TO PIXELS
  const beatBlocks = beats.map(beat => {
    const startSec = (beat.pct_from / 100) * duration;
    const endSec = (beat.pct_to / 100) * duration;
    const x = (startSec - viewStartSec) * pxPerSec;
    const width = (endSec - startSec) * pxPerSec;
    
    return {
      ...beat,
      startSec,
      endSec,
      x,
      width,
      visible: endSec >= viewStartSec && startSec <= viewEndSec,
    };
  });
  
  // 🎯 CALCULATE ACT POSITIONS (based on cumulative duration for books)
  const actBlocks = (timelineData?.acts || []).map((act, actIndex) => {
    if (isBookProject && readingSpeedWpm) {
      // 📖 BOOK: Position based on cumulative duration
      // Acts with text: duration = (wordCount / wpm) * 60
      // Empty acts: duration = DEFAULT_EMPTY_ACT_SECONDS
      const acts = timelineData?.acts || [];
      const sequences = timelineData?.sequences || [];
      const scenes = timelineData?.scenes || [];
      
      // 🚀 CALCULATE: Act word count from scenes (since acts are containers)
      const getActWordCount = (actId: string): number => {
        const actSequences = sequences.filter(s => s.actId === actId);
        const actScenes = scenes.filter(sc => actSequences.some(seq => seq.id === sc.sequenceId));
        
        return actScenes.reduce((sum, sc) => {
          // Try DB wordCount first
          const dbWordCount = sc.metadata?.wordCount || sc.wordCount || 0;
          if (dbWordCount > 0) return sum + dbWordCount;
          
          // Fallback: Calculate from content
          const contentWordCount = calculateWordCountFromContent(sc.content);
          return sum + contentWordCount;
        }, 0);
      };
      
      // Calculate start time (cumulative duration of all previous acts)
      let startSec = 0;
      for (let i = 0; i < actIndex; i++) {
        const prevAct = acts[i];
        const prevActWordCount = getActWordCount(prevAct.id);
        
        if (prevActWordCount > 0) {
          startSec += (prevActWordCount / readingSpeedWpm) * 60; // Seconds
        } else {
          startSec += DEFAULT_EMPTY_ACT_MIN * 60; // 300 seconds
        }
      }
      
      // Calculate this act's duration
      const actWordCount = getActWordCount(act.id);
      const actDuration = (actWordCount > 0)
        ? (actWordCount / readingSpeedWpm) * 60
        : DEFAULT_EMPTY_ACT_MIN * 60;
      
      const endSec = startSec + actDuration;
      const x = (startSec - viewStartSec) * pxPerSec;
      const width = (endSec - startSec) * pxPerSec;
      
      console.log(`[VideoEditorTimeline] 📊 Act "${act.title}": ${actWordCount} words → ${(actDuration / 60).toFixed(2)} min (${startSec.toFixed(0)}s - ${endSec.toFixed(0)}s)`);
      
      return {
        ...act,
        wordCount: actWordCount, // Include calculated word count
        startSec,
        endSec,
        x,
        width,
        visible: endSec >= viewStartSec && startSec <= viewEndSec,
      };
    } else {
      // 🎬 FILM: Equal distribution
      const totalActs = timelineData?.acts?.length || 1;
      const actDuration = duration / totalActs;
      const startSec = actIndex * actDuration;
      const endSec = (actIndex + 1) * actDuration;
      const x = (startSec - viewStartSec) * pxPerSec;
      const width = (endSec - startSec) * pxPerSec;
      
      return {
        ...act,
        startSec,
        endSec,
        x,
        width,
        visible: endSec >= viewStartSec && startSec <= viewEndSec,
      };
    }
  });
  
  // 🎯 CALCULATE SEQUENCE/CHAPTER POSITIONS
  const sequenceBlocks: any[] = [];
  
  if (isBookProject && totalWords && readingSpeedWpm) {
    // 📖 BOOK: Position based on ACTUAL word count from scenes
    const acts = timelineData?.acts || [];
    const sequences = timelineData?.sequences || [];
    const scenes = timelineData?.scenes || [];
    const secondsPerWord = 60 / readingSpeedWpm;
    
    // 🚀 HELPER: Calculate sequence word count from scenes
    const getSequenceWordCount = (sequenceId: string): number => {
      const seqScenes = scenes.filter(sc => sc.sequenceId === sequenceId);
      return seqScenes.reduce((sum, sc) => {
        // Try DB wordCount first
        const dbWordCount = sc.metadata?.wordCount || sc.wordCount || 0;
        if (dbWordCount > 0) return sum + dbWordCount;
        
        // Fallback: Calculate from content
        return sum + calculateWordCountFromContent(sc.content);
      }, 0);
    };
    
    let wordsSoFar = 0;
    
    acts.forEach((act) => {
      const actSequences = sequences.filter(s => s.actId === act.id);
      
      actSequences.forEach((sequence) => {
        const seqWords = getSequenceWordCount(sequence.id);
        
        if (seqWords > 0) {
          const startSec = wordsSoFar * secondsPerWord;
          const endSec = (wordsSoFar + seqWords) * secondsPerWord;
          const x = (startSec - viewStartSec) * pxPerSec;
          const width = (endSec - startSec) * pxPerSec;
          
          console.log(`[VideoEditorTimeline] 📗 Seq "${sequence.title}": ${seqWords} words → ${startSec.toFixed(0)}s - ${endSec.toFixed(0)}s`);
          
          sequenceBlocks.push({
            ...sequence,
            wordCount: seqWords,
            startSec,
            endSec,
            x,
            width,
            visible: endSec >= viewStartSec && startSec <= viewEndSec,
          });
          
          wordsSoFar += seqWords;
        }
      });
      
      // Add empty act padding if act had no sequences with text
      const actSequenceWords = actSequences.reduce((sum, seq) => sum + getSequenceWordCount(seq.id), 0);
      if (actSequenceWords === 0) {
        // Empty act: add default duration
        wordsSoFar += (DEFAULT_EMPTY_ACT_MIN * 60) / secondsPerWord; // Convert 5 min to words
      }
    });
  } else {
    // 🎬 FILM: Equal distribution within acts
    (timelineData?.acts || []).forEach((act, actIndex) => {
      const sequences = (timelineData?.sequences || []).filter(s => s.actId === act.id);
      const totalActs = timelineData?.acts?.length || 1;
      const actDuration = duration / totalActs;
      const actStartSec = actIndex * actDuration;
      const sequenceDuration = sequences.length > 0 ? actDuration / sequences.length : actDuration;
      
      sequences.forEach((sequence, seqIndex) => {
        const startSec = actStartSec + seqIndex * sequenceDuration;
        const endSec = startSec + sequenceDuration;
        const x = (startSec - viewStartSec) * pxPerSec;
        const width = (endSec - startSec) * pxPerSec;
        
        sequenceBlocks.push({
          ...sequence,
          startSec,
          endSec,
          x,
          width,
          visible: endSec >= viewStartSec && startSec <= viewEndSec,
        });
      });
    });
  }
  
  // 🎯 CALCULATE SCENE/SECTION POSITIONS
  const sceneBlocks: any[] = [];
  
  if (isBookProject && readingSpeedWpm) {
    // 📖 BOOK: Position based on word count from content
    const scenes = timelineData?.scenes || [];
    const sequences = timelineData?.sequences || [];
    const acts = timelineData?.acts || [];
    const secondsPerWord = 60 / readingSpeedWpm;
    
    let wordsSoFar = 0;
    
    acts.forEach((act) => {
      const actSequences = sequences.filter(s => s.actId === act.id);
      
      actSequences.forEach((sequence) => {
        const seqScenes = scenes.filter(sc => sc.sequenceId === sequence.id);
        
        seqScenes.forEach((scene) => {
          // Calculate scene word count from content
          const dbWordCount = scene.metadata?.wordCount || scene.wordCount || 0;
          const sceneWords = dbWordCount > 0
            ? dbWordCount
            : calculateWordCountFromContent(scene.content);
          
          if (sceneWords > 0) {
            const startSec = wordsSoFar * secondsPerWord;
            const endSec = (wordsSoFar + sceneWords) * secondsPerWord;
            const x = (startSec - viewStartSec) * pxPerSec;
            const width = (endSec - startSec) * pxPerSec;
            
            console.log(`[VideoEditorTimeline] 📕 Scene "${scene.title}": ${sceneWords} words → ${startSec.toFixed(0)}s - ${endSec.toFixed(0)}s`);
            
            sceneBlocks.push({
              ...scene,
              wordCount: sceneWords,
              startSec,
              endSec,
              x,
              width,
              visible: endSec >= viewStartSec && startSec <= viewEndSec,
            });
            
            wordsSoFar += sceneWords;
          }
        });
      });
      
      // Add empty act padding if act had no scenes with text
      const actScenes = scenes.filter(sc => actSequences.some(seq => seq.id === sc.sequenceId));
      const actSceneWords = actScenes.reduce((sum, sc) => {
        const dbWordCount = sc.metadata?.wordCount || sc.wordCount || 0;
        return sum + (dbWordCount > 0 ? dbWordCount : calculateWordCountFromContent(sc.content));
      }, 0);
      
      if (actSceneWords === 0) {
        // Empty act: add default duration
        wordsSoFar += (DEFAULT_EMPTY_ACT_MIN * 60) / secondsPerWord; // Convert 5 min to words
      }
    });
  } else {
    // 🎬 FILM: Equal distribution within sequences
    (timelineData?.acts || []).forEach((act, actIndex) => {
      const sequences = (timelineData?.sequences || []).filter(s => s.actId === act.id);
      const totalActs = timelineData?.acts?.length || 1;
      const actDuration = duration / totalActs;
      const actStartSec = actIndex * actDuration;
      const sequenceDuration = sequences.length > 0 ? actDuration / sequences.length : actDuration;
      
      sequences.forEach((sequence, seqIndex) => {
        const scenes = (timelineData?.scenes || []).filter(sc => sc.sequenceId === sequence.id);
        const seqStartSec = actStartSec + seqIndex * sequenceDuration;
        const sceneDuration = scenes.length > 0 ? sequenceDuration / scenes.length : sequenceDuration;
        
        scenes.forEach((scene, sceneIndex) => {
          const startSec = seqStartSec + sceneIndex * sceneDuration;
          const endSec = startSec + sceneDuration;
          const x = (startSec - viewStartSec) * pxPerSec;
          const width = (endSec - startSec) * pxPerSec;
          
          sceneBlocks.push({
            ...scene,
            startSec,
            endSec,
            x,
            width,
            visible: endSec >= viewStartSec && startSec <= viewEndSec,
          });
        });
      });
    });
  }
  
  // 🎯 UPDATE REF: Store sceneBlocks for playback functions
  sceneBlocksRef.current = sceneBlocks;
  
  // 🚀 INITIAL TEXT LOAD: Load first scene text on mount
  useEffect(() => {
    if (isBookProject && sceneBlocks.length > 0 && wordsArray.length === 0) {
      const firstScene = sceneBlocks[0];
      const words = extractWordsFromContent(firstScene.content);
      
      if (words.length > 0) {
        console.log(`[VideoEditorTimeline] 📚 Loading initial text from "${firstScene.title}": ${words.length} words`);
        setCurrentSceneId(firstScene.id);
        setWordsArray(words);
        setCurrentWordIndex(0);
        setCurrentTime(firstScene.startSec);
      }
    }
  }, [isBookProject, sceneBlocks.length, wordsArray.length]);
  
  // 📖 PAGE MARKERS FOR BOOKS (based on word count, not time!)
  const pageMarkers: { x: number; page: number }[] = [];
  
  if (isBookProject && wordsPerPage && readingSpeedWpm) {
    // Calculate page positions based on WORD COUNT
    // Page N = N × wordsPerPage words
    // Position = (words / readingSpeedWpm) × 60 seconds
    
    // Choose page increment based on zoom
    let pageIncrement = 1;
    const estimatedTotalPages = (totalWords || 0) / wordsPerPage;
    const pagesPerViewport = (viewportWidth || 0) / pxPerSec / 60 * readingSpeedWpm / wordsPerPage;
    
    if (pagesPerViewport > 100) {
      pageIncrement = 10; // Zoomed out: every 10 pages
    } else if (pagesPerViewport > 50) {
      pageIncrement = 5; // Medium: every 5 pages
    } else if (pagesPerViewport < 10) {
      pageIncrement = 0.1; // Zoomed in: every 0.1 pages
    }
    
    const maxPages = targetPages || estimatedTotalPages;
    const firstPage = Math.floor(viewStartSec / 60 * readingSpeedWpm / wordsPerPage / pageIncrement) * pageIncrement;
    const lastPage = Math.ceil(viewEndSec / 60 * readingSpeedWpm / wordsPerPage / pageIncrement) * pageIncrement;
    
    for (let page = firstPage; page <= lastPage && page <= maxPages; page += pageIncrement) {
      // Position based on word count: page N is at (N × wordsPerPage) words
      const wordsAtPage = page * wordsPerPage;
      const pageSec = (wordsAtPage / readingSpeedWpm) * 60; // Convert to seconds
      const x = (pageSec - viewStartSec) * pxPerSec;
      pageMarkers.push({ x, page });
    }
    
    console.log('[VideoEditorTimeline] 📄 Page Markers:', {
      wordsPerPage,
      readingSpeedWpm,
      totalWords,
      estimatedPages: estimatedTotalPages.toFixed(1),
      markerCount: pageMarkers.length,
      firstPage: firstPage.toFixed(1),
      lastPage: lastPage.toFixed(1),
      example: pageMarkers.length > 0 
        ? `Page ${pageMarkers[0].page}: ${(pageMarkers[0].page * wordsPerPage)} words = ${((pageMarkers[0].page * wordsPerPage / readingSpeedWpm) * 60).toFixed(1)}s`
        : 'none'
    });
  }
  
  // Handle playhead click
  const handlePlayheadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = viewStartSec + clickX / pxPerSec;
    
    setCurrentTime(Math.max(0, Math.min(duration, newTime)));
    
    // 📖 LOAD TEXT AT CURSOR POSITION (for book projects)
    if (isBookProject && sceneBlocksRef.current.length > 0) {
      const sceneAtTime = sceneBlocksRef.current.find(s => 
        newTime >= s.startSec && newTime <= s.endSec
      );
      
      if (sceneAtTime) {
        const words = extractWordsFromContent(sceneAtTime.content);
        
        if (words.length > 0) {
          // Calculate word index based on time within scene
          const timeIntoScene = newTime - sceneAtTime.startSec;
          const secondsPerWord = 60 / readingSpeedWpm;
          const wordIndex = Math.floor(timeIntoScene / secondsPerWord);
          
          console.log(`[Playhead] 📍 Jumped to scene "${sceneAtTime.title}" at word ${wordIndex}/${words.length}`);
          
          setCurrentSceneId(sceneAtTime.id);
          setWordsArray(words);
          setCurrentWordIndex(Math.min(wordIndex, words.length - 1));
        }
      }
    }
  };
  
  // Handle cursor drag start
  const handleCursorDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const dragStartX = e.clientX - rect.left;
    const dragStartTime = currentTime;
    
    dragStartXRef.current = dragStartX;
    dragStartTimeRef.current = dragStartTime;
    setIsDraggingCursor(true);
  };
  
  // Handle cursor drag move
  const handleCursorDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCursor || !viewportRef.current) return;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const dragCurrentX = e.clientX - rect.left;
    const dragStartX = dragStartXRef.current;
    const dragStartTime = dragStartTimeRef.current;
    
    const dragDeltaX = dragCurrentX - dragStartX;
    const dragDeltaSec = dragDeltaX / pxPerSec;
    
    const newTime = dragStartTime + dragDeltaSec;
    const clampedTime = Math.max(0, Math.min(duration, newTime));
    setCurrentTime(clampedTime);
    
    // 📖 UPDATE TEXT AT DRAG POSITION (for book projects)
    if (isBookProject && sceneBlocksRef.current.length > 0) {
      const sceneAtTime = sceneBlocksRef.current.find(s => 
        clampedTime >= s.startSec && clampedTime <= s.endSec
      );
      
      if (sceneAtTime) {
        const words = extractWordsFromContent(sceneAtTime.content);
        
        if (words.length > 0) {
          // Calculate word index based on time within scene
          const timeIntoScene = clampedTime - sceneAtTime.startSec;
          const secondsPerWord = 60 / readingSpeedWpm;
          const wordIndex = Math.floor(timeIntoScene / secondsPerWord);
          
          // Only update if scene changed or word changed significantly
          if (currentSceneId !== sceneAtTime.id || Math.abs(wordIndex - currentWordIndex) > 2) {
            setCurrentSceneId(sceneAtTime.id);
            setWordsArray(words);
            setCurrentWordIndex(Math.min(wordIndex, words.length - 1));
          }
        }
      }
    }
  };
  
  // Handle cursor drag end
  const handleCursorDragEnd = () => {
    if (isDraggingCursor) {
      console.log(`[Cursor] 🛑 Drag end at ${formatTimeLabel(currentTime)}`);
    }
    setIsDraggingCursor(false);
  };
  
  return (
    <div className={cn(
      "flex flex-col bg-background",
      isFullscreen ? "fixed inset-0 z-50" : "h-full"
    )}>
      {/* Preview Area - Word Display (Karaoke Style) */}
      <div className="flex-shrink-0 bg-card p-6 border-b border-border">
        <div className="text-sm text-muted-foreground mb-2">
          {isBookProject ? 'Text-Ansicht' : 'Videoplayer Ansicht'}
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="relative min-h-[200px] bg-muted rounded overflow-hidden border-2 border-border p-8">
            {isBookProject && wordsArray.length > 0 ? (
              // 📖 BOOK: 3-Sentence display with highlighted current word
              <TimelineTextPreview
                wordsArray={wordsArray}
                currentWordIndex={currentWordIndex}
                currentSceneTitle={sceneBlocks.find(s => s.id === currentSceneId)?.title}
              />
            ) : (
              // 🎬 FILM: Video placeholder
              <>
                <img 
                  src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop"
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full bg-background/20 hover:bg-background/30 backdrop-blur-sm w-16 h-16"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="w-8 h-8 text-foreground" /> : <Play className="w-8 h-8 text-foreground ml-1" />}
                  </Button>
                </div>
              </>
            )}
            
            {!isBookProject && (
              <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-mono">
                {formatTimeLabel(currentTime)}
              </div>
            )}
          </div>
          
          {/* Playback Controls Below Preview */}
          {isBookProject && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={handlePlayPause}
                className="bg-primary hover:bg-primary/90"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="border-border"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
              <div className="flex-1 bg-muted px-3 py-1.5 rounded text-xs font-mono text-foreground border border-border">
                {formatTimeLabel(currentTime)} / {formatTimeLabel(duration)}
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                {readingSpeedWpm} WPM
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline Controls */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-mono">
          Duration: {formatTimeLabel(duration)}
          {isBookProject && targetPages && (
            <span className="ml-4">Target: {targetPages} pages</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={handleZoomSlider}
            className="w-32"
          />
          <span className="text-xs text-muted-foreground font-mono">
            {pxPerSec.toFixed(1)} px/s
          </span>
        </div>
      </div>
      
      {/* Timeline Container */}
      <div className="flex-1 flex">
        {/* Track Labels - Sticky Left */}
        <div className="w-20 flex-shrink-0 bg-card border-r border-border">
          <div className="h-12 border-b border-border px-2 flex items-center bg-card">
            <span className="text-[9px] text-foreground font-medium">Zeit</span>
          </div>
          <div 
            className="border-b border-border px-2 flex items-center bg-card relative"
            style={{ height: `${trackHeights.beat}px` }}
          >
            <span className="text-[9px] text-foreground font-medium">Beat</span>
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-all",
                resizingTrack === 'beat' ? 'border-b-4 border-primary' : 'hover:border-b-4 hover:border-primary'
              )}
              onMouseDown={(e) => handleResizeStart('beat', e)}
            />
          </div>
          <div 
            className="border-b border-border px-2 flex items-center bg-card relative"
            style={{ height: `${trackHeights.act}px` }}
          >
            <span className="text-[9px] text-foreground font-medium">
              {isBookProject ? 'Akt' : 'Act'}
            </span>
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-all",
                resizingTrack === 'act' ? 'border-b-4 border-primary' : 'hover:border-b-4 hover:border-primary'
              )}
              onMouseDown={(e) => handleResizeStart('act', e)}
            />
          </div>
          <div 
            className="border-b border-border px-2 flex items-center bg-card relative"
            style={{ height: `${trackHeights.sequence}px` }}
          >
            <span className="text-[9px] text-foreground font-medium">
              {isBookProject ? 'Kapitel' : 'Seq'}
            </span>
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-all",
                resizingTrack === 'sequence' ? 'border-b-4 border-primary' : 'hover:border-b-4 hover:border-primary'
              )}
              onMouseDown={(e) => handleResizeStart('sequence', e)}
            />
          </div>
          <div 
            className="border-b border-border px-2 flex items-center bg-card relative"
            style={{ height: `${trackHeights.scene}px` }}
          >
            <span className="text-[9px] text-foreground font-medium">
              {isBookProject ? 'Abschnitt' : 'Scene'}
            </span>
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize transition-all",
                resizingTrack === 'scene' ? 'border-b-4 border-primary' : 'hover:border-b-4 hover:border-primary'
              )}
              onMouseDown={(e) => handleResizeStart('scene', e)}
            />
          </div>
        </div>
        
        {/* Timeline Content - Scrollable */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
          onWheel={handleWheel}
          onMouseMove={handleCursorDragMove}
          onMouseUp={handleCursorDragEnd}
          onMouseLeave={handleCursorDragEnd}
        >
          <div ref={viewportRef} style={{ width: `${totalWidthPx}px` }}>
            {/* Time Ruler */}
            <div 
              className="relative h-12 bg-card border-b border-border"
              onClick={handlePlayheadClick}
            >
              {/* Time markers */}
              {ticks.map((tick, index) => (
                <div
                  key={`${tick.sec}-${index}`}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${tick.x}px` }}
                >
                  <div className="w-px h-3 bg-border" />
                  <span className="text-[9px] text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                    {tick.label}
                  </span>
                </div>
              ))}
              
              {/* Page markers for books (second row) */}
              {isBookProject && pageMarkers.map((marker, index) => {
                const isWholePage = marker.page % 1 === 0;
                return (
                  <div
                    key={`page-${marker.page}-${index}`}
                    className="absolute bottom-0 flex flex-col items-center"
                    style={{ left: `${marker.x}px` }}
                  >
                    <div className="w-px h-1.5 bg-border" />
                    <span className={cn(
                      'text-[9px] font-mono mt-6 whitespace-nowrap',
                      isWholePage ? 'text-primary font-bold' : 'text-muted-foreground'
                    )}>
                      S.{marker.page % 1 === 0 ? marker.page.toFixed(0) : marker.page.toFixed(1)}
                    </span>
                  </div>
                );
              })}
              
              {/* Playhead - Draggable */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary cursor-ew-resize z-30 hover:w-1 transition-all"
                style={{ left: `${(currentTime - viewStartSec) * pxPerSec}px` }}
                onMouseDown={handleCursorDragStart}
              >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-md" />
              </div>
            </div>
            
            {/* Beat Track */}
            <div 
              className="relative border-b border-border bg-muted/30"
              style={{ height: `${trackHeights.beat}px` }}
            >
              {beatBlocks
                .filter(beat => beat.visible)
                .map(beat => (
                  <div
                    key={beat.id}
                    className={cn(
                      'absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity',
                      BEAT_STYLES.container
                    )}
                    style={{
                      left: `${beat.x}px`,
                      width: `${beat.width}px`,
                    }}
                  >
                    <div className="h-full flex items-center px-2 overflow-hidden">
                      <span className={cn('text-[10px] font-medium truncate', BEAT_STYLES.text)}>
                        {beat.label}
                      </span>
                    </div>
                  </div>
                ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                style={{ left: `${(currentTime - viewStartSec) * pxPerSec}px` }}
              />
            </div>
            
            {/* Act Track */}
            <div 
              className="relative border-b border-border bg-muted/30"
              style={{ height: `${trackHeights.act}px` }}
            >
              {actBlocks
                .filter(act => act.visible)
                .map(act => (
                  <div
                    key={act.id}
                    className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-700"
                    style={{
                      left: `${act.x}px`,
                      width: `${act.width}px`,
                    }}
                  >
                    <div className="h-full flex items-center px-2 overflow-hidden">
                      <span className="text-[10px] text-blue-900 dark:text-blue-100 font-medium truncate">
                        {act.title}
                      </span>
                    </div>
                  </div>
                ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                style={{ left: `${(currentTime - viewStartSec) * pxPerSec}px` }}
              />
            </div>
            
            {/* Sequence/Chapter Track */}
            <div 
              className="relative border-b border-border bg-muted/30"
              style={{ height: `${trackHeights.sequence}px` }}
            >
              {sequenceBlocks
                .filter(seq => seq.visible)
                .map(seq => (
                  <div
                    key={seq.id}
                    className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity bg-green-50 dark:bg-green-950/40 border-2 border-green-200 dark:border-green-700"
                    style={{
                      left: `${seq.x}px`,
                      width: `${seq.width}px`,
                    }}
                  >
                    <div className="h-full flex items-center px-2 overflow-hidden">
                      <span className="text-[10px] text-green-900 dark:text-green-100 font-medium truncate">
                        {seq.title}
                      </span>
                    </div>
                  </div>
                ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                style={{ left: `${(currentTime - viewStartSec) * pxPerSec}px` }}
              />
            </div>
            
            {/* Scene/Section Track */}
            <div 
              className="relative border-b border-border bg-muted/30"
              style={{ height: `${trackHeights.scene}px` }}
            >
              {sceneBlocks
                .filter(scene => scene.visible)
                .map(scene => (
                  <div
                    key={scene.id}
                    className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-90 transition-opacity bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-700"
                    style={{
                      left: `${scene.x}px`,
                      width: `${scene.width}px`,
                    }}
                    onClick={() => {
                      console.log('[VideoEditorTimeline] 🚀 Opening Content Modal for scene:', scene.id);
                      setEditingSceneForModal(scene);
                      setShowContentModal(true);
                    }}
                  >
                    <div className="h-full flex flex-col px-2 py-1 overflow-hidden">
                      <span className="text-[9px] text-amber-900 dark:text-amber-100 font-medium mb-0.5">
                        {scene.title}
                      </span>
                      <div className="flex-1 overflow-hidden text-[8px] text-amber-700 dark:text-amber-300">
                        {scene.content && typeof scene.content === 'object' ? (
                          <ReadonlyTiptapView content={scene.content} />
                        ) : (
                          <em className="text-muted-foreground/50">Leer...</em>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-20"
                style={{ left: `${(currentTime - viewStartSec) * pxPerSec}px` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-card border-t border-border p-3">
        <Button variant="outline" size="sm" className="border-2 border-primary">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>
      
      {/* 📝 Rich Text Content Editor Modal */}
      {editingSceneForModal && (
        <RichTextEditorModal
          isOpen={showContentModal}
          onClose={() => {
            setShowContentModal(false);
            setEditingSceneForModal(null);
          }}
          value={editingSceneForModal.content}
          onChange={async (jsonDoc) => {
            // Save as JSON object directly
            const now = new Date().toISOString();
            console.log('[VideoEditorTimeline] 💾 Saving content as JSON object:', jsonDoc);
            
            try {
              const token = await getAccessToken();
              if (!token) {
                console.error('[VideoEditorTimeline] No auth token available');
                return;
              }
              
              // Calculate word count from content
              const calculateWordCount = (content: any): number => {
                if (!content?.content || !Array.isArray(content.content)) return 0;
                
                let totalWords = 0;
                for (const node of content.content) {
                  if (node.type === 'paragraph' && node.content) {
                    for (const child of node.content) {
                      if (child.type === 'text' && child.text) {
                        const words = child.text.trim().split(/\s+/).filter((w: string) => w.length > 0);
                        totalWords += words.length;
                      }
                    }
                  }
                }
                return totalWords;
              };
              
              const wordCount = calculateWordCount(jsonDoc);
              
              // Update scene via API
              const updatedScene = await TimelineAPI.updateScene(
                editingSceneForModal.id,
                {
                  content: jsonDoc, // Save as JSON object
                  metadata: {
                    ...editingSceneForModal.metadata,
                    wordCount, // Save word count to metadata
                    lastEditedAt: now,
                  },
                },
                token
              );
              
              console.log('[VideoEditorTimeline] ✅ Scene updated successfully:', updatedScene);
              
              // Update local state
              if (timelineData) {
                const newScenes = (timelineData.scenes || []).map(s =>
                  s.id === editingSceneForModal.id
                    ? { ...s, content: jsonDoc, wordCount, metadata: { ...s.metadata, wordCount, lastEditedAt: now } }
                    : s
                );
                
                const newData = {
                  ...timelineData,
                  scenes: newScenes,
                };
                
                setTimelineData(newData);
                onDataChange?.(newData);
                
                // Update the editing scene to reflect changes immediately in the modal
                setEditingSceneForModal({
                  ...editingSceneForModal,
                  content: jsonDoc,
                  wordCount,
                  metadata: { ...editingSceneForModal.metadata, wordCount, lastEditedAt: now },
                });
              }
            } catch (error) {
              console.error('[VideoEditorTimeline] ❌ Error saving scene content:', error);
            }
          }}
          title={editingSceneForModal.title}
        />
      )}
    </div>
  );
}