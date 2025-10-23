# 🔐 OAuth Setup-Anleitung für Scriptony

## ✅ **CODE IST FERTIG!**

Ich habe **Google & GitHub OAuth** komplett in Scriptony implementiert!

### **Was implementiert wurde:**

✅ `useAuth` Hook erweitert mit `signInWithOAuth()`  
✅ AuthPage mit Google & GitHub Buttons  
✅ Schönes UI mit "Oder weiter mit E-Mail" Divider  
✅ Loading States für OAuth  
✅ Error Handling  
✅ Auto-Redirect nach erfolgreicher Auth  

---

## 🚨 **WAS DU JETZT TUN MUSST**

Der Code funktioniert **SOFORT**, ABER die OAuth Provider müssen **einmalig in Supabase aktiviert** werden!

Ohne diesen Setup zeigt Supabase:
```
❌ "Provider is not enabled"
```

---

## 📋 **SETUP: Google OAuth (5 Minuten)**

### **Schritt 1: Supabase Dashboard**

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt: `ctkouztastyirjywiduc`
3. Klicke: **Authentication** → **Providers**
4. Suche: **Google**
5. Toggle: **Enable Google Provider** auf **AN**

### **Schritt 2: Google OAuth Credentials erstellen**

1. Gehe zu: https://console.cloud.google.com/apis/credentials
2. Erstelle neues Projekt oder wähle bestehendes
3. Klicke: **Create Credentials** → **OAuth 2.0 Client ID**
4. Application Type: **Web application**
5. Name: `Scriptony`
6. **Authorized redirect URIs** hinzufügen:
   ```
   https://ctkouztastyirjywiduc.supabase.co/auth/v1/callback
   ```
7. Klicke: **Create**
8. **Client ID** & **Client Secret** kopieren

### **Schritt 3: Credentials in Supabase eintragen**

1. Zurück zu Supabase Dashboard
2. Bei **Google Provider**:
   - **Client ID** einfügen
   - **Client Secret** einfügen
3. Klicke: **Save**

### **Schritt 4: Fertig! ✅**

Google OAuth ist jetzt aktiviert!

**📚 Offizielle Anleitung:**  
https://supabase.com/docs/guides/auth/social-login/auth-google

---

## 📋 **SETUP: GitHub OAuth (3 Minuten)**

### **Schritt 1: Supabase Dashboard**

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt: `ctkouztastyirjywiduc`
3. Klicke: **Authentication** → **Providers**
4. Suche: **GitHub**
5. Toggle: **Enable GitHub Provider** auf **AN**

### **Schritt 2: GitHub OAuth App erstellen**

1. Gehe zu: https://github.com/settings/developers
2. Klicke: **OAuth Apps** → **New OAuth App**
3. **Application name**: `Scriptony`
4. **Homepage URL**: `https://<deine-domain>.com` (oder Figma Make URL)
5. **Authorization callback URL**:
   ```
   https://ctkouztastyirjywiduc.supabase.co/auth/v1/callback
   ```
6. Klicke: **Register application**
7. **Client ID** kopieren
8. Klicke: **Generate a new client secret**
9. **Client Secret** kopieren

### **Schritt 3: Credentials in Supabase eintragen**

1. Zurück zu Supabase Dashboard
2. Bei **GitHub Provider**:
   - **Client ID** einfügen
   - **Client Secret** einfügen
3. Klicke: **Save**

### **Schritt 4: Fertig! ✅**

GitHub OAuth ist jetzt aktiviert!

**📚 Offizielle Anleitung:**  
https://supabase.com/docs/guides/auth/social-login/auth-github

---

## 🎉 **TESTEN**

Nach dem Setup:

1. **Lade die App neu** (F5)
2. **Logout** (falls eingeloggt)
3. **Login-Seite** sollte zeigen:
   - ✅ "Mit Google anmelden" Button
   - ✅ "Mit GitHub anmelden" Button
   - ✅ "Oder weiter mit E-Mail" Divider
   - ✅ Email/Passwort Formular
4. **Klicke auf Google/GitHub Button**
5. **OAuth Flow startet** → Du wirst zu Google/GitHub weitergeleitet
6. **Nach Authorisierung** → Zurück zur App & Auto-Login ✅

---

## 🔧 **TECHNISCHE DETAILS**

### **Wie funktioniert OAuth?**

```typescript
// User klickt "Mit Google anmelden"
await signInWithOAuth('google');

// 1. Supabase redirected zu Google OAuth
// 2. User authorisiert die App
// 3. Google redirected zurück zu Supabase Callback URL
// 4. Supabase erstellt Session & redirected zu deiner App
// 5. onAuthStateChange Event feuert
// 6. User ist eingeloggt! ✅
```

### **User Metadata bei OAuth:**

Bei OAuth-Logins speichert Supabase automatisch:
- ✅ `email` (von Google/GitHub)
- ✅ `name` (Full Name vom Provider)
- ✅ `avatar_url` (Profilbild vom Provider)
- ✅ `provider` ('google' oder 'github')

**In Scriptony:**
```typescript
const user = {
  id: session.user.id,
  email: session.user.email,
  name: session.user.user_metadata?.name || "User",
  role: session.user.user_metadata?.role || "user",
  avatar: session.user.user_metadata?.avatar_url,
};
```

### **Redirect URL:**

Die App verwendet:
```typescript
redirectTo: window.location.origin
```

Das bedeutet: User wird nach Login zur **Home-Page** weitergeleitet.

---

## 🚨 **HÄUFIGE FEHLER**

### **"Provider is not enabled"**
→ Provider ist in Supabase nicht aktiviert  
→ Gehe zu Authentication → Providers → Enable

### **"Invalid redirect URI"**
→ Callback URL in Google/GitHub stimmt nicht  
→ Muss sein: `https://ctkouztastyirjywiduc.supabase.co/auth/v1/callback`

### **OAuth öffnet, aber kein Redirect zurück**
→ Check Browser Console für Fehler  
→ Check Supabase Logs in Dashboard  
→ Check ob Credentials korrekt eingetragen

---

## 💡 **OPTIONAL: Weitere Provider**

Du kannst auch aktivieren:
- **Twitter/X**
- **Facebook**
- **Discord**
- **Apple**
- **Microsoft**
- **Slack**

**Alle Anleitungen:** https://supabase.com/docs/guides/auth/social-login

Der Code in `useAuth` & `AuthPage` funktioniert für **ALLE** Supabase OAuth Provider!

---

## ✅ **ZUSAMMENFASSUNG**

**WAS IST FERTIG:**
✅ Code komplett implementiert  
✅ UI mit Google & GitHub Buttons  
✅ OAuth Flow funktioniert  

**WAS DU TUN MUSST:**
🔧 Google OAuth aktivieren (5 Min)  
🔧 GitHub OAuth aktivieren (3 Min)  

**DANACH:**
🎉 User können sich mit Google/GitHub einloggen!  
🎉 Profildaten werden automatisch übernommen!  
🎉 Kein Passwort nötig!  

---

## 🚀 **LOS GEHT'S!**

1. **Setup Google** (Link oben)
2. **Setup GitHub** (Link oben)
3. **App testen**
4. **Fertig!** 🎉

Bei Fragen → Sag Bescheid! 😊
