# Deployment Guide

**Architecture:**
- **Frontend** → Vercel (free, gives you `your-app.vercel.app` — no domain required)
- **Backend + Database** → AWS Lightsail (Ubuntu + Docker Compose)
- **Nginx** → Reverse proxy on Lightsail (port 80 → FastAPI)

---

## 1. Push to GitHub

```bash
# From the repo root (church_reg/v1 or wherever .git lives)
git add .
git commit -m "feat: production-ready build"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Make sure `.gitignore` covers secrets:

```gitignore
server/.env
.env.prod
*.env
```

---

## 2. Create an AWS Lightsail Instance

1. Go to [aws.amazon.com/lightsail](https://aws.amazon.com/lightsail)
2. **Create instance** → Linux/Unix → **Ubuntu 24.04 LTS**
3. Choose plan: **$10/mo (2 GB RAM, 1 vCPU)** minimum — needed for Docker builds
4. Give it a name, e.g. `manifest-backend`
5. Click **Create instance**

### Open firewall ports

In the Lightsail console → your instance → **Networking** tab:

| Application | Protocol | Port |
|-------------|----------|------|
| HTTP        | TCP      | 80   |
| HTTPS       | TCP      | 443  |
| SSH         | TCP      | 22   |

---

## 3. Set up the Server

SSH into your instance (download the key from Lightsail console):

```bash
ssh -i ~/Downloads/LightsailKey.pem ubuntu@YOUR_INSTANCE_IP
```

### Install Docker

```bash
# Update and install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow running docker without sudo
sudo usermod -aG docker ubuntu
newgrp docker
```

### Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Create the production environment file

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Fill in every value. Generate a strong JWT secret:

```bash
openssl rand -hex 32
```

Example `.env.prod`:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SuperSecurePassword123!
POSTGRES_DB=manifest_prod
POSTGRES_HOST=db
POSTGRES_PORT=5432

JWT_SECRET=<output of openssl rand -hex 32>

SEED_ADMIN_NAME=Your Name
SEED_ADMIN_EMAIL=you@gmail.com
SEED_ADMIN_PASSWORD=AnotherSecurePassword!

# Add your Vercel URL here after deploying the frontend
CORS_ORIGINS=https://your-app.vercel.app
```

### Start the backend

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Check it's running:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

You should see:
```
[startup] Seeded super admin: you@gmail.com
INFO: Application startup complete.
```

Test the API:

```bash
curl http://YOUR_INSTANCE_IP/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@gmail.com","password":"AnotherSecurePassword!"}'
# Should return {"access_token": "...", ...}
```

---

## 4. Deploy the Frontend to Vercel

Vercel gives every project a free `.vercel.app` subdomain — **no custom domain required**.

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Framework preset will auto-detect **Vite**
5. Under **Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `VITE_API_BASE_URL` | `http://YOUR_LIGHTSAIL_IP` |

6. Click **Deploy**

Vercel gives you a URL like `https://manifest-ke-xyz.vercel.app`.

---

## 5. Update CORS with the Vercel URL

Back on the Lightsail server, update `.env.prod`:

```bash
nano .env.prod
# Change CORS_ORIGINS to:
# CORS_ORIGINS=https://manifest-ke-xyz.vercel.app
```

Restart the backend to pick up the change:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 6. Update Vercel with Production API URL (if you attach a domain later)

In Vercel → your project → **Settings** → **Environment Variables**:
- Update `VITE_API_BASE_URL` to `http://YOUR_IP` or `https://api.yourdomain.com`
- Redeploy (Vercel auto-redeploys on env var changes)

---

## 7. Assign a Static IP (Recommended)

Lightsail instance IPs change on restart unless you attach a static IP:

1. Lightsail console → **Networking** → **Create static IP**
2. Attach it to your instance
3. Update `VITE_API_BASE_URL` in Vercel to the static IP

---

## 8. Optional: Add a Custom Domain + SSL

### Backend domain (e.g. `api.yourdomain.com`)

Point an A record at your Lightsail static IP, then install Certbot for HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx

# Update nginx/default.conf to have your domain in server_name first
sudo certbot --nginx -d api.yourdomain.com
```

Then update nginx config to also listen on 443 (certbot handles this automatically).

### Frontend domain

In Vercel → your project → **Settings** → **Domains** → add your domain.
Vercel handles SSL automatically.

---

## Useful Commands

```bash
# View live logs
docker compose -f docker-compose.prod.yml logs -f

# Restart after a code change
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and wipe the database (destructive!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Production Checklist

- [ ] Strong `POSTGRES_PASSWORD` set
- [ ] `JWT_SECRET` generated with `openssl rand -hex 32`
- [ ] `SEED_ADMIN_PASSWORD` is secure and noted somewhere safe
- [ ] Lightsail firewall open on port 80
- [ ] `CORS_ORIGINS` matches your Vercel URL exactly
- [ ] `VITE_API_BASE_URL` set in Vercel env vars
- [ ] Static IP attached to Lightsail instance
- [ ] `.env.prod` is **not** committed to git
