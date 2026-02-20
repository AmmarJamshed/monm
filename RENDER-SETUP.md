# MonM – Render Backend Setup

## Quick Deploy (one click)

1. **Sign in to Render** (GitHub): https://dashboard.render.com/login
2. **Deploy blueprint**: https://render.com/deploy?repo=https://github.com/AmmarJamshed/monm
3. Click **Connect GitHub** if prompted, then **Apply**
4. Set env vars (in the deploy screen or later in Dashboard → monm-api → Environment):
   - `PWA_URL` = `https://monm-secure-messaging.netlify.app`
   - `CORS_ORIGINS` = `https://monm-secure-messaging.netlify.app`
5. Click **Apply** / **Deploy**
6. Wait for deploy (~3–5 min). Copy your service URL (e.g. `https://monm-api-xxxx.onrender.com`)

---

## Connect Frontend to Backend

In **Netlify** → Site settings → Environment variables:

| Variable               | Value                               |
|------------------------|-------------------------------------|
| `NEXT_PUBLIC_API_URL`  | `https://monm-api-xxxx.onrender.com` |
| `NEXT_PUBLIC_WS_URL`   | `wss://monm-api-xxxx.onrender.com`   |

Then: Netlify → Deploys → **Trigger deploy** → **Deploy site**

---

## Plan Note

The blueprint uses **Starter** plan + disk for SQLite persistence. Free tier has no disk; data would be lost on restart. For production, use Starter ($7/mo).
