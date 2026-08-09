# Nexora ERP — Vercel (Frontend + Backend)

Yes: **both frontend and backend can run on Vercel**.

- Frontend = static Vite build (`client/dist`)
- Backend = serverless Express at `/api` (`api/index.js`)
- Database = MongoDB Atlas

> Chat realtime (Socket.io) is limited on Vercel serverless. REST API, auth, CRUD, AI, etc. work.

## Deploy on Vercel (one project)

1. Import GitHub repo `Hashir296/Nexora-ERP`
2. **Root Directory = repository root** (do **not** set to `client` or `server`)
3. Framework preset can be Other / Vite — `vercel.json` controls build
4. Add **Environment Variables**:

| Name | Example |
|------|---------|
| `MONGODB_URI` | `mongodb+srv://...@cluster0....mongodb.net/nexora-erp?...` |
| `JWT_ACCESS_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | long random string |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `NODE_ENV` | `production` |
| `GOOGLE_API_KEY` | optional |
| `GOOGLE_AI_MODEL` | `gemini-2.0-flash-lite` |

5. **Do not set `VITE_API_URL`** (leave empty) so the app calls same-domain `/api`
6. Atlas Network Access → allow `0.0.0.0/0`
7. Deploy

### Verify

- `https://your-app.vercel.app` → login page
- `https://your-app.vercel.app/api/health` → `{ success: true, ... }`

### If you already deployed and got 500

1. Vercel → Project → Settings → **Root Directory = empty / `.`**
2. Ensure env vars above are set
3. Redeploy (clear cache if needed)

## Local development

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

Client proxies `/api` → `http://localhost:5000`.
