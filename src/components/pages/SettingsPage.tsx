import { useState, useEffect } from "react";
import { User, CreditCard, Shield, Cloud, Key, Bot, Globe, LogOut, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { getStorageUsage, formatBytes, STORAGE_LIMIT_BYTES } from "../../utils/storage";
import { toast } from "sonner@2.0.3";
import { Progress } from "../ui/progress";

export function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [storageUsage, setStorageUsage] = useState<{
    totalSize: number;
    fileCount: number;
    files: Array<{ name: string; size: number; createdAt: string }>;
  } | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });
  const isDemoMode = localStorage.getItem("scriptony_demo_mode") === "true";

  // Load storage usage
  useEffect(() => {
    if (user && !isDemoMode) {
      loadStorageUsage();
    } else if (isDemoMode) {
      // Set mock storage data for demo mode
      setStorageUsage({
        totalSize: 0,
        fileCount: 0,
        files: [],
      });
    }
  }, [user, isDemoMode]);

  const loadStorageUsage = async () => {
    if (!user || isDemoMode) return;
    try {
      const usage = await getStorageUsage(user.id);
      setStorageUsage(usage);
    } catch (error) {
      console.error("Error loading storage usage:", error);
      // Set fallback data on error
      setStorageUsage({
        totalSize: 0,
        fileCount: 0,
        files: [],
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (isDemoMode) {
        toast.success(t("common.success"), {
          description: "Demo Mode: Änderungen werden nicht gespeichert",
        });
        return;
      }
      
      await updateProfile({ name });
      toast.success(t("common.success"), {
        description: "Profil erfolgreich aktualisiert",
      });
    } catch (error) {
      toast.error(t("common.error"), {
        description: "Fehler beim Aktualisieren des Profils",
      });
    }
  };

  const handleLogout = async () => {
    try {
      // If in demo mode, just clear and reload
      if (isDemoMode) {
        localStorage.removeItem("scriptony_demo_mode");
        window.location.reload();
        return;
      }
      
      await signOut();
      toast.success(t("auth.logoutSuccess"));
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const storagePercentage = storageUsage 
    ? Math.min((storageUsage.totalSize / STORAGE_LIMIT_BYTES) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-6 bg-gradient-to-b from-primary/5 to-transparent">

      </div>

      <Tabs defaultValue="profile" className="w-full px-4">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="text-xs">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs">Präferenzen</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs">Abo</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Sicherheit</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          {isDemoMode && (
            <Card className="border-accent bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎭</div>
                  <div>
                    <p className="text-sm font-medium">Demo Mode aktiv</p>
                    <p className="text-xs text-muted-foreground">
                      Du nutzt die App ohne Authentifizierung. Daten werden nicht gespeichert.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
              <CardDescription className="text-xs">Deine persönlichen Informationen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <User className="size-8" />
                </div>
                <Button variant="secondary" size="sm" className="h-9">Avatar ändern</Button>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">{t("auth.name")}</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11" 
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">{t("auth.email")}</Label>
                <Input id="email" value={user?.email} disabled className="bg-muted h-11" />
                <p className="text-xs text-muted-foreground">Kann nicht geändert werden</p>
              </div>

              <Button onClick={handleSaveProfile} className="w-full h-11">{t("common.save")}</Button>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="size-4" />
                {t("settings.storage")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {storageUsage ? (
                <>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{formatBytes(storageUsage.totalSize)} verwendet</span>
                      <span className="text-muted-foreground">von 1 GB</span>
                    </div>
                    <Progress value={storagePercentage} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {storageUsage.fileCount} Dateien hochgeladen
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Lade Speichernutzung...</div>
              )}
            </CardContent>
          </Card>

          {/* Logout */}
          <Button 
            onClick={handleLogout}
            variant="destructive" 
            className="w-full h-11"
          >
            <LogOut className="size-4 mr-2" />
            {isDemoMode ? "Demo Mode beenden" : t("auth.logout")}
          </Button>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-4" />
                {t("settings.language")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Select value={language} onValueChange={(val: "de" | "en") => setLanguage(val)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                {t("settings.theme")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => handleThemeChange("light")}
                  className="h-11"
                >
                  <Sun className="size-4 mr-2" />
                  {t("settings.themeLight")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => handleThemeChange("dark")}
                  className="h-11"
                >
                  <Moon className="size-4 mr-2" />
                  {t("settings.themeDark")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Aktuelles Abo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base">Free Plan</h3>
                  <p className="text-xs text-muted-foreground">Kostenlos für immer</p>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>3 Projekte</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>1 Welt</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Basic Creative Gym</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <span>Upgrade auf Pro</span>
                <Badge className="text-xs">Empfohlen</Badge>
              </CardTitle>
              <CardDescription className="text-xs">Unbegrenzte Projekte & Features</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div>
                  <p className="mb-3">€9,99 / Monat</p>
                  <ul className="space-y-2 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Unbegrenzte Projekte</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Unbegrenzte Welten</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Premium Creative Gym</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>KI-Integration</span>
                    </li>
                  </ul>
                </div>
                <Button className="w-full h-11">Upgrade</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Passwort ändern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              <div className="space-y-2">
                <Label className="text-sm">Altes Passwort</Label>
                <Input type="password" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Neues Passwort</Label>
                <Input type="password" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Neues Passwort wiederholen</Label>
                <Input type="password" className="h-11" />
              </div>
              <Button className="w-full h-11">Passwort ändern</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Zwei-Faktor (2FA)</CardTitle>
              <CardDescription className="text-xs">Zusätzlicher Kontoschutz</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">2FA {twoFactorEnabled ? "Aktiviert" : "Deaktiviert"}</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled ? "Konto geschützt" : "Für mehr Sicherheit"}
                  </p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Login Sessions</CardTitle>
              <CardDescription className="text-xs">Aktive Sitzungen</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Chrome on MacOS</p>
                  <p className="text-xs text-muted-foreground">Heute, 14:32</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">Aktuell</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Safari on iPhone</p>
                  <p className="text-xs text-muted-foreground">Gestern, 09:15</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">Logout</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}