# 🚀 MULTI-FUNCTION QUICK REFERENCE

## 📋 ALLE 6 EDGE FUNCTIONS

| Function | Purpose | Health Check |
|----------|---------|--------------|
| **scriptony-auth** | Auth, Organizations, Storage, Profile | `/health` |
| **scriptony-projects** | Projects CRUD | `/health` |
| **scriptony-timeline-v2** | Timeline Nodes + Templates | `/health` |
| **scriptony-worldbuilding** | Worlds + Characters | `/health` |
| **scriptony-assistant** | AI Chat + RAG + MCP | `/health` |
| **scriptony-gym** | Creative Exercises | `/health` |

---

## 🔐 scriptony-auth

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth`

### Routes:
```
POST   /signup                              → Custom signup + Organization
POST   /create-demo-user                    → Demo user creation

GET    /profile                             → Get user profile
PUT    /profile                             → Update profile

GET    /organizations                       → Get user's organizations
GET    /organizations/:id                   → Get organization details
POST   /organizations                       → Create organization
PUT    /organizations/:id                   → Update organization
DELETE /organizations/:id                   → Delete organization

GET    /organizations/:id/members           → Get members
POST   /organizations/:id/members           → Invite member
DELETE /organizations/:id/members/:user_id → Remove member

GET    /storage/usage                       → Get storage usage
```

---

## 📁 scriptony-projects

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-projects`

### Routes:
```
GET    /projects          → List all projects
POST   /projects          → Create project
GET    /projects/:id      → Get project details
PUT    /projects/:id      → Update project
DELETE /projects/:id      → Delete project
GET    /projects/:id/stats → Project statistics
```

---

## 🎬 scriptony-timeline-v2

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-timeline-v2`

### Routes:
```
GET    /nodes                     → Get all nodes
POST   /nodes                     → Create node
GET    /nodes/:id                 → Get node details
PUT    /nodes/:id                 → Update node
DELETE /nodes/:id                 → Delete node
POST   /nodes/:id/children        → Add child node

POST   /projects/:projectId/init  → Initialize project with template
GET    /templates                 → List templates
GET    /templates/:id             → Get template details
```

---

## 🌍 scriptony-worldbuilding

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-worldbuilding`

### Routes:
```
GET    /worlds          → List worlds
POST   /worlds          → Create world
GET    /worlds/:id      → Get world details
PUT    /worlds/:id      → Update world
DELETE /worlds/:id      → Delete world

GET    /characters      → List characters
POST   /characters      → Create character
GET    /characters/:id  → Get character details
PUT    /characters/:id  → Update character
DELETE /characters/:id  → Delete character
```

---

## 🤖 scriptony-assistant

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-assistant`

### Routes:
```
GET    /ai/settings              → Get AI settings
PUT    /ai/settings              → Update AI settings
POST   /ai/settings/validate-key → Validate API key

GET    /conversations               → List conversations
POST   /conversations               → Create conversation
GET    /conversations/:id           → Get conversation
DELETE /conversations/:id           → Delete conversation
POST   /conversations/:id/messages  → Send message (streaming)

GET    /rag/documents  → List RAG documents
POST   /rag/sync       → Trigger RAG sync
GET    /rag/queue      → Get sync queue status
```

---

## 💪 scriptony-gym

**Base URL:** `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-gym`

### Routes:
```
GET    /exercises      → List exercises
POST   /exercises      → Create exercise
GET    /exercises/:id  → Get exercise details
PUT    /exercises/:id  → Update exercise
DELETE /exercises/:id  → Delete exercise

GET    /categories     → List categories
GET    /stats          → Get user stats
```

---

## 🎯 API GATEWAY ROUTING

Frontend nutzt API Gateway automatisch:

```typescript
import { apiGet, apiPost } from '@/lib/api-gateway';

// Automatisch zu scriptony-projects geroutet
const projects = await apiGet('/projects', token);

// Automatisch zu scriptony-timeline-v2 geroutet
const nodes = await apiGet('/nodes', token);

// Automatisch zu scriptony-auth geroutet
const profile = await apiGet('/profile', token);
```

---

## 🔍 ROUTE MAPPING

| Route Prefix | Function | Example |
|--------------|----------|---------|
| `/signup` | scriptony-auth | `POST /signup` |
| `/profile` | scriptony-auth | `GET /profile` |
| `/organizations` | scriptony-auth | `GET /organizations` |
| `/storage` | scriptony-auth | `GET /storage/usage` |
| `/projects` | scriptony-projects | `GET /projects` |
| `/nodes` | scriptony-timeline-v2 | `GET /nodes` |
| `/worlds` | scriptony-worldbuilding | `GET /worlds` |
| `/characters` | scriptony-worldbuilding | `GET /characters` |
| `/ai` | scriptony-assistant | `GET /ai/settings` |
| `/conversations` | scriptony-assistant | `GET /conversations` |
| `/exercises` | scriptony-gym | `GET /exercises` |

---

## 🧪 HEALTH CHECKS

```bash
# Auth
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-auth/health

# Projects
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-projects/health

# Timeline V2
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-timeline-v2/health

# Worldbuilding
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-worldbuilding/health

# Assistant
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-assistant/health

# Gym
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-gym/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "scriptony-xxx",
  "database": "connected",
  "timestamp": "2025-01-..."
}
```

---

## 📊 COVERAGE MATRIX

| Feature | Old (Monolith) | New (Functions) | Status |
|---------|---------------|-----------------|--------|
| **Auth** | ❌ | scriptony-auth | ✅ |
| **Organizations** | ⚠️ Helpers only | scriptony-auth | ✅ |
| **Profile** | ❌ | scriptony-auth | ✅ |
| **Storage** | ✅ | scriptony-auth | ✅ |
| **Projects** | ✅ | scriptony-projects | ✅ |
| **Timeline** | ✅ | scriptony-timeline-v2 | ✅ |
| **Worlds** | ✅ | scriptony-worldbuilding | ✅ |
| **Characters** | ⚠️ Not mounted | scriptony-worldbuilding | ✅ |
| **AI Chat** | ✅ | scriptony-assistant | ✅ |
| **Gym** | ❌ | scriptony-gym | ✅ |

---

## 🚀 DEPLOYMENT ORDER

```
1. scriptony-auth          ← ZUERST! (Organization Management)
2. scriptony-projects      ← Braucht Auth
3. scriptony-timeline-v2   ← Braucht Projects
4. scriptony-worldbuilding
5. scriptony-assistant
6. scriptony-gym
```

---

## 📝 TESTING CHECKLIST

```
□ Health Checks (alle 6)
□ Signup Flow
□ Project Creation
□ Timeline Init
□ World Creation
□ Character Creation
□ AI Chat Message
□ Gym Exercise
□ Storage Usage
```

---

## 🔧 TROUBLESHOOTING

### Function gibt 404
→ Check ob deployed: Dashboard → Functions → Status "Active"

### Function gibt 500
→ Check Logs: Dashboard → Functions → scriptony-xxx → Logs

### "Unauthorized"
→ Check Authorization Header im Request

### "Organization not found"
→ User hat keine Organization → Signup erneut durchführen

---

## 📚 DOCUMENTATION

- Full Deployment Guide: `/DASHBOARD_DEPLOY_6_FUNCTIONS.md`
- Architecture: `/MULTI_FUNCTION_ARCHITECTURE.md`
- Migration Coverage: `/MIGRATION_COVERAGE_ANALYSIS.md`
- Auth Architecture: `/AUTH_ACCOUNT_ARCHITECTURE.md`

---

**Ready to deploy!** 🚀
