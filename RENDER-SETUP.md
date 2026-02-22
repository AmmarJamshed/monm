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

## Plan & Data Persistence

The blueprint uses **Starter** plan ($7/mo) with a **persistent disk** (1 GB) mounted at `/var/data`. All data—users, conversations, messages, media uploads—is stored on this disk and **persists across restarts and deploys**. Nothing is erased from the database.

**If you already have a service on Free tier:** Upgrade to Starter in the Render Dashboard, then sync/redeploy with the updated blueprint. The disk will be created and `DATA_ROOT` / `DB_PATH` will point to the persistent path. Existing data in `/tmp` will not carry over; users will need to sign up again once, and all new data will then persist.
