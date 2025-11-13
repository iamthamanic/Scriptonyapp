import { useState, useRef } from 'react';
import { ArrowLeft, Camera, Edit2, BarChart3, Trash2, Copy, Save, X, Film, Monitor, Smartphone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { BeatRail, type BeatDefinition } from '../BeatRail';
import { ContainerCard, type ContainerData } from '../ContainerCard';

/**
 * 🎨 LAYOUT PROTOTYPE PAGE
 * 
 * Zeigt Mock-Layouts für Project/World Detail Pages:
 * - Option 1: Cover LINKS + Info RECHTS (Desktop) / Cover OBEN + Collapsible (Mobile)
 * - Option 2: Aktuelles Layout (Cover oben zentriert + Info unten)
 * 
 * User kann zwischen Desktop/Mobile View switchen
 */

type ViewMode = 'desktop' | 'mobile';
type LayoutOption = 'option1' | 'option2' | 'option3';

export default function LayoutPrototypePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [selectedOption, setSelectedOption] = useState<LayoutOption>('option1');

  return (
    <div className="min-h-screen bg-background">
      {/* Controls */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-lg">🎨 Layout Prototyp - Cover + Info</h1>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={viewMode === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setViewMode('desktop')}
                  className="gap-2"
                >
                  <Monitor className="size-4" />
                  Desktop
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setViewMode('mobile')}
                  className="gap-2"
                >
                  <Smartphone className="size-4" />
                  Mobile
                </Button>
              </div>

              {/* Layout Option Toggle */}
              <Separator orientation="vertical" className="h-8" />
              
              <Tabs value={selectedOption} onValueChange={(v) => setSelectedOption(v as LayoutOption)}>
                <TabsList>
                  <TabsTrigger value="option1">Option 1 (NEU)</TabsTrigger>
                  <TabsTrigger value="option2">Option 2 (AKTUELL)</TabsTrigger>
                  <TabsTrigger value="option3">Option 3 (BEATS)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 text-sm text-muted-foreground">
            {selectedOption === 'option1' ? (
              <>
                <strong>Option 1 (NEU):</strong> Desktop = Info links + Cover rechts | Mobile = Cover oben + Collapsible Info
              </>
            ) : selectedOption === 'option2' ? (
              <>
                <strong>Option 2 (AKTUELL):</strong> Cover oben zentriert + Info unten (volle Breite)
              </>
            ) : (
              <>
                <strong>Option 3 (BEATS):</strong> Structure & Beats Tab mit Beat-Rail + Container-Stack (Dropdown/Timeline View)
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="container mx-auto p-8">
        <div 
          className="mx-auto border-2 border-dashed border-primary/20 rounded-lg overflow-hidden bg-background"
          style={{ 
            maxWidth: viewMode === 'desktop' ? '1024px' : '390px',
            transition: 'max-width 0.3s ease'
          }}
        >
          {selectedOption === 'option1' ? (
            <Option1Layout viewMode={viewMode} />
          ) : selectedOption === 'option2' ? (
            <Option2Layout viewMode={viewMode} />
          ) : (
            <Option3Layout viewMode={viewMode} />
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selectedOption === 'option3' ? (
                <>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 bg-primary/10">Beat Rail</Badge>
                    <span className="text-muted-foreground">Lila Spalte mit %-Skala und dynamischen Beat-Bands (klickbar!)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Beat Band</Badge>
                    <span className="text-muted-foreground">Klick auf Beat → expandiert → Edit-Felder erscheinen DIREKT IM BEAT (wie bei Shots!)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Edit-Felder</Badge>
                    <span className="text-muted-foreground">Start/End Container Dropdowns + Percentage Inputs → Beat passt sich live an!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Container</Badge>
                    <span className="text-muted-foreground">Acts → Sequences → Scenes → Shots (alle collapsible)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/30">STC</Badge>
                    <span className="text-muted-foreground">Template-Badge (STC = Save-The-Cat, HJ = Hero's Journey, etc.)</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Cover</Badge>
                    <span className="text-muted-foreground">Portrait 2:3 Ratio (240x360px)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Info Card</Badge>
                    <span className="text-muted-foreground">Projekt-/Welt-Informationen mit Edit/Delete Buttons</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">Collapsible</Badge>
                    <span className="text-muted-foreground">Mobile: Info standardmäßig eingeklappt (spart Platz!)</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * OPTION 1: Cover LEFT + Info RIGHT (Desktop) / Cover TOP + Collapsible (Mobile)
 */
function Option1Layout({ viewMode }: { viewMode: ViewMode }) {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);

  if (viewMode === 'desktop') {
    return (
      <div className="min-h-screen pb-24">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 backdrop-blur-sm bg-background/80 rounded-full h-9 px-3 z-10"
        >
          <ArrowLeft className="size-4 mr-1" />
          Zurück
        </Button>

        {/* Desktop Layout: Info LEFT + Cover RIGHT */}
        <div className="pt-16 px-6">
          <div className="flex gap-6 items-start">
            {/* Info Left - Gleiche Höhe wie Cover (360px) */}
            <div className="flex-1">
              <Card className="h-[360px] flex flex-col">
                <CardHeader className="p-4 flex flex-row items-center justify-between shrink-0">
                  <CardTitle className="text-base">📽️ Projekt-Informationen</CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="size-3.5 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="size-3.5 mr-2" />
                          Duplizieren
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="size-3.5 mr-2" />
                          Statistiken
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="size-3.5 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-1 overflow-y-auto space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Titel</div>
                    <div>Mein Episches Filmprojekt</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Genre</div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Drama</Badge>
                      <Badge variant="secondary">Sci-Fi</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      In Arbeit
                    </Badge>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Erstellt</div>
                    <div className="text-sm">9. November 2025</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Beschreibung</div>
                    <p className="text-sm text-muted-foreground">
                      Eine epische Geschichte über Mut, Freundschaft und die Reise zu den Sternen.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cover Right */}
            <div className="shrink-0">
              <div className="relative group">
                <div 
                  className="w-[240px] aspect-[2/3] rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer relative overflow-hidden shadow-lg"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="size-16 text-primary/30" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 backdrop-blur-sm">
                      <Camera className="size-6 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs (würden hier normal sein) */}
        <div className="px-6 mt-6">
          <Tabs defaultValue="scenes">
            <TabsList>
              <TabsTrigger value="scenes">Szenen</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="characters">Charaktere</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen pb-24">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="absolute top-4 left-4 backdrop-blur-sm bg-background/80 rounded-full h-9 px-3 z-10"
      >
        <ArrowLeft className="size-4 mr-1" />
        Zurück
      </Button>

      {/* Cover Top Centered */}
      <div className="pt-16 pb-4 flex justify-center bg-gradient-to-b from-primary/5 to-transparent">
        <div className="relative group">
          <div 
            className="w-[240px] aspect-[2/3] rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer relative overflow-hidden shadow-lg"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="size-16 text-primary/30" />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 backdrop-blur-sm">
                <Camera className="size-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Info */}
      <div className="px-4">
        <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2">
                  <span>📽️ Projekt-Informationen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {isCollapsibleOpen ? 'Einklappen' : 'Ausklappen'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {isCollapsibleOpen ? '▲' : '▼'}
                  </span>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="p-4 pt-0 space-y-3 border-t">
                <div className="flex gap-2 mb-3">
                  <Button size="sm" variant="outline" className="flex-1 gap-2">
                    <Edit2 className="size-3.5" />
                    Bearbeiten
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">•••</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Copy className="size-3.5 mr-2" />
                        Duplizieren
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart3 className="size-3.5 mr-2" />
                        Statistiken
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="size-3.5 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Titel</div>
                  <div>Mein Episches Filmprojekt</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Genre</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Drama</Badge>
                    <Badge variant="secondary">Sci-Fi</Badge>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    In Arbeit
                  </Badge>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Beschreibung</div>
                  <p className="text-sm text-muted-foreground">
                    Eine epische Geschichte über Mut, Freundschaft und die Reise zu den Sternen.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <Tabs defaultValue="scenes">
          <TabsList className="w-full">
            <TabsTrigger value="scenes" className="flex-1">Szenen</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
            <TabsTrigger value="characters" className="flex-1">Chars</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * OPTION 2: Cover TOP Centered + Info BELOW (Current)
 */
function Option2Layout({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="min-h-screen pb-24">
      {/* Cover Top Centered (wie aktuell) */}
      <div className="relative group w-full flex justify-center bg-gradient-to-b from-primary/5 to-transparent py-4">
        <div 
          className="w-[240px] aspect-[2/3] rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer relative overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="size-16 text-primary/30" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 backdrop-blur-sm">
              <Camera className="size-6 text-primary" />
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 backdrop-blur-sm bg-background/80 rounded-full h-9 px-3 z-10"
        >
          <ArrowLeft className="size-4 mr-1" />
          Zurück
        </Button>
      </div>

      {/* Info Below - Full Width */}
      <div className="px-4 py-6">
        <Card>
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base">📽️ Projekt-Informationen</CardTitle>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    •••
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit2 className="size-3.5 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="size-3.5 mr-2" />
                    Duplizieren
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="size-3.5 mr-2" />
                    Statistiken
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="size-3.5 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Titel</div>
              <div>Mein Episches Filmprojekt</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Genre</div>
              <div className="flex gap-2">
                <Badge variant="secondary">Drama</Badge>
                <Badge variant="secondary">Sci-Fi</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                In Arbeit
              </Badge>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Erstellt</div>
              <div className="text-sm">9. November 2025</div>
            </div>
            <Separator />
            <div>
              <div className="text-xs text-muted-foreground mb-1">Beschreibung</div>
              <p className="text-sm text-muted-foreground">
                Eine epische Geschichte über Mut, Freundschaft und die Reise zu den Sternen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="scenes">
          <TabsList className={viewMode === 'mobile' ? 'w-full' : ''}>
            <TabsTrigger value="scenes" className={viewMode === 'mobile' ? 'flex-1' : ''}>Szenen</TabsTrigger>
            <TabsTrigger value="timeline" className={viewMode === 'mobile' ? 'flex-1' : ''}>Timeline</TabsTrigger>
            <TabsTrigger value="characters" className={viewMode === 'mobile' ? 'flex-1' : ''}>
              {viewMode === 'mobile' ? 'Chars' : 'Charaktere'}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * OPTION 3: Structure & Beats Prototype
 * Beat-Rail + Container-Stack mit Dropdown/Timeline Toggle
 */
function Option3Layout({ viewMode }: { viewMode: ViewMode }) {
  const [structureView, setStructureView] = useState<'dropdown' | 'timeline'>('dropdown');
  const [beats, setBeats] = useState<BeatDefinition[]>(MOCK_BEATS);
  const containerStackRef = useRef<HTMLDivElement>(null);

  const handleUpdateBeat = (beatId: string, updates: Partial<BeatDefinition>) => {
    setBeats(prev => prev.map(beat => 
      beat.id === beatId ? { ...beat, ...updates } : beat
    ));
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Zurück
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <h2>Mein Episches Filmprojekt</h2>
            </div>

            {/* View Toggle */}
            <Tabs value={structureView} onValueChange={(v) => setStructureView(v as any)}>
              <TabsList>
                <TabsTrigger value="dropdown">Dropdown</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Navigation */}
          <Tabs defaultValue="structure" className="mt-3">
            <TabsList>
              <TabsTrigger value="scenes">Szenen</TabsTrigger>
              <TabsTrigger value="structure">Structure & Beats</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="characters">Charaktere</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content: Beat-Rail + Container-Stack */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Beat Rail */}
        <BeatRail
          beats={beats}
          containers={MOCK_CONTAINERS}
          containerStackRef={containerStackRef}
          onUpdateBeat={handleUpdateBeat}
          className="sticky top-[140px] self-start"
        />

        {/* Container Stack */}
        <div
          ref={containerStackRef}
          className="flex-1 overflow-y-auto p-4 space-y-0"
        >
          {structureView === 'dropdown' ? (
            <>
              {MOCK_CONTAINERS.map(container => (
                <ContainerCard
                  key={container.id}
                  container={container}
                  level={0}
                  defaultExpanded={true}
                />
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Timeline View (Coming Soon)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Mock Containers: 3 Acts → Sequences → Scenes → Shots
 */
const MOCK_CONTAINERS: ContainerData[] = [
  {
    id: 'A1',
    type: 'act',
    number: 1,
    title: 'Act 1 - Einführung',
    description: 'Setup der Welt und Charaktere',
    beatChips: ['STC:Opening', 'STC:Theme', 'STC:Setup'],
    children: [
      {
        id: 'A1S1',
        type: 'sequence',
        number: 1,
        title: 'Sequence 1 - Die gewöhnliche Welt',
        children: [
          {
            id: 'A1S1SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Morgendliche Routine',
            beatChips: ['STC:Opening'],
            children: [
              { id: 'A1S1SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Wide Shot Stadt', beatChips: ['STC:Opening'] },
              { id: 'A1S1SC1SH2', type: 'shot', number: 2, title: 'Shot 2 - Close-Up Protagonist' },
              { id: 'A1S1SC1SH3', type: 'shot', number: 3, title: 'Shot 3 - Medium Shot Kaffee' },
            ],
          },
          {
            id: 'A1S1SC2',
            type: 'scene',
            number: 2,
            title: 'Scene 2 - Auf dem Weg zur Arbeit',
            children: [
              { id: 'A1S1SC2SH1', type: 'shot', number: 1, title: 'Shot 1 - Tracking Shot Straße' },
              { id: 'A1S1SC2SH2', type: 'shot', number: 2, title: 'Shot 2 - POV Auto' },
            ],
          },
          {
            id: 'A1S1SC3',
            type: 'scene',
            number: 3,
            title: 'Scene 3 - Im Büro',
            children: [
              { id: 'A1S1SC3SH1', type: 'shot', number: 1, title: 'Shot 1 - Establishing Shot Büro' },
              { id: 'A1S1SC3SH2', type: 'shot', number: 2, title: 'Shot 2 - Medium Shot Schreibtisch' },
            ],
          },
        ],
      },
      {
        id: 'A1S2',
        type: 'sequence',
        number: 2,
        title: 'Sequence 2 - Der Ruf zum Abenteuer',
        beatChips: ['STC:Catalyst'],
        children: [
          {
            id: 'A1S2SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Mysteriöser Anruf',
            beatChips: ['STC:Catalyst'],
            children: [
              { id: 'A1S2SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Close-Up Telefon', beatChips: ['STC:Catalyst'] },
              { id: 'A1S2SC1SH2', type: 'shot', number: 2, title: 'Shot 2 - Reaction Shot' },
            ],
          },
          {
            id: 'A1S2SC2',
            type: 'scene',
            number: 2,
            title: 'Scene 2 - Erste Hinweise',
            children: [
              { id: 'A1S2SC2SH1', type: 'shot', number: 1, title: 'Shot 1 - Insert Shot Dokument' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'A2',
    type: 'act',
    number: 2,
    title: 'Act 2 - Konfrontation',
    description: 'Steigende Spannung und Hindernisse',
    beatChips: ['STC:Midpoint', 'STC:AllIsLost'],
    children: [
      {
        id: 'A2S1',
        type: 'sequence',
        number: 1,
        title: 'Sequence 1 - Neue Verbündete',
        children: [
          {
            id: 'A2S1SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Treffen im Café',
            children: [
              { id: 'A2S1SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Two Shot Dialog' },
            ],
          },
        ],
      },
      {
        id: 'A2S2',
        type: 'sequence',
        number: 2,
        title: 'Sequence 2 - Wendepunkt',
        beatChips: ['STC:Midpoint'],
        children: [
          {
            id: 'A2S2SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Die große Enthüllung',
            beatChips: ['STC:Midpoint'],
            children: [
              { id: 'A2S2SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Dramatic Reveal', beatChips: ['STC:Midpoint'] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'A3',
    type: 'act',
    number: 3,
    title: 'Act 3 - Auflösung',
    description: 'Klimax und finale Konfrontation',
    beatChips: ['STC:Finale', 'STC:FinalImage'],
    children: [
      {
        id: 'A3S1',
        type: 'sequence',
        number: 1,
        title: 'Sequence 1 - Finale Schlacht',
        beatChips: ['STC:Finale'],
        children: [
          {
            id: 'A3S1SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Showdown',
            beatChips: ['STC:Finale'],
            children: [
              { id: 'A3S1SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Epic Wide Shot', beatChips: ['STC:Finale'] },
              { id: 'A3S1SC1SH2', type: 'shot', number: 2, title: 'Shot 2 - Action Sequence' },
            ],
          },
        ],
      },
      {
        id: 'A3S2',
        type: 'sequence',
        number: 2,
        title: 'Sequence 2 - Neue Normalität',
        beatChips: ['STC:FinalImage'],
        children: [
          {
            id: 'A3S2SC1',
            type: 'scene',
            number: 1,
            title: 'Scene 1 - Ein Jahr später',
            beatChips: ['STC:FinalImage'],
            children: [
              { id: 'A3S2SC1SH1', type: 'shot', number: 1, title: 'Shot 1 - Mirror Opening', beatChips: ['STC:FinalImage'] },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Mock Beats: Save-The-Cat Template (vereinfacht auf 8 Beats)
 */
const MOCK_BEATS: BeatDefinition[] = [
  {
    id: 'opening-image',
    label: 'Opening Image',
    templateAbbr: 'STC',
    fromContainerId: 'A1S1SC1SH1',
    toContainerId: 'A1S1SC1SH1',
    pctFrom: 0,
    pctTo: 1,
  },
  {
    id: 'theme-stated',
    label: 'Theme Stated',
    templateAbbr: 'STC',
    fromContainerId: 'A1S1SC1SH2',
    toContainerId: 'A1S1SC1SH3',
    pctFrom: 1,
    pctTo: 3,
  },
  {
    id: 'setup',
    label: 'Set-Up',
    templateAbbr: 'STC',
    fromContainerId: 'A1S1SC2SH1',
    toContainerId: 'A1S1SC3SH2',
    pctFrom: 3,
    pctTo: 10,
  },
  {
    id: 'catalyst',
    label: 'Catalyst',
    templateAbbr: 'STC',
    fromContainerId: 'A1S2SC1SH1',
    toContainerId: 'A1S2SC2SH1',
    pctFrom: 10,
    pctTo: 12,
  },
  {
    id: 'midpoint',
    label: 'Midpoint',
    templateAbbr: 'STC',
    fromContainerId: 'A2S2SC1SH1',
    toContainerId: 'A2S2SC1SH1',
    pctFrom: 48,
    pctTo: 52,
  },
  {
    id: 'all-is-lost',
    label: 'All Is Lost',
    templateAbbr: 'STC',
    fromContainerId: 'A2S2',
    toContainerId: 'A2S2',
    pctFrom: 70,
    pctTo: 75,
  },
  {
    id: 'finale',
    label: 'Finale',
    templateAbbr: 'STC',
    fromContainerId: 'A3S1SC1SH1',
    toContainerId: 'A3S1SC1SH2',
    pctFrom: 85,
    pctTo: 95,
  },
  {
    id: 'final-image',
    label: 'Final Image',
    templateAbbr: 'STC',
    fromContainerId: 'A3S2SC1SH1',
    toContainerId: 'A3S2SC1SH1',
    pctFrom: 98,
    pctTo: 100,
  },
];
