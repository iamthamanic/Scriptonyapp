/**
 * 🎬 TIMELINE HELPER FUNCTIONS
 * Extracted from VideoEditorTimeline for better maintainability
 */

export const MIN_BEAT_DURATION_SEC = 3;

export interface Beat {
  id: string;
  pct_from: number;
  pct_to: number;
  label?: string;
}

export interface TrimLeftResult {
  newPctFrom: number;
}

export interface TrimRightResult {
  newPctTo: number;
}

/**
 * Trim beat from LEFT handle
 */
export function trimBeatLeft(
  beat: Beat,
  beats: Beat[],
  newSec: number,
  duration: number,
  beatMagnetEnabled: boolean,
  snapTime: (
    time: number,
    beats: Beat[],
    duration: number,
    pxPerSec: number,
    options?: { excludeBeatId?: string; snapToPlayheadSec?: number }
  ) => number,
  pxPerSec: number,
  currentTimeRef: number
): TrimLeftResult {
  const beatEndSec = (beat.pct_to / 100) * duration;
  
  // Find beat immediately above FIRST (for hard stop check)
  const sortedBeats = [...beats].sort((a, b) => a.pct_from - b.pct_from);
  const beatIndex = sortedBeats.findIndex(b => b.id === beat.id);
  const beatAbove = beatIndex > 0 ? sortedBeats[beatIndex - 1] : null;
  
  // Clamp to min duration and bounds
  let clampedSec = Math.max(0, Math.min(beatEndSec - MIN_BEAT_DURATION_SEC, newSec));
  
  // 🚫 HARD STOP FIRST: Prevent overlap with beat above (always active)
  if (beatAbove) {
    const beatAboveEndSec = (beatAbove.pct_to / 100) * duration;
    clampedSec = Math.max(beatAboveEndSec, clampedSec);
  }
  
  // 🧲 SNAP AFTER HARD STOP (if magnet enabled)
  // This allows snapping to work correctly without being overridden
  if (beatMagnetEnabled) {
    clampedSec = snapTime(clampedSec, beats, duration, pxPerSec, {
      excludeBeatId: beat.id,
      snapToPlayheadSec: currentTimeRef
    });
  }
  
  // Enforce min duration again
  clampedSec = Math.min(beatEndSec - MIN_BEAT_DURATION_SEC, clampedSec);
  
  const newPctFrom = (clampedSec / duration) * 100;
  
  return { newPctFrom };
}

/**
 * Trim beat from RIGHT handle
 */
export function trimBeatRight(
  beat: Beat,
  beats: Beat[],
  newSec: number,
  duration: number,
  beatMagnetEnabled: boolean,
  snapTime: (
    time: number,
    beats: Beat[],
    duration: number,
    pxPerSec: number,
    options?: { excludeBeatId?: string; snapToPlayheadSec?: number }
  ) => number,
  pxPerSec: number,
  currentTimeRef: number
): TrimRightResult {
  const beatStartSec = (beat.pct_from / 100) * duration;
  
  // Find beat immediately below FIRST (for hard stop check)
  const sortedBeats = [...beats].sort((a, b) => a.pct_from - b.pct_from);
  const beatIndex = sortedBeats.findIndex(b => b.id === beat.id);
  const beatBelow = beatIndex < sortedBeats.length - 1 ? sortedBeats[beatIndex + 1] : null;
  
  // Clamp to min duration and bounds
  let clampedSec = Math.max(beatStartSec + MIN_BEAT_DURATION_SEC, Math.min(duration, newSec));
  
  // 🚫 HARD STOP FIRST: Prevent overlap with beat below (always active)
  if (beatBelow) {
    const beatBelowStartSec = (beatBelow.pct_from / 100) * duration;
    clampedSec = Math.min(beatBelowStartSec, clampedSec);
  }
  
  // 🧲 SNAP AFTER HARD STOP (if magnet enabled)
  // This allows snapping to work correctly without being overridden
  if (beatMagnetEnabled) {
    clampedSec = snapTime(clampedSec, beats, duration, pxPerSec, {
      excludeBeatId: beat.id,
      snapToPlayheadSec: currentTimeRef
    });
  }
  
  // Enforce min duration again
  clampedSec = Math.max(beatStartSec + MIN_BEAT_DURATION_SEC, clampedSec);
  
  const newPctTo = (clampedSec / duration) * 100;
  
  return { newPctTo };
}