# MonM — Live Deployment

## Your MonM PWA is live

**URL:** https://monm-secure-messaging.netlify.app

Share this link so anyone can use and install MonM.

---

## Next step: deploy the backend (Render)

The frontend is deployed. For full functionality (messaging, auth), deploy the backend:

1. Push MonM to GitHub:
   ```powershell
   cd D:\monm
   # Create repo at https://github.com/new named "monm"
   git remote add origin https://github.com/YOUR_USERNAME/monm.git
   git push -u origin main
   ```

2. Deploy on Render:
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

## Install as PWA

- **Desktop Chrome/Edge:** Install icon in address bar
- **Android:** Chrome menu → Install app
- **iOS:** Safari → Share → Add to Home Screen

---

## Redeploy after changes

```powershell
cd D:\monm
npx netlify-cli deploy --prod
```
