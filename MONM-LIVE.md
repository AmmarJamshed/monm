# MonM — Live Deployment

## Your MonM PWA is live

**URL:** https://monm-secure-messaging.netlify.app

Share this link so anyone can use and install MonM.

---

## Deploy backend (Render)

**One command** (requires [GitHub token](https://github.com/settings/tokens) with `repo` scope):

```powershell
cd D:\monm
$env:GITHUB_TOKEN="ghp_YOUR_TOKEN"; .\DEPLOY-BACKEND.ps1
```

This creates the GitHub repo (if needed), pushes your code, and opens Render. Render auto-deploys when connected to the repo.

### Manual steps if no token

1. Create repo at https://github.com/new named **monm**
2. Push:
   ```powershell
   cd D:\monm
   git remote add origin https://github.com/YOUR_USERNAME/monm.git
   git push -u origin master
   ```

3. Deploy on Render:
   - Go to https://dashboard.render.com
   - **New** → **Blueprint**
   - Connect your **monm** repo
   - Click **Apply**
   - Add env vars to **monm-api**:
     - `PWA_URL` = `https://monm-secure-messaging.netlify.app`
     - `CORS_ORIGINS` = `https://monm-secure-messaging.netlify.app`
   - Copy your API URL (e.g. `https://monm-api-xxxx.onrender.com`)

3. Update Netlify env vars and redeploy:
   ```powershell
   cd D:\monm
   npx netlify-cli env:set NEXT_PUBLIC_API_URL "https://monm-api-xxxx.onrender.com"
   npx netlify-cli env:set NEXT_PUBLIC_WS_URL "wss://monm-api-xxxx.onrender.com"
   npx netlify-cli deploy --prod
   ```

---

## ⚠️ Database on free tier

Render free tier uses **ephemeral storage** — the database is wiped when the service restarts (~15 min idle) or redeploys. Users must sign up again.

**Workaround:** Have both you and dad sign up, then add each other **right away** before any restart.

**For persistence:** Upgrade Render to paid, add a persistent disk at `/var/data`, then set env vars `DATA_ROOT=/var/data/monm` and `DB_PATH=/var/data/monm/db/monm.db`.

---

## Finding contacts (contact picker fails?)

If "Pick from phone contacts" fails, **paste the number** in the box (e.g. `923001234567` or `3001234567`) and tap **Check**. You can also search by name or `@username`.

---

## Install as PWA

- **Desktop Chrome/Edge:** Install icon in address bar
- **Android:** Chrome menu → Install app
- **iOS:** Safari → Share → Add to Home Screen

---

## Redeploy after changes

**Both Netlify and Render auto-deploy on `git push`.** Run:

```powershell
cd D:\monm
git add -A
git commit -m "Your changes"
git push origin master
```

Or use the script (no uncommitted changes):
```powershell
.\REDEPLOY.ps1
```

**If search/number check still returns nothing:**
1. **Verify Netlify env vars** — Site settings → Environment → ensure:
   - `NEXT_PUBLIC_API_URL` = `https://monm-api.onrender.com` (or your Render URL)
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api.onrender.com`
2. **Trigger a new build** — Deploys → Trigger deploy → Clear cache and deploy
3. **Database** — Render free tier wipes DB on restart. Both users must sign up again, then add each other immediately.
