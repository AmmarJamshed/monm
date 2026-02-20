# MonM Deployment Checklist

## Before You Deploy

- [ ] Create GitHub repo at https://github.com/new (e.g. `monm`)
- [ ] Render account: https://dashboard.render.com (Starter plan)
- [ ] Netlify account: https://app.netlify.com (free)

---

## Deploy Steps

### 1. Push to GitHub

```powershell
cd D:\monm
git add .
git commit -m "MonM MVP - Ready for deploy"
git remote add origin https://github.com/YOUR_USERNAME/monm.git
git push -u origin main
```

### 2. Render (Backend)

1. **New** → **Blueprint** → Connect GitHub repo
2. Select repo, Render reads `render.yaml`
3. Set env vars for **monm-api** (add these in Dashboard after first deploy):
   - `PWA_URL` = (leave empty first, add Netlify URL after step 3)
   - `CORS_ORIGINS` = (same)
4. Deploy → Copy your API URL: `https://monm-api-XXXX.onrender.com`

### 3. Netlify (Frontend)

1. **Add new site** → **Import from Git**
2. Choose repo, base dir: `frontend`
3. **Environment variables:**
   - `NEXT_PUBLIC_API_URL` = `https://monm-api-XXXX.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api-XXXX.onrender.com`
4. Deploy → Copy site URL: `https://xxxx.netlify.app`

### 4. Update Render CORS

1. Render → monm-api → Environment
2. `PWA_URL` = `https://xxxx.netlify.app`
3. `CORS_ORIGINS` = `https://xxxx.netlify.app`
4. Save (triggers redeploy)

---

## Share Your PWA

**Link to share:** `https://your-site.netlify.app`

**Install instructions for users:**
- **Desktop Chrome/Edge:** Click install icon in address bar
- **Android:** Chrome → Menu → Install app
- **iOS:** Safari → Share → Add to Home Screen

---

## Optional: Add API Keys (in Render Dashboard)

For full features, add to monm-api environment:
- `POLYGON_RPC_KEY` — Polygon RPC (for blockchain audit)
- `BLOCKCHAIN_SIGNER_PRIVATE_KEY` — Wallet for audit logging
- `GROQ_API_KEY` — AI moderation
- `SERP_API_KEY` — Leak detection
- `WEB3_STORAGE_TOKEN` — IPFS media uploads
