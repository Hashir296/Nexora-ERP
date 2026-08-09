# Nexora ERP (MERN)

Core platform + plugins. MongoDB Atlas ready. Frontend deploys on Vercel; API on Render/Railway.

## Local run

```bash
cd server
npm install
cp .env.example .env   # put your Atlas URI in MONGODB_URI
npm run seed           # optional demo data
npm run dev

cd ../client
npm install
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5000

Demo login after seed: `admin@nexora.local` / `Admin@123`

## MongoDB Atlas

Set in `server/.env`:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/nexora-erp?retryWrites=true&w=majority
```

Never commit `.env`.

## Deploy (Vercel frontend)

1. Push this repo to GitHub.
2. In Vercel → Import → Root Directory = `client`
3. Build: `npm run build` · Output: `dist`
4. Env var: `VITE_API_URL=https://YOUR-API-HOST` (no trailing slash)
5. Deploy

## Deploy (API backend)

Vercel is for the React app. Host Express separately (Render / Railway / Fly):

1. Root or service directory = `server`
2. Start: `npm start` (or `node src/server.js`)
3. Env vars:
   - `MONGODB_URI` (Atlas)
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
   - `CLIENT_URL=https://your-app.vercel.app` (comma-separate with localhost if needed)
   - `COOKIE_SECURE=true`
   - `GOOGLE_API_KEY` (optional)
   - `NODE_ENV=production`

Atlas Network Access: allow `0.0.0.0/0` (or your host IPs).
