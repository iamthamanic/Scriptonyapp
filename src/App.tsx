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
// FilmTimelinePage removed - use ProjectsPage with FilmDropdown instead
import { Toaster } from "./components/ui/sonner";
import { ScriptonyAssistant } from "./components/ScriptonyAssistant";
import { ServerStatusBanner } from "./components/ServerStatusBanner";
import {
  seedInitialData,
  seedTestUser,
} from "./utils/seedData";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { TranslationProvider } from "./hooks/useTranslation";
import { getAuthClient } from "./lib/auth/getAuthClient";
import { STORAGE_KEYS } from "./lib/config";
import scriptonyLogo from "figma:asset/762fa3b0c4bc468cb3c0661e6181aee92a01370d.png";

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => {
    // Check if we're on reset password page
    if (
      window.location.pathname === "/reset-password" ||
      window.location.hash.includes("type=recovery")
    ) {
      return "reset-password";
    }
    return "home";
  });
  const [selectedId, setSelectedId] = useState<
    string | undefined
  >();
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const handleNavigate = (
    page: string,
    id?: string,
    categoryId?: string,
  ) => {
    setCurrentPage(page);
    setSelectedId(id);
    setSelectedCategoryId(categoryId);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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
      case "projects":
        return (
          <ProjectsPage
            selectedProjectId={selectedId}
            onNavigate={handleNavigate}
          />
        );
      case "worldbuilding":
        return (
          <WorldbuildingPage
            selectedWorldId={selectedId}
            selectedCategoryId={selectedCategoryId}
            onNavigate={handleNavigate}
          />
        );
      case "gym":
        return <CreativeGymPage />;
      case "upload":
        return <UploadPage onNavigate={handleNavigate} />;
      case "admin":
        return <AdminPage />;
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
    </div>
  );
}

export default function App() {
  const [migrationComplete, setMigrationComplete] =
    useState(false);

  // Auto-migrate on first app load
  useEffect(() => {
    const runAutoMigration = async () => {
      // Check localStorage first (fast path)
      const hasMigrated = localStorage.getItem(
        STORAGE_KEYS.HAS_MIGRATED,
      );

      if (hasMigrated) {
        console.log(
          "✅ Migration bereits durchgeführt - App wird geladen",
        );
        setMigrationComplete(true);
        return;
      }

      console.log("🚀 Scriptony Auto-Migration startet...");
      console.log("⏰ Start:", new Date().toISOString());

      try {
        // SCHRITT 1: Prüfe SOFORT ob Migration bereits durchgeführt wurde (VOR Login!)
        console.log(
          "\n📝 Schritt 1/4: Prüfe ob Migration bereits durchgeführt wurde...",
        );

        const { supabaseConfig } = await import("./lib/env");
        const { API_CONFIG } = await import("./lib/config");

        const statusUrl = `${supabaseConfig.url}/functions/v1${API_CONFIG.SERVER_BASE_PATH}/migration-status`;

        try {
          const statusResponse = await fetch(statusUrl, {
            method: "GET",
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            if (statusData.migrationDone) {
              console.log(
                "✅ Migration bereits in Datenbank vorhanden!",
              );
              console.log(
                "⏩ Überspringe Migration und fahre mit Login fort...",
              );
              localStorage.setItem(
                STORAGE_KEYS.HAS_MIGRATED,
                "true",
              );

              // Login still needed for app to work
              console.log("\n📝 Schritt 2/4: Auto-Login...");
              const { TEST_USER } = await import(
                "./lib/config"
              );
              await getAuthClient().signInWithPassword(
                TEST_USER.EMAIL,
                TEST_USER.PASSWORD,
              );

              console.log("✅ Eingeloggt als Test-User");
              console.log("\n🎉 App ist bereit!");
              setMigrationComplete(true);
              return;
            }

            console.log(
              "📝 Migration noch nicht durchgeführt - starte Migrations-Prozess...",
            );
          }
        } catch (statusError) {
          console.warn(
            "⚠️ Migration-Status-Check fehlgeschlagen:",
            statusError,
          );
          console.log(
            "📝 Fahre mit normaler Migration fort...",
          );
        }

        console.log("\n📝 Schritt 2/4: Test-User erstellen...");
        try {
          await seedTestUser();
          localStorage.setItem(
            STORAGE_KEYS.HAS_SEEDED_USER,
            "true",
          );
          console.log("✅ Test-User bereit");
        } catch (seedError) {
          console.warn(
            "⚠️ Test-User-Seed fehlgeschlagen (optional, nicht kritisch):",
            seedError,
          );
          console.log("⏩ Fahre trotzdem mit Login fort...");
        }

        console.log("\n📝 Schritt 3/4: Auto-Login...");
        const { TEST_USER } = await import("./lib/config");
        const session =
          await getAuthClient().signInWithPassword(
            TEST_USER.EMAIL,
            TEST_USER.PASSWORD,
          );

        console.log("✅ Eingeloggt als Test-User (Superadmin)");

        const token = session.accessToken;
        if (!token) {
          throw new Error("Kein Auth-Token erhalten");
        }

        console.log(
          "\n📝 Schritt 4/4: Setup abgeschlossen (Migrations werden via Supabase verwaltet)...",
        );
        
        // Mark migration as complete (we use Supabase migrations now, not runtime migration)
        localStorage.setItem(STORAGE_KEYS.HAS_MIGRATED, "true");
        
        console.log(
          "\n🎉 Setup abgeschlossen! App ist bereit.",
        );
        console.log("⏰ Ende:", new Date().toISOString());

        await new Promise((resolve) =>
          setTimeout(resolve, 500),
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

    runAutoMigration();
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
              Migration zu PostgreSQL läuft
            </p>
            <p className="text-sm text-muted-foreground">
              Dies dauert nur einmalig ~30 Sekunden
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