# Manual Deploy - Render + Netlify

The fix for the kill-file page (shared-files route order) is in commit `3d05b94` and has been pushed.

## 1. Netlify (Frontend)

1. Go to **https://app.netlify.com/sites/monm-secure-messaging/deploys**
2. Click **"Trigger deploy"** → **"Deploy site"** (or "Clear cache and deploy site" if needed)
3. Wait 2–3 minutes for the build to finish

## 2. Render (Backend)

1. Go to **https://dashboard.render.com**
2. Open your **monm-api** service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait 3–5 minutes for the deploy

## 3. Automated (with API keys)

If you have `NETLIFY_AUTH_TOKEN` and `RENDER_API_KEY`:

```powershell
$env:NETLIFY_AUTH_TOKEN = "your_netlify_token"
$env:RENDER_API_KEY = "your_render_key"
.\DEPLOY-NOW.ps1
```

- **Netlify token:** https://app.netlify.com/user/applications#personal-access-tokens
- **Render key:** https://dashboard.render.com/u/settings?add-api-key

## What was fixed

- **Backend:** `GET /shared-files` was being matched by `GET /:mediaId/blob` (mediaId = "shared-files"). The shared-files route is now defined before the `:mediaId` routes.
- **Frontend:** Improved error handling on the kill-file page.
