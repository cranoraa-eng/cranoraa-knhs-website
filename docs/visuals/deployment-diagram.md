# Deployment Diagram

## Figure Title

**Figure X. Deployment Diagram of the School Web Application (PRISM)**

## Mermaid Diagram

```mermaid
flowchart TB
    subgraph EXTERNAL["External Services"]
        FCM[Firebase Cloud Messaging<br/>Push Notifications]
        MAILJET[Mailjet<br/>Transactional Email]
        SUPABASE[Supabase Storage<br/>profile-pictures bucket]
    end

    subgraph CICD["CI/CD Pipeline (GitHub Actions)"]
        GH_ACTIONS[GitHub Actions<br/>ubuntu-latest]
        LINT[Lint (flake8)]
        TEST[Test (pytest + Postgres)]
        BUILD_BE[Build Backend<br/>python -m compileall]
        BUILD_FE[Build Frontend<br/>npm run build]
    end

    subgraph VERCEL["Vercel (Frontend Hosting)"]
        FE_BUILD[Vercel Build<br/>npm run build<br/>output: frontend/dist]
        FE_HOST[Vercel Edge Network<br/>Static Files + SPA Rewrites]
        FE_DOMAIN[https://cranoraa-eng-cranoraa-knhs-website.vercel.app]
    end

    subgraph RENDER["Render (Backend Hosting)"]
        REDIS[(Redis<br/>knsh-redis<br/>Channels Layer)]
        PG[(PostgreSQL<br/>Managed DB)]

        subgraph BE_SERVICE["Backend Web Service"]
            DAPHNE[Daphne ASGI Server<br/>school_portal.asgi:application]
            DJANGO[Django Application<br/>REST API + Channels Consumers]
            STATIC[Static Files<br/>collected via collectstatic]
            MEDIA[Media Files<br/>local /media volume]
        end

        BE_DOMAIN[https://cranoraa-knhs-website-1.onrender.com]
    end

    %% CI/CD Flow
    GH_ACTIONS --> LINT
    GH_ACTIONS --> TEST
    GH_ACTIONS --> BUILD_BE
    GH_ACTIONS --> BUILD_FE
    LINT --> BUILD_BE
    TEST --> BUILD_BE
    BUILD_BE -.->|Deploy to Render| BE_SERVICE
    BUILD_FE -.->|Deploy to Vercel| FE_BUILD

    %% Frontend Deployment
    FE_BUILD --> FE_HOST
    FE_HOST --> FE_DOMAIN

    %% Backend Deployment
    REDIS --> DAPHNE
    PG --> DJANGO
    DAPHNE --> DJANGO
    DJANGO --> STATIC
    DJANGO --> MEDIA
    BE_SERVICE --> BE_DOMAIN

    %% Runtime Connections
    FE_DOMAIN -->|HTTPS /api/v1/| BE_DOMAIN
    FE_DOMAIN -->|WSS /ws/| BE_DOMAIN

    %% External Service Connections
    DJANGO -->|FCM API| FCM
    DJANGO -->|Mailjet API| MAILJET
    DJANGO -->|Supabase SDK| SUPABASE
    DJANGO -->|Channels| REDIS

    %% Developer / Admin Access
    DEV[Developer] -->|git push| GH_ACTIONS
    ADMIN[Admin] -->|Browser| FE_DOMAIN
```

## Deployment Configuration Summary

| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Frontend** | Vercel | `vercel.json` (root + frontend/), Vite build, SPA rewrites |
| **Backend** | Render | `render.yaml`, Python 3.11, Daphne ASGI |
| **Database** | Render | Managed PostgreSQL (`DATABASE_URL`) |
| **Cache/Channels** | Render | Managed Redis (`knsh-redis`, `REDIS_URL`) |
| **File Storage** | Supabase | `profile-pictures` bucket (S3-compatible) |
| **Email** | Mailjet | Transactional API |
| **Push Notifications** | Firebase | FCM (fallback for WebSocket) |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy |

## Key Deployment Details

**Frontend (Vercel):**
- Build: `npm run build` → `frontend/dist`
- SPA routing: `/(.*)` → `/index.html`
- Asset caching: `/assets/*` → `max-age=31536000, immutable`
- CORS configured for backend domain

**Backend (Render):**
- Build: `./build.sh` → `pip install`, `collectstatic`, `migrate`, `seed_website_content`
- Start: `daphne -b 0.0.0.0 -p $PORT school_portal.asgi:application`
- ASGI enables both HTTP (REST) and WebSocket (Channels)
- Redis required for Channels layer (WebSocket scaling)
- Health check at `/`

**Environment Variables (Render):**
- `SECRET_KEY`, `DJANGO_SECRET_KEY` (generated)
- `DEBUG=False`
- `REDIS_URL` (from knhs-redis service)
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` (Vercel + localhost)
- `DATABASE_URL` (Render Postgres)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=profile-pictures`
- `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_SENDER_EMAIL`

**CI/CD Pipeline:**
1. **Lint** - flake8 on backend Python code
2. **Test** - pytest with Postgres 15 service container
3. **Build Backend** - python compileall syntax check
4. **Build Frontend** - npm ci, lint, build
5. Deploy on success (manual or auto via Render/Vercel Git integration)

## Caption

This diagram shows the production deployment architecture. The React frontend is built and hosted on Vercel's edge network with SPA rewrites. The Django backend runs on Render as a Daphne ASGI process, enabling both REST API (HTTP) and real-time WebSocket (Django Channels) on the same port. A managed Redis instance provides the Channels layer for WebSocket message routing across processes. PostgreSQL (managed) is the primary database. File uploads go to Supabase Storage. Transactional email uses Mailjet. Firebase Cloud Messaging provides push notification fallback when WebSocket is unavailable. GitHub Actions runs lint, test, and build stages on every push to main.