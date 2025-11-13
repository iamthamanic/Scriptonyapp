import { Home, Film, Globe, Dumbbell, Upload, ShieldCheck, Settings, Moon, Sun, User, Presentation, Layers } from "lucide-react";
import { Button } from "./ui/button";
import scriptonyLogo from 'figma:asset/762fa3b0c4bc468cb3c0661e6181aee92a01370d.png';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: string;
  onToggleTheme: () => void;
  userRole: string;
}

export function Navigation({ currentPage, onNavigate, theme, onToggleTheme, userRole }: NavigationProps) {
  const baseNavItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "projects", label: "Projekte", icon: Layers },
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
    projects: "Projekte",
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
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="rounded-full w-9 h-9"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
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