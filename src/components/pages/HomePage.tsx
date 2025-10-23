import { useState, useEffect } from "react";
import { Clock, Quote, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { LoadingSpinner } from "../LoadingSpinner";
import { projectsApi } from "../../utils/api";

interface HomePageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projects = await projectsApi.getAll();
      // Sort by lastEdited and take top 3
      if (projects && Array.isArray(projects) && projects.length > 0) {
        const sorted = projects
          .sort((a: any, b: any) => {
            const dateA = new Date(b.lastEdited || b.createdAt);
            const dateB = new Date(a.lastEdited || a.createdAt);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 3);
        setRecentProjects(sorted);
      } else {
        setRecentProjects([]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setRecentProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Vor ${diffMins} Minuten`;
    if (diffHours < 24) return `Vor ${diffHours} Stunden`;
    if (diffDays === 1) return "Gestern";
    return `Vor ${diffDays} Tagen`;
  };

  const quote = {
    text: "The scariest moment is always just before you start.",
    author: "Stephen King",
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header - Mobile optimiert */}
      <div className="px-4 py-6 bg-gradient-to-b from-primary/5 to-transparent">
        <p className="text-muted-foreground">
          Willkommen zurück! 👋
        </p>
      </div>

      {/* Recent Projects */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2>Zuletzt bearbeitet</h2>
          <button 
            onClick={() => onNavigate("projects")}
            className="text-sm text-primary flex items-center gap-1"
          >
            Alle
            <ChevronRight className="size-4" />
          </button>
        </div>
        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Noch keine Projekte. Erstelle dein erstes Projekt!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <Card 
                key={project.id}
                className="active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => onNavigate("projects", project.id)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-1 truncate">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {project.logline}
                      </CardDescription>
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{formatTimeAgo(project.lastEdited)}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Quote */}
      <section className="px-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Quote className="size-10 text-primary mb-4 opacity-50" />
              <p className="italic mb-3 text-sm leading-relaxed">
                &ldquo;{quote.text}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">— {quote.author}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}