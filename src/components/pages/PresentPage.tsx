import { Presentation, Sparkles } from "lucide-react";
import { EmptyState } from "../EmptyState";

export function PresentPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Presentation className="size-5 text-primary" />
          </div>
          <div>
            <h1>Present</h1>
            <p className="text-sm text-muted-foreground">
              Präsentiere deine Projekte und Welten
            </p>
          </div>
        </div>
      </div>

      {/* Empty State - Placeholder */}
      <EmptyState
        icon={Sparkles}
        title="Present-Bereich in Entwicklung"
        description="Dieser Bereich wird bald verfügbar sein. Hier kannst du deine Projekte, Welten und Charaktere präsentieren."
      />
    </div>
  );
}
