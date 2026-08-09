# Nexora ERP (MERN)

Frontend → **Vercel** · Backend → **Render/Railway** · Database → **MongoDB Atlas**

> Do **not** deploy the Express `server` folder on Vercel. It will crash with `FUNCTION_INVOCATION_FAILED` / 500.

## Local run

```bash
cd server
npm install
# put Atlas URI in .env as MONGODB_URI
npm run seed
npm run dev

cd ../client
npm install
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000
- Login (after seed): `admin@nexora.local` / `Admin@123`

## 1) Backend on Render (required)

1. Go to [render.com](https://render.com) → New → Web Service → connect `Hashir296/Nexora-ERP`
2. Root Directory: `server`
3. Build: `npm install`
4. Start: `npm start`
5. Add env vars:

| Key | Value |
|-----|--------|
| `MONGODB_URI` | your Atlas `mongodb+srv://...` |
| `CLIENT_URL` | `https://YOUR-VERCEL-APP.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `JWT_ACCESS_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `NODE_ENV` | `production` |
| `GOOGLE_API_KEY` | optional |

6. Atlas Network Access: allow `0.0.0.0/0`
7. After deploy, open `https://YOUR-API.onrender.com/api/health` — should return healthy JSON

## 2) Frontend on Vercel

1. Vercel → Import `Nexora-ERP`
2. **Root Directory = `client`** (important)
3. Framework: Vite · Build: `npm run build` · Output: `dist`
4. Env:
   - `VITE_API_URL` = `https://YOUR-API.onrender.com` (no trailing slash)
5. Redeploy

If you already deployed the whole repo / server and got a serverless crash: change Root Directory to `client`, set `VITE_API_URL`, redeploy.

## GitHub

https://github.com/Hashir296/Nexora-ERP
