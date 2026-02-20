# MonM — Secure Messaging PWA

**"People say WhatsApp me → People say MonM me"**

Privacy-first, traceable messaging. Install anywhere as a PWA. Zero blockchain exposure for users.

---

## Deploy in 3 Steps

### 1. Push to GitHub

```powershell
cd D:\monm
git remote add origin https://github.com/YOUR_USERNAME/monm.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend (Render)

1. https://dashboard.render.com → **New** → **Blueprint**
2. Connect your GitHub repo → **Apply**
3. After deploy, add env vars in **monm-api**:
   - `PWA_URL` = (your Netlify URL – add after step 3)
   - `CORS_ORIGINS` = (same)
4. Copy API URL: `https://monm-api-xxxx.onrender.com`

### 3. Deploy Frontend (Netlify)

1. https://app.netlify.com → **Add new site** → **Import from Git**
2. Select repo, base directory: `frontend`
3. **Environment variables:**
   - `NEXT_PUBLIC_API_URL` = `https://monm-api-xxxx.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api-xxxx.onrender.com`
4. Deploy → Copy URL: `https://xxxx.netlify.app`
5. Update Render: set `PWA_URL` and `CORS_ORIGINS` to your Netlify URL, redeploy

---

## Share Your PWA

**Link:** `https://your-site.netlify.app`

Users can **Install** from:
- Desktop Chrome/Edge: address bar install icon
- Android: Chrome menu → Install app  
- iOS: Safari → Share → Add to Home Screen

---

## Cost

| Service | Plan    | Cost   |
|---------|---------|--------|
| Netlify | Free    | $0     |
| Render  | Starter + 1GB disk | ~$7/mo |

---

## Docs

- [Full Deployment Guide](docs/DEPLOY.md)
- [Quick Checklist](DEPLOYMENT_CHECKLIST.md)
- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
