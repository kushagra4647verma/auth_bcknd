# Server Setup Guide for DigitalOcean Droplet

## Prerequisites
- DigitalOcean Droplet (Ubuntu 22.04 LTS recommended)
- Domain name (optional but recommended)
- GitHub repository secrets configured

## 1. Initial Server Setup

SSH into your droplet:
```bash
ssh root@your-server-ip
```

Update the system:
```bash
apt update && apt upgrade -y
```

## 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (v2)
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

## 3. Create Deploy User (Recommended)

```bash
# Create user
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

## 4. Clone Repository

```bash
# Create app directory
mkdir -p /opt/backend
cd /opt/backend

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Set permissions
chown -R deploy:deploy /opt/backend
```

## 5. Configure Environment Files

Create `.env` files for each service:

```bash
# User service
cp user/.env.example user/.env
nano user/.env

# Restaurant Onboarding
cp restaurant_onboarding/.env.example restaurant_onboarding/.env
nano restaurant_onboarding/.env

# Sipzy Expert
cp sipzy_expert/.env.example sipzy_expert/.env
nano sipzy_expert/.env
```

## 6. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

| Secret Name | Value |
|------------|-------|
| `SERVER_IP` | Your droplet's IP address |
| `SERVER_USER` | `deploy` (or `root`) |
| `SSH_PRIVATE_KEY` | Your private SSH key |

### Generate SSH Key (if needed)
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-deploy"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@your-server-ip

# The private key content goes into SSH_PRIVATE_KEY secret
cat ~/.ssh/id_ed25519
```

## 7. Domain Configuration (Optional but Recommended)

### Option A: Subdomain Routing (Recommended)
Point these DNS records to your droplet IP:
- `api.yourdomain.com` → User App
- `onboarding.yourdomain.com` → Restaurant Onboarding
- `expert.yourdomain.com` → Sipzy Expert
- `admin.yourdomain.com` → Admin Panel

Update `nginx/nginx.conf` with your actual domain names.

### Option B: Path-based Routing
Just use your droplet IP or single domain:
- `http://your-ip/user/...` → User App
- `http://your-ip/onboarding/...` → Restaurant Onboarding
- `http://your-ip/expert/...` → Sipzy Expert
- `http://your-ip/admin/...` → Admin Panel

## 8. SSL/HTTPS Setup (Recommended for Production)

Install Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

Get certificates:
```bash
certbot --nginx -d api.yourdomain.com -d onboarding.yourdomain.com -d expert.yourdomain.com
```

## 9. Manual Deployment (First Time)

```bash
cd /opt/backend
docker compose up -d --build
```

## 10. Verify Deployment

Check running containers:
```bash
docker compose ps
```

Check logs:
```bash
docker compose logs -f nginx
docker compose logs -f user-gateway
docker compose logs -f restaurant-onboarding-gateway
docker compose logs -f sipzy-expert-gateway
```

Test endpoints:
```bash
# Path-based
curl http://localhost/health
curl http://localhost/user/health
curl http://localhost/onboarding/health
curl http://localhost/expert/health

# Subdomain-based (if configured)
curl http://api.yourdomain.com/health
curl http://onboarding.yourdomain.com/health
curl http://expert.yourdomain.com/health
```

## API Endpoints for Frontend

### Path-Based URLs (using IP or single domain)
| Frontend | API Base URL |
|----------|--------------|
| User App | `http://YOUR_IP/user` or `http://yourdomain.com/user` |
| Restaurant Onboarding | `http://YOUR_IP/onboarding` or `http://yourdomain.com/onboarding` |
| Sipzy Expert | `http://YOUR_IP/expert` or `http://yourdomain.com/expert` |
| Admin | `http://YOUR_IP/admin` or `http://yourdomain.com/admin` |

### Subdomain URLs (recommended)
| Frontend | API Base URL |
|----------|--------------|
| User App | `https://api.yourdomain.com` |
| Restaurant Onboarding | `https://onboarding.yourdomain.com` |
| Sipzy Expert | `https://expert.yourdomain.com` |
| Admin | `https://admin.yourdomain.com` |

## Troubleshooting

### View all logs
```bash
docker compose logs -f
```

### Restart specific service
```bash
docker compose restart user-gateway
```

### Rebuild and restart specific service
```bash
docker compose up -d --build user-gateway
```

### Check nginx config
```bash
docker compose exec nginx nginx -t
```

### Full cleanup and rebuild
```bash
docker compose down
docker system prune -af
docker compose up -d --build
```

## Firewall Configuration

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```
