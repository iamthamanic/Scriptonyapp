# Scriptony - Comprehensive Screenwriting Platform

## Overview
Scriptony is a full-featured screenwriting and creative development platform built with React, TypeScript, and Tailwind CSS. It provides tools for script management, worldbuilding, creative training, and analytics.

## Features

### 1. **Home/Dashboard**
- Welcome screen with user greeting
- Recently edited projects display
- Recently edited worlds display
- Inspirational quote section

### 2. **Script Projects (Skript-Projekte)**
- **Overview Page**: Grid of all user projects with project chips for quick navigation
- **Detail Page**: Full project view with:
  - Project metadata (title, logline, type, genre, duration)
  - Scenes management (create, view, edit)
  - Characters management (create, view, edit)
  - Special support for series with episodes
- **New Project Dialog**: Create new projects with type selection (Movie, Series, Audio)

### 3. **Worldbuilding**
- **Overview Page**: Grid of all created worlds with cover images
- **World Detail Page**:
  - Cover image display
  - Tabs: Overview and Categories
  - Category management with custom icons
  - Categories: Geography, Politics, Society, Culture, Economy, etc.
- **New World Dialog**: Create worlds with name, description, and cover image
- **New Category Dialog**: Add structured categories to worlds

### 4. **Creative Gym**
- **Level System**: XP tracking, level progression, and streak counting
- **Four Main Tabs**:
  - **Challenges**: Prompt Forge, Style Lock, Constraint Bench
  - **Art Forms**: Comedy, Songwriting, Visual Arts, Photography, Filmmaking
  - **Training Plans**: 30-day programs with progress tracking
  - **Achievements**: Unlockable badges and rewards

### 5. **Upload & Script Analysis**
- Drag & drop file upload (PDF, DOCX, TXT)
- Upload states: idle, uploading, analyzing, complete
- Automatic script analysis results:
  - Scene extraction
  - Character identification
  - Duration estimation
- One-click project creation from analysis

### 6. **Admin Area**
- **Dashboard**: Overview with Usage Analytics and Tests & Debugging cards
- **Usage Analytics**:
  - Filter bar (date range, feature, action)
  - KPI cards (Total Events, 24h, 7 days, Unique Users)
  - Activity chart
  - Recent activity table
- **Tests & Debugging**:
  - Test suite management
  - Status tracking (Passed, Failed, Running)
  - Debug logs with color-coding

### 7. **Settings**
Six comprehensive tabs:
- **Profile**: Name, email, avatar management
- **Subscription**: Current plan display, upgrade options
- **Security**: Password change, 2FA, login sessions
- **Storage**: Cloud storage integration (Google Drive, Dropbox, OneDrive)
- **Unlock**: Special feature unlock codes
- **KI-Integration**: API key management for AI services (OpenAI, Anthropic, Claude)

### 8. **Superadmin** (Role-based access)
- Platform-wide dashboard with KPIs
- User management table
- Organization management
- Platform-wide analytics with charts
- TestBot integration

## Design System

### Colors
**Light Theme:**
- Background: #F5F6F8
- Card: #FFFFFF
- Border: #E5E7EB
- Text Primary: #0A0A0A
- Text Muted: #71717A
- Primary Purple: #6E59A5
- Primary Purple Light: #E5DEFF
- Accent Blue: #33C3F0
- Accent Pink: #D946EF
- Destructive Red: #EF4444

**Dark Theme:**
- Background: #1C1823
- Card: #222033
- Border: #2E2A3A
- Text Primary: #EDE9FE
- Text Muted: #9CA3AF
- Primary Purple: #8E75D1

### Typography
- Font Family: System default (Inter-compatible)
- H1: 24px (defined in globals.css)
- H2: 20px (defined in globals.css)
- H3: 18px (defined in globals.css)
- Body: 16px
- Small: 14px

### Layout
- Max Width: 1200px
- Spacing System: 8px baseline
- Card Radius: 12px (0.75rem)
- Button/Input Radius: 10px

### Components
All components are built using shadcn/ui base components:
- Cards, Buttons, Inputs, Dialogs
- Tables, Tabs, Badges
- Progress bars, Switches, Selects
- And many more

## Responsive Design

### Mobile (< 768px)
- Bottom navigation instead of top navigation
- Single column layouts
- Fullscreen modals
- Horizontal scrollable tables

### Tablet (768px - 1024px)
- Top navigation
- 2-column grids
- Optimized spacing

### Desktop (> 1024px)
- Full top navigation
- 3+ column grids
- Maximum 1200px container width

## State Management
- Simple React useState for page navigation
- LocalStorage for theme persistence
- Props drilling for cross-component communication
- Mock data for demonstration purposes

## User Roles
Three role levels with progressive access:
1. **user**: Basic access (Home, Projects, Worldbuilding, Gym, Upload)
2. **admin**: + Admin area (Analytics, Tests)
3. **superadmin**: + Superadmin area (Platform-wide management)

## Theme Support
- Light and Dark themes
- Theme toggle in navigation
- Persists to localStorage
- Respects system preferences on first load
- Smooth transitions between themes

## Future Enhancements
- Backend integration with Supabase
- Real-time collaboration
- AI-powered script analysis
- Export to PDF/Final Draft format
- Cloud sync for projects and worlds
- Mobile apps (React Native)
- Multiplayer creative challenges

## Technology Stack
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **Sonner** for toast notifications

## Project Structure
```
/
├── App.tsx                 # Main app component with routing
├── components/
│   ├── Navigation.tsx      # Top/bottom navigation
│   ├── EmptyState.tsx      # Reusable empty state component
│   ├── LoadingSpinner.tsx  # Loading indicator
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── WorldbuildingPage.tsx
│   │   ├── CreativeGymPage.tsx
│   │   ├── UploadPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── SuperadminPage.tsx
│   └── ui/                 # shadcn/ui components
└── styles/
    └── globals.css         # Global styles and design tokens
```

## Getting Started
The application is ready to run. Simply modify the `userRole` variable in App.tsx to test different access levels:
- Change to "user" for basic user view
- Change to "admin" for admin view
- Change to "superadmin" for full platform management view

## Notes
- All data is currently mock data for demonstration
- API integrations are placeholder implementations
- File uploads are simulated
- Charts show placeholder content (ready for recharts integration)
- Ready for backend integration with minimal refactoring