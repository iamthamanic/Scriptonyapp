import { useState } from 'react';
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
type LayoutOption = 'option1' | 'option2';

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
            ) : (
              <>
                <strong>Option 2 (AKTUELL):</strong> Cover oben zentriert + Info unten (volle Breite)
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
          ) : (
            <Option2Layout viewMode={viewMode} />
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
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
