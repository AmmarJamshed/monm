# MonM — Complete All Steps (Netlify + Render)

Follow these in order. Each step is copy-paste ready.

---

## Step 1: Create GitHub Repo

1. Go to **https://github.com/new**
2. Repository name: `monm`
3. Leave "Add a README" **unchecked**
4. Click **Create repository**
5. Copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/monm.git`)

---

## Step 2: Push MonM to GitHub

Open PowerShell in `D:\monm` and run:

```powershell
cd D:\monm
git remote add origin https://github.com/YOUR_USERNAME/monm.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy Backend on Render

1. Go to **https://dashboard.render.com**
2. Click **New** → **Blueprint**
3. Connect GitHub → Select **monm** repo
4. Render detects `render.yaml` → Click **Apply**
5. Wait for **monm-api** to deploy (~3–5 min)
6. Copy the API URL: `https://monm-api-XXXX.onrender.com`
7. Go to **monm-api** → **Environment** → **Add Environment Variable**
   - `PWA_URL` = (leave empty for now)
   - `CORS_ORIGINS` = (leave empty for now)
   - Click **Save**

---

## Step 4: Deploy Frontend on Netlify

1. Go to **https://app.netlify.com**
2. Log in (GitHub recommended)
3. Click **Add new site** → **Import an existing project**
4. Choose **GitHub** → Authorize if prompted
5. Select **monm** repo
6. Netlify auto-fills:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** (leave default — Next.js plugin handles it)
7. **Before deploying**, click **Add environment variables** → **Add a single variable**:
   - `NEXT_PUBLIC_API_URL` = `https://monm-api-XXXX.onrender.com` (your Render URL)
   - `NEXT_PUBLIC_WS_URL` = `wss://monm-api-XXXX.onrender.com` (same, with `wss://`)
8. Click **Deploy site**
9. Wait ~2–4 min
10. Copy your site URL: `https://random-name-123.netlify.app`

---

## Step 5: Connect Backend to Frontend

1. Go to **Render** → **monm-api** → **Environment**
2. Add/Update:
   - `PWA_URL` = `https://random-name-123.netlify.app` (your Netlify URL)
   - `CORS_ORIGINS` = `https://random-name-123.netlify.app`
3. Click **Save** (triggers redeploy)

---

## Step 6: Test Your PWA

1. Open your Netlify URL in a browser
2. Sign up with name + phone
3. Create a new chat, send a message
4. On mobile: **Add to Home Screen** (Safari) or **Install app** (Chrome)

---

## Share Link

**Your MonM PWA:** `https://YOUR-SITE.netlify.app`

Anyone can open it and install on their device.

---

## Alternative: Netlify CLI Deploy (No Git)

If you prefer not to use GitHub:

1. Get a Netlify token: https://app.netlify.com/user/applications#personal-access-tokens
2. Create a token, copy it
3. Run:

```powershell
cd D:\monm\frontend
$env:NETLIFY_AUTH_TOKEN = "YOUR_TOKEN"
npm install
npm run build
npx netlify-cli deploy --prod --dir=.next
```

Note: CLI deploy for Next.js may have limitations; Git-based deploy is recommended.
