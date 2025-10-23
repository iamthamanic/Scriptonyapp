# 🚀 Scriptony Quick Start

## Fehler behoben ✅

### Problem
- ❌ `npm:@radix-ui/react-progress` funktionierte nicht im Frontend
- ❌ `npm:@supabase/supabase-js@2` Import-Fehler

### Lösung
- ✅ Progress-Komponente auf CSS-basiert umgestellt (kein Radix UI)
- ✅ Supabase Import korrigiert: `@supabase/supabase-js` (ohne `npm:` prefix)
- ✅ **Demo Mode** hinzugefügt für Testing ohne Auth

---

## 🎭 Demo Mode nutzen

### Option 1: Über die UI
1. App öffnen → AuthPage erscheint
2. Unten auf **"🎭 Demo Mode (ohne Login testen)"** klicken
3. App lädt neu mit Demo-User

### Option 2: Manuell
```javascript
localStorage.setItem("scriptony_demo_mode", "true");
window.location.reload();
```

### Demo User
- **Name**: Demo User
- **Email**: demo@scriptony.app
- **Role**: admin
- **ID**: demo-user-123

### Demo Mode beenden
1. Settings → Profil
2. "Demo Mode beenden" Button klicken
   
**ODER**

```javascript
localStorage.removeItem("scriptony_demo_mode");
window.location.reload();
```

---

## 🔐 Echtes Auth System nutzen

### Voraussetzungen
- Supabase Project muss konfiguriert sein
- Environment Variables müssen gesetzt sein:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### User registrieren
1. Demo Mode deaktivieren (falls aktiv)
2. AuthPage → "Registrieren" klicken
3. Email, Password, Name eingeben
4. Account wird erstellt und automatisch eingeloggt

### User Login
1. AuthPage → Email & Password eingeben
2. "Anmelden" klicken
3. Session wird in Supabase gespeichert

### Hinweis zu Email-Bestätigung
- Derzeit ist `email_confirm: true` gesetzt
- Email-Server muss in Supabase konfiguriert werden für echte Email-Verifikation
- Siehe: https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr

---

## 🌍 Sprache wechseln

### In der UI
1. Settings → Präferenzen
2. Sprache auswählen: 🇩🇪 Deutsch oder 🇬🇧 English

### Programmatisch
```tsx
import { useTranslation } from "./hooks/useTranslation";

const { language, setLanguage, t } = useTranslation();

// Sprache wechseln
setLanguage("en"); // oder "de"

// Text übersetzen
<h1>{t("projects.title")}</h1> // "Projects" oder "Projekte"
```

---

## 📸 Bilder hochladen

### Beispiel-Code
```tsx
import { uploadImage } from "./utils/storage";
import { useAuth } from "./hooks/useAuth";

const { user } = useAuth();

const handleImageUpload = async (file: File) => {
  try {
    const result = await uploadImage(file, user.id, "avatars");
    console.log("Bild hochgeladen:", result.url);
    // result = { url: "...", path: "..." }
  } catch (error) {
    console.error("Upload fehlgeschlagen:", error);
  }
};
```

### Verfügbare Ordner
- `avatars` - User-Avatare
- `characters` - Charakter-Bilder
- `worlds` - Welt-Bilder
- `scenes` - Szenen-Bilder
- `general` - Sonstige Uploads

### Storage Limits
- **Free Tier**: 1 GB total
- **Pro Tier**: 100 GB ($25/Monat)
- **Max File Size**: 50 MB

---

## 🎨 Theme wechseln

### In der UI
1. Settings → Präferenzen
2. Light oder Dark Mode wählen

### Programmatisch
```tsx
const [theme, setTheme] = useState<"light" | "dark">("light");

const toggleTheme = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  localStorage.setItem("theme", newTheme);
  
  if (newTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};
```

---

## 🔧 Troubleshooting

### App lädt nicht / Build Errors

**Symptom**: Build failed with errors  
**Lösung**: 
1. Prüfe Browser Console auf Fehler
2. Stelle sicher, dass alle Dependencies korrekt importiert sind
3. Nutze Demo Mode zum Testen

### Auth funktioniert nicht

**Symptom**: Login/Signup schlägt fehl  
**Lösung**:
1. Nutze Demo Mode zum Testen der App-Features
2. Prüfe Supabase Environment Variables
3. Prüfe Server-Logs in der Console

### Storage Upload schlägt fehl

**Symptom**: Bild wird nicht hochgeladen  
**Lösung**:
1. Prüfe, ob User eingeloggt ist (`user.id` muss existieren)
2. Prüfe File-Size (max 50 MB)
3. Prüfe Storage-Limit (1 GB Free Tier)
4. Prüfe Browser Console für Error-Messages

### Übersetzungen fehlen

**Symptom**: Statt Text wird "key.name" angezeigt  
**Lösung**:
1. Füge fehlende Keys in `/hooks/useTranslation.tsx` hinzu
2. Beide Sprachen (de + en) müssen den gleichen Key haben

---

## 📦 Nächste Schritte

### Empfohlen
1. ✅ **Demo Mode testen** - Alle Features ohne Auth testen
2. ✅ **i18n integrieren** - Komponenten mit `t()` übersetzen
3. ✅ **Storage nutzen** - Bild-Uploads in Komponenten integrieren
4. ⏳ **CreativeGym Backend** - Nächste Seite mit Backend verbinden
5. ⏳ **Admin Backend** - Admin-Bereiche mit Backend verbinden

### Optional
- Social Login (Google, GitHub) einrichten
- Email-Verifikation konfigurieren
- 2FA hinzufügen
- Storage Cleanup automatisieren
- Avatar-Upload mit Image Crop Dialog

---

## 🆘 Support

### Dokumentation
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [i18n Guide](./FEATURE_UPDATE.md)

### Files zum Anpassen
- `/hooks/useAuth.tsx` - Auth-Logik
- `/hooks/useTranslation.tsx` - Übersetzungen
- `/utils/storage.tsx` - Storage-Helper
- `/components/pages/AuthPage.tsx` - Login/Signup UI
- `/components/pages/SettingsPage.tsx` - Settings UI

---

## ✨ Features im Überblick

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| 🔐 Auth System | ✅ | Login, Signup, Session Management |
| 🎭 Demo Mode | ✅ | Testen ohne Authentifizierung |
| 🌍 i18n (DE/EN) | ✅ | Vollständige Mehrsprachigkeit |
| 📸 Image Upload | ✅ | Supabase Storage Integration |
| 🎨 Light/Dark Theme | ✅ | Theme-Switcher |
| 📊 Storage Usage | ✅ | Anzeige der Speichernutzung |
| 👤 User Roles | ✅ | user, admin, superadmin |
| 🔄 Auto Session | ✅ | Automatisches Login bei Reload |

---

**Viel Erfolg mit Scriptony! 🎬**
