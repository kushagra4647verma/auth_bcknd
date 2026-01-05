# Sipzy Backend Monorepo

This repository contains all backend microservices for the Sipzy platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy                       │
│                         (Port 80/443)                            │
└─────────────┬─────────────┬─────────────┬─────────────┬─────────┘
              │             │             │             │
              ▼             ▼             ▼             ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   User App      │ │   Onboarding    │ │  Sipzy Expert   │ │     Admin       │
│   Gateway       │ │    Gateway      │ │    Gateway      │ │    Gateway      │
│  (Port 4000)    │ │  (Port 3000)    │ │  (Port 4000)    │ │  (Port 7000)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ - Restaurant    │ │ - Restaurant    │ │ - Expert        │ │ - Admin         │
│ - Beverage      │ │ - Beverage      │ │ - Restaurant    │ │   Services      │
│ - Event         │ │ - Event         │ │                 │ │                 │
│ - User          │ │                 │ │                 │ │                 │
│ - Social        │ │                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Project Structure

```
backend/
├── docker-compose.yml      # Main orchestrator for all services
├── nginx/
│   └── nginx.conf          # Reverse proxy configuration
├── user/                   # User-facing app backend
├── restaurant_onboarding/  # Restaurant owner onboarding backend
├── sipzy_expert/           # Expert panel backend
├── admin/                  # Admin panel backend
└── .github/
    └── workflows/
        └── deploy.yml      # Auto-deployment workflow
```

## Access URLs

### Option 1: Subdomain-based (Recommended)
| Service | URL |
|---------|-----|
| User App API | `https://api.yourdomain.com` |
| Restaurant Onboarding | `https://onboarding.yourdomain.com` |
| Sipzy Expert | `https://expert.yourdomain.com` |
| Admin Panel | `https://admin.yourdomain.com` |

### Option 2: Path-based
| Service | URL |
|---------|-----|
| User App API | `http://your-ip/user` |
| Restaurant Onboarding | `http://your-ip/onboarding` |
| Sipzy Expert | `http://your-ip/expert` |
| Admin Panel | `http://your-ip/admin` |

## Quick Start (Development)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

### GitHub Secrets Required
- `SERVER_IP` - DigitalOcean droplet IP
- `SERVER_USER` - SSH username (usually `deploy` or `root`)
- `SSH_PRIVATE_KEY` - Private SSH key for authentication

## Auto-Deployment

The project automatically deploys to the DigitalOcean droplet when code is pushed to the `main` branch.

The workflow:
1. SSHs into the server
2. Pulls latest code
3. Rebuilds all Docker containers
4. Restarts services with zero downtime goal
