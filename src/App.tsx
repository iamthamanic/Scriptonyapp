import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./components/pages/HomePage";
import { ProjectsPage } from "./components/pages/ProjectsPage";
import { WorldbuildingPage } from "./components/pages/WorldbuildingPage";
import { CreativeGymPage } from "./components/pages/CreativeGymPage";
import { UploadPage } from "./components/pages/UploadPage";
import { AdminPage } from "./components/pages/AdminPage";
import { SettingsPage } from "./components/pages/SettingsPage";
import { SuperadminPage } from "./components/pages/SuperadminPage";
import { PresentPage } from "./components/pages/PresentPage";
import { AuthPage } from "./components/pages/AuthPage";
import { MigrationPage } from "./components/pages/MigrationPage";
import { ResetPasswordPage } from "./components/pages/ResetPasswordPage";
import { ApiTestPage } from "./components/pages/ApiTestPage";
import LayoutPrototypePage from "./components/pages/LayoutPrototypePage";
import { ProjectRecoveryPage } from "./components/pages/ProjectRecoveryPage";
// FilmTimelinePage removed - use ProjectsPage with FilmDropdown instead
import { Toaster } from "./components/ui/sonner";
import { ScriptonyAssistant } from "./components/ScriptonyAssistant";
import { ServerStatusBanner } from "./components/ServerStatusBanner";
import { ConnectionStatusIndicator } from "./components/ConnectionStatusIndicator";
import {
  seedInitialData,
  seedTestUser,
} from "./utils/seedData";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { TranslationProvider } from "./hooks/useTranslation";
import { getAuthClient } from "./lib/auth/getAuthClient";
import { STORAGE_KEYS } from "./lib/config";
import { setupUndoKeyboardShortcuts } from "./lib/undo-manager";
import scriptonyLogo from "figma:asset/762fa3b0c4bc468cb3c0661e6181aee92a01370d.png";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  
  // 🔥 ALL STATE DECLARATIONS FIRST (before ANY useEffects)
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if we're on reset password page
    if (
      window.location.pathname === "/reset-password" ||
      window.location.hash.includes("type=recovery")
    ) {
      return "reset-password";
    }
    // 🔥 HASH-BASED ROUTING: Read initial page from hash (works in iframes)
    const hash = window.location.hash.slice(1); // Remove leading #
    const pathParts = hash.split('/');
    const page = pathParts[0];
    const validPages = ["home", "projekte", "welten", "creative-gym", "upload", "admin", "superadmin", "einstellungen", "settings", "present", "auth", "migration", "reset-password", "api-test", "layout-prototype"];
    return validPages.includes(page) ? page : "home";
  });
  
  const [selectedId, setSelectedId] = useState<string | undefined>(() => {
    // Read from hash on initial load
    const pathParts = window.location.hash.slice(1).split('/');
    return pathParts[1] || undefined;
  });
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(() => {
    // Read from hash on initial load
    const pathParts = window.location.hash.slice(1).split('/');
    return pathParts[2] || undefined;
  });
  
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
  });
  
  // 🔥 NOW ALL useEffects AFTER state declarations
  
  // Setup global undo/redo keyboard shortcuts
  useEffect(() => {
    const cleanup = setupUndoKeyboardShortcuts();
    console.log('⌨️ Undo/Redo shortcuts aktiviert (CMD+Z / CMD+SHIFT+Z)');
    return cleanup;
  }, []);
  
  // 🔥 SYNC URL WITH PAGE STATE (Browser Back/Forward support)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const pathParts = hash.split('/');
      const page = pathParts[0];
      const id = pathParts[1];
      const categoryId = pathParts[2];
      
      console.log('🔗 hashchange detected:', { hash, page, id, categoryId });
      
      const validPages = ["home", "projekte", "welten", "creative-gym", "upload", "admin", "superadmin", "einstellungen", "settings", "present", "auth", "migration", "reset-password", "api-test", "layout-prototype"];
      if (validPages.includes(page) || page === "") {
        setCurrentPage(page || "home");
        setSelectedId(id);
        setSelectedCategoryId(categoryId);
        console.log('✅ State updated from hash:', { page: page || "home", id, categoryId });
      } else {
        console.warn('⚠️ Invalid page in hash:', page);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // 🔥 UPDATE HASH WHEN PAGE CHANGES (iframe-safe)
  useEffect(() => {
    let newHash = currentPage === "home" ? "" : currentPage;
    if (selectedId) {
      newHash += `/${selectedId}`;
      if (selectedCategoryId) {
        newHash += `/${selectedCategoryId}`;
      }
    }
    const currentHash = window.location.hash.slice(1);
    if (currentHash !== newHash) {
      console.log('🔗 Updating hash:', { from: currentHash, to: newHash });
      window.location.hash = newHash;
    }
  }, [currentPage, selectedId, selectedCategoryId]);

  const handleNavigate = (
    page: string,
    id?: string,
    categoryId?: string,
  ) => {
    console.log('🔗 handleNavigate called:', { page, id, categoryId });
    setCurrentPage(page);
    setSelectedId(id);
    setSelectedCategoryId(categoryId);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16">
          <img
            src={scriptonyLogo}
            alt="Scriptony Logo"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
      </div>
    );
  }

  // Show reset password page if on that route (even if not logged in)
  if (currentPage === "reset-password") {
    return <ResetPasswordPage onNavigate={handleNavigate} />;
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "projekte":
        return (
          <ProjectsPage
            selectedProjectId={selectedId}
            onNavigate={handleNavigate}
          />
        );
      case "welten":
        return (
          <WorldbuildingPage
            selectedWorldId={selectedId}
            selectedCategoryId={selectedCategoryId}
            onNavigate={handleNavigate}
          />
        );
      case "creative-gym":
        return <CreativeGymPage />;
      case "upload":
        return <UploadPage onNavigate={handleNavigate} />;
      case "admin":
        return <AdminPage />;
      case "einstellungen":
        return <SettingsPage />;
      case "settings":
        return <SettingsPage />;
      case "superadmin":
        return <SuperadminPage onNavigate={handleNavigate} />;
      case "present":
        return <PresentPage />;
      case "migration":
        return <MigrationPage />;
      case "reset-password":
        return (
          <ResetPasswordPage onNavigate={handleNavigate} />
        );
      case "api-test":
        return <ApiTestPage />;
      case "layout-prototype":
        return <LayoutPrototypePage />;
      // film-timeline route removed - navigate to 'projects' instead
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        userRole={user.role}
      />
      <ServerStatusBanner />
      <main className="pb-safe w-full md:max-w-5xl md:mx-auto">{renderPage()}</main>
      <Toaster position="top-center" />
      <ScriptonyAssistant />
      <ConnectionStatusIndicator />
    </div>
  );
}

export default function App() {
  const [migrationComplete, setMigrationComplete] =
    useState(false);

  // Auto-setup on first app load
  useEffect(() => {
    const runAutoSetup = async () => {
      // Check localStorage first (fast path)
      const hasMigrated = localStorage.getItem(
        STORAGE_KEYS.HAS_MIGRATED,
      );

      if (hasMigrated) {
        console.log(
          "✅ Setup bereits durchgeführt - App wird geladen",
        );
        setMigrationComplete(true);
        return;
      }

      console.log("🚀 Scriptony Auto-Setup startet...");
      console.log("⏰ Start:", new Date().toISOString());

      try {
        console.log(
          "\n📝 Schritt 1/2: Test-User erstellen (falls nicht vorhanden)...",
        );
        
        try {
          await seedTestUser();
          localStorage.setItem(
            STORAGE_KEYS.HAS_SEEDED_USER,
            "true",
          );
          console.log("✅ Test-User bereit");
        } catch (seedError: any) {
          // Ignore if user already exists
          if (seedError?.message?.includes("already")) {
            console.log("✅ Test-User existiert bereits");
          } else {
            console.warn(
              "⚠️ Test-User-Seed fehlgeschlagen (nicht kritisch):",
              seedError?.message || seedError,
            );
          }
        }

        console.log("\n📝 Schritt 2/2: Auto-Login vorbereiten...");
        const { TEST_USER } = await import("./lib/config");
        
        // Let AuthProvider handle the actual login to avoid race conditions
        console.log("✅ Auto-Login-Daten geladen");
        console.log(`ℹ️  Bitte einloggen mit: ${TEST_USER.EMAIL}`);
        
        // Mark setup as complete
        localStorage.setItem(STORAGE_KEYS.HAS_MIGRATED, "true");
        
        console.log(
          "\n🎉 Setup abgeschlossen! App ist bereit.",
        );
        console.log("⏰ Ende:", new Date().toISOString());

        await new Promise((resolve) =>
          setTimeout(resolve, 300),
        );
      } catch (error: any) {
        console.error("\n❌ Auto-Setup Fehler:", error);
        console.error("📋 Error Details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });

        console.log(
          "\n⚠️ Setup hatte Fehler, aber App wird trotzdem geladen",
        );
        localStorage.setItem(STORAGE_KEYS.HAS_MIGRATED, "true");
      } finally {
        setMigrationComplete(true);
      }
    };

    runAutoSetup();
  }, []);

  // Show loading during migration
  if (!migrationComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 relative">
            <img
              src={scriptonyLogo}
              alt="Scriptony Logo"
              className="w-full h-full object-contain animate-pulse"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Scriptony wird vorbereitet...
            </h2>
            <p className="text-muted-foreground">
              Test-User wird erstellt
            </p>
            <p className="text-sm text-muted-foreground">
              Dies dauert nur einmalig ~5 Sekunden
            </p>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          💡 Tipp: Öffne die Browser Console (F12) für Details
        </div>
      </div>
    );
  }

  return (
    <TranslationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TranslationProvider>
  );
}