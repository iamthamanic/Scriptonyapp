# 🎬 Scriptony

**Professional Scriptwriting Platform** mit vollständigem Design-System, Timeline-Editor, Worldbuilding, AI Assistant und Creative Gym.

---

## 🚀 Quick Start

### Für neue Entwickler:
1. **Projekt-Überblick**: Siehe `/docs/README.md`
2. **Architektur**: Siehe `/docs/architecture/`
3. **Migration Guides**: Siehe `/docs/`

### Für Deployment:
- **Edge Functions**: `/supabase/functions/`
- **Migrations**: `/supabase/migrations/`
- **Deploy-Instruktionen**: Siehe `/docs/`

---

## 📂 Projekt-Struktur

```
scriptony/
├── components/          # React UI Components
│   ├── pages/          # Page Components
│   ├── ui/             # shadcn/ui Components
│   └── hooks/          # Custom React Hooks
├── lib/                # Shared Libraries
│   ├── api/            # API Client Code
│   ├── auth/           # Auth Client & Adapters
│   ├── audio/          # Audio Processing
│   └── types/          # TypeScript Types
├── supabase/
│   ├── functions/      # Edge Functions (Microservices)
│   └── migrations/     # Database Migrations
├── docs/               # Documentation
│   └── architecture/   # Architecture Docs
├── styles/             # Global Styles
└── workers/            # Web Workers
```

---

## 🏗️ Architektur

### Microservices (Edge Functions)
- **scriptony-auth** - Authentication & Organizations
- **scriptony-projects** - Project Management
- **scriptony-timeline-v2** - Timeline Nodes & Structure
- **scriptony-audio** - Audio Upload & Processing
- **scriptony-worldbuilding** - Worlds & Characters
- **scriptony-assistant** - AI Chat & RAG
- **scriptony-gym** - Creative Exercises
- **scriptony-superadmin** - Admin Functions

Siehe `/docs/architecture/MULTI_FUNCTION_ARCHITECTURE.md` für Details.

---

## 🎨 Design System

**Primärfarbe**: Violett (#6E59A5)  
**Framework**: Tailwind CSS v4.0  
**Component Library**: shadcn/ui  
**Icons**: Lucide React

Siehe `/guidelines/StyleGuide.md` für Details.

---

## 🔐 Auth System

Vollständig entkoppelte Auth mit Interface Pattern:
- **Interface**: `AuthClient` (siehe `/lib/auth/AuthClient.ts`)
- **Adapter**: `SupabaseAuthAdapter` (siehe `/lib/auth/SupabaseAuthAdapter.ts`)
- **ESLint**: Blockt direkte `supabase.auth.*` Aufrufe

Siehe `/lib/auth/README.md` für Details.

---

## 📚 Wichtige Dokumentation

### Architektur
- [Multi-Function Architecture](/docs/architecture/MULTI_FUNCTION_ARCHITECTURE.md)
- [Audio Microservice](/docs/architecture/AUDIO_MICROSERVICE_ARCHITECTURE.md)
- [Audio System Overview](/docs/architecture/AUDIO_SYSTEM_OVERVIEW.md)

### Entwicklung
- [Guidelines](/guidelines/Guidelines.md)
- [Style Guide](/guidelines/StyleGuide.md)

### Migrations
- [Timeline V2 Migration](/docs/TIMELINE_V2_MIGRATION_COMPLETE.md)
- [Migration Complete Success](/docs/MIGRATION_COMPLETE_SUCCESS.md)

---

## 🛠️ Development

### Local Development
```bash
# Projekt läuft in Figma Make Desktop App
# Kein lokales Filesystem
```

### Deployment
```bash
# Edge Functions: Manuell über Supabase Dashboard deployen
# Code aus /supabase/functions/* kopieren
```

### Testing
```bash
# Health Checks für alle Functions:
curl https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-auth/health
curl https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-timeline-v2/health
# etc.
```

---

## ✅ Aktueller Status

### Completed Features
- ✅ Auth System mit Organization Support
- ✅ Project Management
- ✅ Timeline V2 mit Drag & Drop
- ✅ Audio Upload & Processing (100MB WAV Support)
- ✅ Waveform Visualization & Editing
- ✅ Character Management
- ✅ AI Chat mit RAG & MCP Tools
- ✅ Dark Mode Support
- ✅ Performance Optimizations (80% faster chat loading)
- ✅ Auth Entkopplung (100% completed)

### In Development
- Shot Image Upload
- Character Autocomplete
- Advanced Timeline Features

---

## 🎯 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS v4.0
- **UI Components**: shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **AI**: OpenAI, Anthropic, OpenRouter, DeepSeek
- **Audio**: Web Audio API, Web Workers

---

## 📝 License

Proprietary - Scriptony Platform

---

**Built with ❤️ using Figma Make**
