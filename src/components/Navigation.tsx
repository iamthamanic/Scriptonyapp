import { Home, Film, Globe, Dumbbell, Upload, ShieldCheck, Settings, Moon, Sun, User, Presentation, Layers, Database } from "lucide-react";
import { Button } from "./ui/button";
import scriptonyLogo from 'figma:asset/762fa3b0c4bc468cb3c0661e6181aee92a01370d.png';
import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { getAuthToken } from "../lib/auth/getAuthToken";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: string;
  onToggleTheme: () => void;
  userRole: string;
}

export function Navigation({ currentPage, onNavigate, theme, onToggleTheme, userRole }: NavigationProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateWordCounts = async () => {
    console.log('🚨🚨🚨 NEUER CODE LÄUFT! WC Button geklickt! 🚨🚨🚨');
    console.log('🔥 WC Button clicked! Starting word count recalculation...');
    setIsRecalculating(true);
    
    try {
      console.log('📦 Importing projectId...');
      const { projectId } = await import("../utils/supabase/info");
      console.log('🔑 Getting auth token...');
      const token = await getAuthToken();
      console.log('✅ Auth token:', token ? 'EXISTS' : 'NULL');
      
      if (!token) {
        console.log('❌ No auth token!');
        toast.error("Nicht authentifiziert", {
          description: "Bitte melde dich an, um diese Aktion auszuführen."
        });
        setIsRecalculating(false);
        return;
      }
      
      console.log('📞 Fetching projects...');
      // Get all book projects
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b/projects`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Response error:', errorText);
        throw new Error(`Failed to fetch projects: ${response.status} ${errorText}`);
      }
      
      const projects = await response.json();
      console.log('📚 Total projects:', projects.length);
      console.log('🔍 All project types:', projects.map((p: any) => ({ title: p.title, type: p.type })));
      const bookProjects = projects.filter((p: any) => p.type === 'book');
      console.log('📖 Book projects:', bookProjects.length, bookProjects.map((p: any) => p.title));
      
      if (bookProjects.length === 0) {
        console.log('⚠️ No book projects found');
        toast.info("Keine Buch-Projekte gefunden", {
          description: "Es gibt keine Buch-Projekte zum Aktualisieren."
        });
        setIsRecalculating(false);
        return;
      }
      
      let totalUpdated = 0;
      
      // Recalculate word counts for each book project
      for (const project of bookProjects) {
        console.log(`🔄 Recalculating for project: ${project.title} (${project.id})`);
        const recalcResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b/projects/${project.id}/recalculate-word-counts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );
        
        console.log(`📊 Recalc response status for ${project.title}:`, recalcResponse.status);
        
        if (recalcResponse.ok) {
          const result = await recalcResponse.json();
          console.log(`✅ Result for ${project.title}:`, result);
          totalUpdated += result.updated || 0;
        } else {
          const errorText = await recalcResponse.text();
          console.log(`❌ Recalc error for ${project.title}:`, errorText);
        }
      }
      
      console.log('🎉 Total updated:', totalUpdated);
      toast.success("Word Counts aktualisiert!", {
        description: `${totalUpdated} Szenen in ${bookProjects.length} Buch-Projekt(en) aktualisiert.`
      });
    } catch (error: any) {
      console.error('❌ Word count recalculation error:', error);
      toast.error("Fehler beim Aktualisieren", {
        description: error.message
      });
    } finally {
      console.log('🏁 Finished, setting isRecalculating to false');
      setIsRecalculating(false);
    }
  };

  const baseNavItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "projekte", label: "Projekte", icon: Layers },
    { id: "worldbuilding", label: "Welten", icon: Globe },
    { id: "gym", label: "Gym", icon: Dumbbell },
    { id: "present", label: "Present", icon: Presentation },
  ];
  
  const navItems = userRole === "superadmin" 
    ? [...baseNavItems, { id: "admin", label: "Admin", icon: ShieldCheck }]
    : userRole === "admin"
    ? [...baseNavItems, { id: "admin", label: "Admin", icon: ShieldCheck }]
    : baseNavItems;

  // Map page IDs to display titles
  const pageTitles: { [key: string]: string } = {
    home: "Home",
    projekte: "Projekte",
    worldbuilding: "Worldbuilding",
    gym: "Creative Gym",
    upload: "Skriptanalyse",
    admin: "Admin",
    settings: "Einstellungen",
    superadmin: "Superadmin",
    present: "Present",
  };

  const currentPageTitle = pageTitles[currentPage] || "Scriptony";

  return (
    <>
      {/* Mobile-optimized Top Bar */}
      <nav className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src={scriptonyLogo}
                alt="Scriptony Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold">{currentPageTitle}</span>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* TEMP: Layout Prototype Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("layout-prototype")}
              className="text-xs h-8 px-2 bg-primary/10 hover:bg-primary/20"
            >
              🎨 Proto
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("settings")}
              className="rounded-full w-9 h-9"
            >
              <Settings className="size-4" />
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="size-9"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
            
            {userRole === "superadmin" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("superadmin")}
                className="rounded-full w-9 h-9"
              >
                <User className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[64px] transition-all ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                <div className={`transition-all ${isActive ? 'scale-110' : ''}`}>
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}