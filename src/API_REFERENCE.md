# 📚 Scriptony PostgreSQL API Reference

## Base URL
```
https://[your-project-id].supabase.co/functions/v1/make-server-3b52693b
```

## Authentication
Alle Routen (außer Health Check) erfordern einen Authorization Header:
```javascript
headers: {
  'Authorization': `Bearer ${supabaseAccessToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🏥 Health & System

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-02T10:30:00Z"
}
```

### Run Migration (Einmalig)
```http
POST /migrate
Authorization: Bearer {token}
```
**Response:**
```json
{
  "success": true,
  "stats": {
    "organizations": 1,
    "worlds": 2,
    "projects": 3,
    "scenes": 15,
    "characters": 8
  }
}
```

---

## 👤 Auth

### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

### Seed Test User
```http
POST /auth/seed-test-user
```
Creates: `iamthamanic@gmail.com` / `123456`

---

## 🏢 Organizations

### Get User's Organizations
```http
GET /organizations
Authorization: Bearer {token}
```
**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "slug": "my-workspace",
      "owner_id": "uuid",
      "userRole": "owner",
      "created_at": "2025-10-02T10:00:00Z"
    }
  ]
}
```

---

## 🎬 Projects

### Get All Projects
```http
GET /projects
Authorization: Bearer {token}
```
**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "My Film",
      "type": "film",
      "logline": "A story about...",
      "genre": "Drama",
      "duration": "90min",
      "coverImage": "https://...",
      "linkedWorldId": "uuid",
      "linkedWorld": { "id": "uuid", "name": "Fantasy World" },
      "createdAt": "2025-10-02T10:00:00Z",
      "lastEdited": "2025-10-02T12:00:00Z"
    }
  ]
}
```

### Get Single Project
```http
GET /projects/:id
Authorization: Bearer {token}
```

### Create Project
```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "New Film",
  "type": "film",
  "logline": "A story about...",
  "genre": "Action",
  "duration": "120min",
  "coverImage": "https://...",
  "linkedWorldId": "uuid"
}
```

### Update Project
```http
PUT /projects/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "logline": "New logline..."
}
```

### Delete Project (Soft Delete)
```http
DELETE /projects/:id
Authorization: Bearer {token}
```

---

## 🎭 Characters

### Get All Characters
```http
GET /projects/:projectId/characters
Authorization: Bearer {token}
```
**Response:**
```json
{
  "characters": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "name": "John Doe",
      "role": "Protagonist",
      "description": "The hero of the story",
      "avatar": "https://...",
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### Get Single Character
```http
GET /projects/:projectId/characters/:id
Authorization: Bearer {token}
```

### Create Character
```http
POST /projects/:projectId/characters
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "role": "Antagonist",
  "description": "The villain",
  "avatar": "https://..."
}
```

### Update Character
```http
PUT /projects/:projectId/characters/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "New description"
}
```

### Delete Character
```http
DELETE /projects/:projectId/characters/:id
Authorization: Bearer {token}
```

---

## 🎬 Scenes

### Get All Scenes
```http
GET /projects/:projectId/scenes
Authorization: Bearer {token}
```
**Response:**
```json
{
  "scenes": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "episodeId": "uuid",
      "sceneNumber": "1",
      "title": "Opening Scene",
      "location": "Beach",
      "timeOfDay": "Dawn",
      "description": "The sun rises...",
      "dialog": "Character: Hello world",
      "visualComposition": "Wide shot",
      "lighting": "Natural, golden hour",
      "colorGrading": "Warm tones",
      "soundDesign": "Ocean waves",
      "specialEffects": "None",
      "keyframeImage": "https://...",
      "timecodeStart": "00:00:00",
      "timecodeEnd": "00:02:30",
      "transitions": "Fade in",
      "productionNotes": "Shoot at sunrise",
      "emotionalSignificance": "Hope",
      "emotionalNotes": "Peaceful beginning",
      "characters": ["char-uuid-1", "char-uuid-2"],
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### Create Scene
```http
POST /projects/:projectId/scenes
Authorization: Bearer {token}
Content-Type: application/json

{
  "sceneNumber": "2",
  "title": "Confrontation",
  "location": "Office",
  "timeOfDay": "Afternoon",
  "description": "Tense meeting",
  "characters": ["uuid1", "uuid2"]
}
```

### Update Scene
```http
PUT /projects/:projectId/scenes/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "New description"
}
```

### Delete Scene
```http
DELETE /projects/:projectId/scenes/:id
Authorization: Bearer {token}
```

---

## 📺 Episodes

### Get All Episodes
```http
GET /projects/:projectId/episodes
Authorization: Bearer {token}
```
**Response:**
```json
{
  "episodes": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "title": "Pilot",
      "number": 1,
      "description": "First episode",
      "coverImage": "https://...",
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### Create Episode
```http
POST /projects/:projectId/episodes
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Episode 2",
  "number": 2,
  "description": "The plot thickens",
  "coverImage": "https://..."
}
```

### Update Episode
```http
PUT /projects/:projectId/episodes/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title"
}
```

### Delete Episode
```http
DELETE /projects/:projectId/episodes/:id
Authorization: Bearer {token}
```

---

## 🌍 Worlds

### Get All Worlds
```http
GET /worlds
Authorization: Bearer {token}
```
**Response:**
```json
{
  "worlds": [
    {
      "id": "uuid",
      "name": "Fantasy Realm",
      "description": "A magical world",
      "type": "Fantasy",
      "coverImage": "https://...",
      "createdAt": "2025-10-02T10:00:00Z",
      "lastEdited": "2025-10-02T12:00:00Z",
      "lastAccessed": "2025-10-02T14:00:00Z"
    }
  ]
}
```

### Get Single World
```http
GET /worlds/:id
Authorization: Bearer {token}
```

### Create World
```http
POST /worlds
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Sci-Fi Universe",
  "description": "A futuristic world",
  "type": "Sci-Fi",
  "coverImage": "https://..."
}
```

### Update World
```http
PUT /worlds/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "New description"
}
```

### Delete World (Soft Delete)
```http
DELETE /worlds/:id
Authorization: Bearer {token}
```

---

## 📂 World Categories

### Get All Categories
```http
GET /worlds/:worldId/categories
Authorization: Bearer {token}
```
**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "worldId": "uuid",
      "name": "Geography",
      "type": "geography",
      "icon": "Map",
      "color": "#10B981",
      "orderIndex": 0,
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### Create Category
```http
POST /worlds/:worldId/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Politics",
  "type": "politics",
  "icon": "Crown",
  "color": "#6E59A5",
  "orderIndex": 1
}
```

### Update Category
```http
PUT /worlds/:worldId/categories/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "orderIndex": 2
}
```

### Delete Category
```http
DELETE /worlds/:worldId/categories/:id
Authorization: Bearer {token}
```

---

## 🏛️ World Items

### Get All Items for World
```http
GET /worlds/:worldId/items
Authorization: Bearer {token}
```
**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "worldId": "uuid",
      "categoryId": "uuid",
      "name": "Mount Doom",
      "description": "A volcano",
      "category": "geography",
      "categoryType": "geography",
      "image": "https://...",
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

### Get Items for Category
```http
GET /worlds/:worldId/categories/:categoryId/items
Authorization: Bearer {token}
```

### Create Item
```http
POST /worlds/:worldId/categories/:categoryId/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "The Shire",
  "description": "A peaceful land",
  "category": "geography",
  "categoryType": "geography",
  "image": "https://..."
}
```

### Update Item
```http
PUT /worlds/:worldId/categories/:categoryId/items/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "New description"
}
```

### Delete Item
```http
DELETE /worlds/:worldId/categories/:categoryId/items/:id
Authorization: Bearer {token}
```

---

## 📤 Storage

### Upload File
```http
POST /storage/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: <File>
- folder: "projects" | "worlds" | "characters" | "uploads"
```
**Response:**
```json
{
  "success": true,
  "url": "https://...signed-url...",
  "path": "uploads/user-id/uuid.jpg"
}
```

### Get Storage Usage
```http
GET /storage/usage
Authorization: Bearer {token}
```
**Response:**
```json
{
  "totalSize": 5242880,
  "fileCount": 12,
  "files": [
    {
      "name": "image.jpg",
      "size": 1048576,
      "createdAt": "2025-10-02T10:00:00Z"
    }
  ]
}
```

---

## 🔑 Frontend Integration

### Example: Fetch Projects
```typescript
import { projectId, publicAnonKey } from './utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;

// Get Supabase access token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Fetch projects
const response = await fetch(`${API_URL}/projects`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { projects } = await response.json();
```

### Example: Create Project
```typescript
const newProject = {
  title: "My New Film",
  type: "film",
  logline: "An epic story",
  genre: "Adventure"
};

const response = await fetch(`${API_URL}/projects`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newProject)
});

const { project } = await response.json();
```

---

## 🛡️ Row Level Security

Alle Routen sind durch RLS geschützt:
- User sehen nur Daten ihrer Organization(s)
- Automatischer Filter auf DB-Ebene
- Keine zusätzliche Logik im Frontend nötig

**Rollen:**
- `owner` - Volle Kontrolle über Organization
- `admin` - Kann Mitglieder verwalten
- `editor` - Kann Projekte/Welten erstellen und bearbeiten
- `viewer` - Nur Leserechte

---

## 📊 Error Handling

Alle Routen geben konsistente Error-Responses:

```json
{
  "error": "User-friendly message",
  "details": "Technical error details"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error
