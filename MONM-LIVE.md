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

## ✅ Database persistence (Starter plan)

The blueprint uses **Starter plan** with a **persistent disk** at `/var/data`. All data (users, chats, messages, uploads) is stored on disk and **persists across restarts and deploys**. Nothing is erased.

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
3. **Database** — With Starter + disk, all data persists. No re-signup needed.

**If the UI still looks old (no sidebar, dark theme):**
1. **Netlify:** Go to https://app.netlify.com → your site → **Deploys** → **Trigger deploy** → **Clear cache and deploy site**
2. **Browser:** Hard refresh (Ctrl+Shift+R) or try an incognito/private window
3. Wait 2–3 minutes for the new build to finish and CDN cache to update
