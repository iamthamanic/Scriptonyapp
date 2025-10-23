/**
 * 🎬 FILM TIMELINE PAGE
 * Zeigt die neue hierarchische Timeline mit Template-System
 */

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { TimelineView } from '../timeline/TimelineView';
import { toast } from 'sonner@2.0.3';

interface FilmTimelinePageProps {
  projectId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function FilmTimelinePage({ projectId, onNavigate }: FilmTimelinePageProps) {
  const [projectTitle, setProjectTitle] = useState('');

  useEffect(() => {
    // TODO: Load project title from API
    setProjectTitle('My Film Project');
  }, [projectId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('projects')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{projectTitle}</h1>
                <p className="text-sm text-gray-500">Film Timeline - 3-Akt-Struktur</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Timeline System */}
      <div className="py-6">
        <TimelineView projectId={projectId} projectType="film" />
      </div>
    </div>
  );
}
