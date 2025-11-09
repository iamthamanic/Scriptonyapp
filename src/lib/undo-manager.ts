/**
 * 🔄 UNDO MANAGER - Global Undo/Redo System
 * 
 * Provides app-wide undo/redo functionality with CMD+Z / CTRL+Z
 * - Tracks all create, update, delete operations
 * - Maintains undo/redo history
 * - Rollback support for failed operations
 * - Keyboard shortcuts integration
 */

export interface UndoAction {
  type: 'create' | 'update' | 'delete';
  entity: 'act' | 'sequence' | 'scene' | 'shot' | 'character' | 'inspiration' | 'project';
  id: string;
  data?: any; // For rollback
  previousData?: any; // For undo
  timestamp: Date;
  description: string;
}

interface UndoCallback {
  execute: () => Promise<void>;
  description: string;
}

class UndoManager {
  private history: UndoAction[] = [];
  private redoStack: UndoAction[] = [];
  private maxHistorySize = 50;
  private callbacks = new Map<string, UndoCallback>();

  /**
   * Register an action in the undo history
   */
  push(action: UndoAction): void {
    this.history.push(action);
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
    
    console.log('[Undo Manager] Action registered:', action);
  }

  /**
   * Register a callback for undoing a specific operation
   */
  registerCallback(key: string, callback: UndoCallback): void {
    this.callbacks.set(key, callback);
  }

  /**
   * Undo last action
   */
  async undo(): Promise<boolean> {
    const action = this.history.pop();
    if (!action) {
      console.log('[Undo Manager] Nothing to undo');
      return false;
    }

    console.log('[Undo Manager] Undoing action:', action);

    try {
      // Get callback for this action
      const callbackKey = this.getCallbackKey(action);
      const callback = this.callbacks.get(callbackKey);

      if (callback) {
        await callback.execute();
        this.redoStack.push(action);
        return true;
      } else {
        console.warn('[Undo Manager] No callback registered for:', callbackKey);
        return false;
      }
    } catch (error) {
      console.error('[Undo Manager] Error during undo:', error);
      // Restore action to history on failure
      this.history.push(action);
      return false;
    }
  }

  /**
   * Redo last undone action
   */
  async redo(): Promise<boolean> {
    const action = this.redoStack.pop();
    if (!action) {
      console.log('[Undo Manager] Nothing to redo');
      return false;
    }

    console.log('[Undo Manager] Redoing action:', action);

    try {
      const callbackKey = this.getRedoCallbackKey(action);
      const callback = this.callbacks.get(callbackKey);

      if (callback) {
        await callback.execute();
        this.history.push(action);
        return true;
      } else {
        console.warn('[Undo Manager] No redo callback registered for:', callbackKey);
        return false;
      }
    } catch (error) {
      console.error('[Undo Manager] Error during redo:', error);
      // Restore action to redo stack on failure
      this.redoStack.push(action);
      return false;
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.redoStack = [];
    this.callbacks.clear();
    console.log('[Undo Manager] History cleared');
  }

  /**
   * Get undo history
   */
  getHistory(): UndoAction[] {
    return [...this.history];
  }

  /**
   * Get redo stack
   */
  getRedoStack(): UndoAction[] {
    return [...this.redoStack];
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private getCallbackKey(action: UndoAction): string {
    return `undo:${action.type}:${action.entity}:${action.id}`;
  }

  private getRedoCallbackKey(action: UndoAction): string {
    return `redo:${action.type}:${action.entity}:${action.id}`;
  }
}

// Singleton instance
export const undoManager = new UndoManager();

/**
 * Hook up keyboard shortcuts for undo/redo
 */
export function setupUndoKeyboardShortcuts(): () => void {
  const handleKeyDown = async (event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // CMD+Z / CTRL+Z - Undo
    if (ctrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      const success = await undoManager.undo();
      if (success) {
        const toast = await import('sonner');
        toast.toast.success('Rückgängig gemacht');
      }
    }

    // CMD+SHIFT+Z / CTRL+Y - Redo
    if ((ctrlOrCmd && event.shiftKey && event.key === 'z') || 
        (ctrlOrCmd && event.key === 'y')) {
      event.preventDefault();
      const success = await undoManager.redo();
      if (success) {
        const toast = await import('sonner');
        toast.toast.success('Wiederherstellt');
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * React hook for undo functionality
 */
export function useUndo() {
  const canUndo = undoManager.canUndo();
  const canRedo = undoManager.canRedo();

  return {
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    canUndo,
    canRedo,
    history: undoManager.getHistory(),
    redoStack: undoManager.getRedoStack(),
  };
}
