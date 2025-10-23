# Scriptony Feature Update - Auth, i18n & Storage

## Implementierte Features

### 1. **Supabase Authentication System** 🔐

#### User Management
- **Login/Signup**: Vollständiges Auth-System mit Supabase Auth
- **Session Management**: Automatische Session-Verwaltung
- **User Roles**: Support für `user`, `admin` und `superadmin` Rollen
- **Protected Routes**: Nur eingeloggte User können die App nutzen

#### Dateien
- `/hooks/useAuth.tsx` - Auth Hook mit Context Provider
- `/components/pages/AuthPage.tsx` - Login/Signup UI
- `/supabase/functions/server/index.tsx` - Signup Endpoint hinzugefügt

#### Nutzung
```tsx
import { useAuth } from "./hooks/useAuth";

function Component() {
  const { user, signIn, signOut, signUp } = useAuth();
  
  // user = { id, email, name, role, avatar }
}
```

---

### 2. **i18n (Internationalisierung)** 🌍

#### Unterstützte Sprachen
- **Deutsch** (Standard)
- **English**

#### Implementierung
- Translation Hook mit Context Provider
- Persistierung in localStorage
- Über 100 vordefinierte Übersetzungen
- Einfach erweiterbar

#### Dateien
- `/hooks/useTranslation.tsx` - i18n Hook mit Übersetzungen

#### Nutzung
```tsx
import { useTranslation } from "./hooks/useTranslation";

function Component() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <h1>{t("projects.title")}</h1> // "Projekte" oder "Projects"
  );
}
```

#### Verfügbare Übersetzungen
- Navigation: `nav.home`, `nav.projects`, `nav.worldbuilding`, etc.
- Common: `common.save`, `common.cancel`, `common.delete`, etc.
- Auth: `auth.login`, `auth.signup`, `auth.logout`, etc.
- Projects: `projects.title`, `projects.new`, `projects.empty`, etc.
- Worldbuilding: `worldbuilding.title`, `worldbuilding.new`, etc.
- Creative Gym: `gym.title`, `gym.challenges`, etc.
- Settings: `settings.title`, `settings.language`, etc.

---

### 3. **Supabase Storage für Bilder** 📸

#### Features
- **Private Bucket**: `make-3b52693b-images`
- **Signed URLs**: Automatische Generierung (1 Jahr Gültigkeit)
- **User-basierte Organisation**: Ordnerstruktur pro User
- **Storage Limit**: 1 GB (Supabase Free Tier)
- **Upload-Limits**: Automatische Überprüfung

#### Dateien
- `/utils/storage.tsx` - Storage Helper Funktionen
- `/supabase/functions/server/index.tsx` - Upload & Usage Endpoints

#### Nutzung
```tsx
import { uploadImage, getStorageUsage } from "./utils/storage";

// Upload Bild
const result = await uploadImage(file, userId, "avatars");
// result = { url: "...", path: "..." }

// Storage Usage
const usage = await getStorageUsage(userId);
// usage = { totalBytes, totalMB, fileCount }
```

#### Ordnerstruktur
```
make-3b52693b-images/
├── {userId}/
│   ├── avatars/
│   ├── characters/
│   ├── worlds/
│   ├── scenes/
│   └── general/
```

#### Server Endpoints
- `POST /storage/upload` - Bild hochladen
- `GET /storage/usage/:userId` - Speichernutzung abrufen

---

### 4. **Erweiterte Settings Page** ⚙️

#### Neue Features
- **Profil-Verwaltung**: Name ändern, Avatar (vorbereitet)
- **Sprachauswahl**: Deutsch ↔ English
- **Theme-Switcher**: Light/Dark Mode
- **Storage-Anzeige**: Visueller Progress Bar
- **Logout-Button**: Abmelden

#### Tabs
1. **Profil**: Name, Email, Avatar, Storage-Nutzung
2. **Präferenzen**: Sprache, Theme
3. **Abo**: Subscription Info
4. **Sicherheit**: 2FA, API Keys, etc.

---

### 5. **App-Struktur Updates** 🏗️

#### Provider-Hierarchie
```tsx
<TranslationProvider>
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</TranslationProvider>
```

#### Auth Guard
- Automatische Weiterleitung zur AuthPage wenn nicht eingeloggt
- Loading State während Auth-Check
- User-Daten in der gesamten App verfügbar

---

## Storage-Limits (Supabase Free Tier)

### Übersicht
- **Total Storage**: 1 GB
- **Bandwidth**: 2 GB/Monat
- **File Upload Size**: 50 MB pro Datei

### Empfehlungen
- Bilder komprimieren vor Upload
- Thumbnails für große Bilder erstellen
- Alte/ungenutzte Bilder regelmäßig löschen
- Bei >500 MB: Upgrade auf Pro Plan erwägen

### Kostenlose Erweiterung
Für mehr Speicher:
1. Supabase Pro Plan ($25/Monat): 100 GB Storage
2. Alternative: Cloudinary für Bilder nutzen
3. Kompression: WebP Format nutzen (50% kleiner als JPG)

---

## Migration Guide

### Bestehende Komponenten aktualisieren

#### 1. Translation Hook verwenden
```tsx
// Vorher
<h1>Projekte</h1>

// Nachher
import { useTranslation } from "../hooks/useTranslation";

const { t } = useTranslation();
<h1>{t("projects.title")}</h1>
```

#### 2. User-Daten nutzen
```tsx
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();
console.log(user.id, user.name, user.role);
```

#### 3. Bild-Upload integrieren
```tsx
import { uploadImage } from "../utils/storage";
import { useAuth } from "../hooks/useAuth";

const { user } = useAuth();

const handleUpload = async (file: File) => {
  const result = await uploadImage(file, user.id, "characters");
  console.log("Uploaded:", result.url);
};
```

---

## Nächste Schritte

### Empfohlene Erweiterungen
1. **Avatar Upload**: ImageCropDialog für Avatar-Uploads nutzen
2. **Email Verification**: Email-Server konfigurieren
3. **Password Reset**: Forgot Password Flow
4. **Social Login**: Google/GitHub OAuth
5. **2FA**: Two-Factor Authentication
6. **Storage Cleanup**: Automatisches Löschen alter Dateien

### Weitere Übersetzungen
Neue Keys in `/hooks/useTranslation.tsx` hinzufügen:
```tsx
translations: {
  de: {
    "custom.key": "Deutscher Text",
  },
  en: {
    "custom.key": "English text",
  }
}
```

---

## Testing

### Auth testen
1. App öffnen → AuthPage erscheint
2. "Registrieren" klicken
3. Email, Password, Name eingeben
4. Account wird erstellt & automatisch eingeloggt

### i18n testen
1. Settings → Präferenzen → Sprache
2. English auswählen
3. Navigation und Texte wechseln zu Englisch

### Storage testen
1. Settings → Profil → Storage-Anzeige
2. Bild hochladen (z.B. Avatar)
3. Progress Bar aktualisiert sich

---

## Bekannte Limitierungen

1. **Email Confirmation**: Derzeit deaktiviert (email_confirm: true)
   - Lösung: Email-Server in Supabase konfigurieren

2. **Avatar Upload**: UI vorhanden, aber noch nicht verbunden
   - Lösung: ImageCropDialog + uploadImage integrieren

3. **Storage Quota**: Keine automatische Benachrichtigung bei 90%
   - Lösung: Warning in Settings anzeigen

4. **Offline Support**: Keine Offline-Funktionalität
   - Lösung: Service Worker + IndexedDB implementieren

---

## Support & Dokumentation

### Supabase Docs
- Auth: https://supabase.com/docs/guides/auth
- Storage: https://supabase.com/docs/guides/storage
- Edge Functions: https://supabase.com/docs/guides/functions

### Environment Variables
Bereits konfiguriert:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
