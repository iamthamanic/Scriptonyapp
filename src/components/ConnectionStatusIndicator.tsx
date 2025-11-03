/**
 * 🔌 Connection Status Indicator
 * 
 * Shows a small indicator if Edge Functions are not reachable.
 * Helps users immediately see if there's a connectivity problem.
 */

import { useState, useEffect } from 'react';
import { AlertCircle, WifiOff, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { EDGE_FUNCTIONS } from '../lib/api-gateway';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ConnectionStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    setErrorDetails(null);

    // Test essential functions
    const essentialFunctions = [
      EDGE_FUNCTIONS.AUTH,
      EDGE_FUNCTIONS.PROJECTS,
      EDGE_FUNCTIONS.PROJECT_NODES,
    ];

    try {
      const results = await Promise.allSettled(
        essentialFunctions.map(async (funcName) => {
          const url = `https://${projectId}.supabase.co/functions/v1/${funcName}/health`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (!response.ok) {
            throw new Error(`${funcName}: HTTP ${response.status}`);
          }

          return { funcName, ok: true };
        })
      );

      // Check if any failed
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        const errors = failures.map((f: any) => f.reason?.message || 'Unknown error').join(', ');
        setStatus('error');
        setErrorDetails(errors);
      } else {
        setStatus('ok');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorDetails(error.message || 'Cannot connect to server');
    }
  };

  // Don't show anything if OK or dismissed
  if (status === 'ok' || dismissed) {
    return null;
  }

  // Checking state - minimal indicator
  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm shadow-lg">
          <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-blue-700 dark:text-blue-300">Verbindung prüfen...</span>
        </div>
      </div>
    );
  }

  // Error state - full alert
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-lg">
        <div className="flex items-start gap-3">
          <WifiOff className="size-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1 space-y-2">
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="font-medium mb-1">⚠️ Verbindungsproblem</div>
              <div className="text-sm">
                Die Scriptony Edge Functions sind nicht erreichbar.
              </div>
              {errorDetails && (
                <div className="text-xs mt-2 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-x-auto">
                  {errorDetails}
                </div>
              )}
            </AlertDescription>
            
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/api-test'}
                className="text-xs border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                Diagnose starten
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="text-xs text-red-700 dark:text-red-300"
              >
                Ausblenden
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}
