# MonM — Complete the Project

## Current status

- **Frontend:** Live at https://monm-secure-messaging.netlify.app
- **Backend:** On GitHub at https://github.com/AmmarJamshed/monm
- **Remaining:** Deploy backend on Render, wire Netlify to it

---

## Step 1: Deploy backend on Render

1. Open: https://render.com/deploy?repo=https://github.com/AmmarJamshed/monm  
2. Sign in with GitHub
3. Click **Apply** (or **Connect** then **Apply**)
4. Wait for the deploy to finish (~5 min)
5. Copy the service URL (e.g. `https://monm-api-xxxx.onrender.com`)

---

## Step 2: Connect frontend to backend

### Option A: Script (recommended)

```powershell
cd D:\monm
$env:RENDER_API_URL="https://monm-api-xxxx.onrender.com"   # Your actual URL
$env:NETLIFY_AUTH_TOKEN="nfp_xxxxxxxx"                     # From https://app.netlify.com/user/applications
.\COMPLETE-PROJECT.ps1
```

### Option B: Manual

1. Netlify → monm-secure-messaging → Site settings → Environment variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `https://monm-api-xxxx.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api-xxxx.onrender.com`
3. Deploys → Trigger deploy → Deploy site

---

## Free tier note

The main `render.yaml` uses a paid Starter plan and disk. For free testing, use `render-free.yaml` instead (Blueprint → paste that file’s content; data is reset on restart).
