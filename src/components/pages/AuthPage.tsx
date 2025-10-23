import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { toast } from "sonner@2.0.3";
import { Loader2, Github, Mail, AlertCircle } from "lucide-react";
import scriptonyLogo from 'figma:asset/762fa3b0c4bc468cb3c0661e6181aee92a01370d.png';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t("common.error"), {
        description: "Email und Passwort sind erforderlich",
      });
      return;
    }

    if (!isLogin && !name) {
      toast.error(t("common.error"), {
        description: "Name ist erforderlich",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success(t("auth.loginSuccess"));
      } else {
        await signUp(email, password, name);
        toast.success(t("auth.signupSuccess"));
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(t("auth.error"), {
        description: error.message || "Ein Fehler ist aufgetreten",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    
    try {
      await signInWithOAuth(provider);
      // Note: User will be redirected to OAuth provider
      // After successful auth, they'll be redirected back
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);
      toast.error(t("auth.error"), {
        description: error.message || `${provider} Login fehlgeschlagen`,
      });
      setOauthLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error("Fehler", {
        description: "Bitte E-Mail-Adresse eingeben",
      });
      return;
    }

    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      toast.success("E-Mail versendet!", {
        description: "Prüfe deinen Posteingang für den Reset-Link",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error("Fehler", {
        description: error.message || "Reset-E-Mail konnte nicht gesendet werden",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-primary/5 to-transparent">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img 
              src={scriptonyLogo}
              alt="Scriptony Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? t("auth.welcome") : t("auth.signup")}
          </CardTitle>
          <CardDescription>
            {isLogin ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading || oauthLoading !== null}
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Mit Google anmelden
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading || oauthLoading !== null}
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5" />
              )}
              Mit GitHub anmelden
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Oder weiter mit E-Mail
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  required={!isLogin}
                  disabled={loading}
                  className="h-11"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@beispiel.de"
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline"
                    disabled={loading || oauthLoading !== null}
                  >
                    Passwort vergessen?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || oauthLoading !== null}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                isLogin ? t("auth.login") : t("auth.signup")
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
                disabled={loading || oauthLoading !== null}
              >
                {isLogin ? t("auth.noAccount") : t("auth.hasAccount")}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen</DialogTitle>
            <DialogDescription>
              Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
            </DialogDescription>
          </DialogHeader>

          {!resetSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  ⚠️ <strong>Wichtig:</strong> Ein E-Mail-Server muss in Supabase konfiguriert sein, 
                  damit die Reset-E-Mail verschickt wird. Ohne Konfiguration funktioniert dieser Flow nicht.
                  <br /><br />
                  <strong>Alternative:</strong> Admins können Passwörter im Superadmin-Panel zurücksetzen.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="resetEmail">E-Mail-Adresse</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="max@beispiel.de"
                  required
                  disabled={resetLoading}
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={resetLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Link senden
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>E-Mail versendet!</strong>
                  <br />
                  Prüfe deinen Posteingang und klicke auf den Link zum Zurücksetzen deines Passworts.
                  <br /><br />
                  <small className="text-xs">
                    Keine E-Mail erhalten? Prüfe deinen Spam-Ordner oder stelle sicher, 
                    dass der E-Mail-Server in Supabase konfiguriert ist.
                  </small>
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setResetEmail("");
                }}
              >
                Verstanden
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
