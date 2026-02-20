# MonM Deployment Guide

Deploy MonM to **Netlify** (frontend PWA) + **Render** (backend API).

---

## Prerequisites

1. **GitHub** account
2. **Netlify** account (free) — https://netlify.com
3. **Render** account — Starter plan ($7/mo, includes 1GB persistent disk)

---

## Step 1: Push to GitHub

```powershell
cd D:\monm
git init
git add .
git commit -m "MonM initial"
# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/monm.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

1. Go to **https://dashboard.render.com**
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect `render.yaml` — click **Apply**
5. For **monm-api**, add environment variables in Dashboard:
   - `PWA_URL` = `https://YOUR-NETLIFY-SITE.netlify.app` (update after Netlify deploy)
   - `CORS_ORIGINS` = `https://YOUR-NETLIFY-SITE.netlify.app`
   - Optionally: `POLYGON_RPC_KEY`, `GROQ_API_KEY`, `SERP_API_KEY`, `BLOCKCHAIN_SIGNER_PRIVATE_KEY`
6. Wait for deploy. Your API URL: `https://monm-api.onrender.com` (or your custom domain)

---

## Step 3: Deploy Frontend on Netlify

1. Go to **https://app.netlify.com**
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub, select your `monm` repo
4. Build settings (auto-detected from `netlify.toml`):
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
5. Add **Environment variables:**
   - `NEXT_PUBLIC_API_URL` = `https://monm-api.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api.onrender.com`
6. Click **Deploy site**
7. Your PWA URL: `https://random-name-123.netlify.app`

---

## Step 4: Connect Backend ↔ Frontend

1. In **Render** → monm-api → Environment:
   - Set `PWA_URL` = your Netlify URL
   - Set `CORS_ORIGINS` = your Netlify URL
2. Click **Save** → Redeploy if needed

---

## Step 5: Custom Domain (Optional)

**Netlify:**
- Site settings → Domain management → Add custom domain
- e.g. `monm.app` or `monm.yourdomain.com`

**Render:**
- monm-api → Settings → Custom Domains
- e.g. `api.monm.app`
- Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` in Netlify to use the new API domain

---

## Install as PWA

1. Open your Netlify URL on mobile or desktop
2. Chrome/Edge: Install icon in address bar, or Menu → Install MonM
3. iOS Safari: Share → Add to Home Screen
4. Android Chrome: Install prompt or Menu → Install app

---

## Cost Summary

| Service | Plan | Cost |
|---------|------|------|
| Netlify | Free | $0 |
| Render | Starter + 1GB disk | ~$7/mo |
| **Total** | | **~$7/month** |

---

## Troubleshooting

- **CORS errors:** Ensure `CORS_ORIGINS` in Render matches your Netlify URL exactly (no trailing slash).
- **WebSocket disconnect:** Render Starter supports WebSockets. Use `wss://` (not `ws://`) for production.
- **Cold starts:** Render free/starter services spin down after 15 min inactivity. First request may take 30–60s.
