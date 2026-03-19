# Carbon Crumbs

Carbon Crumbs is a whimsical but clean carbon footprint tracker with animal companions, earthy pastel visuals, user accounts, MongoDB storage, and a GitHub Pages-ready frontend.

## Deployment model

- `docs/` → static frontend for **GitHub Pages**
- `server.js` + backend folders → **Node/Express API** for Render/Railway
- MongoDB Atlas → hosted database

## Local run in VS Code

1. Open this folder in VS Code.
2. Copy `.env.example` to `.env`.
3. Put your local or Atlas MongoDB connection string in `.env`.
4. Run:

```bash
npm install
npm run dev
```

5. Open `http://localhost:5000`

## GitHub push to main

```bash
git init
git branch -M main
git add .
git commit -m "Initial Carbon Crumbs deployment-ready build"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

## GitHub Pages frontend

Publish the `docs/` folder from the `main` branch.

1. Push the repo to GitHub.
2. Open the repo on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Set **Branch** to `main`.
6. Set **Folder** to `/docs`.
7. Save.

Then edit `docs/config.js` and replace the placeholder backend URL with your deployed backend URL.

## Backend deploy

Deploy the backend using Render or Railway. The easiest path is Render with the included `render.yaml`.

Required environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

Example `FRONTEND_ORIGIN` value:

```
https://YOUR-USERNAME.github.io,https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
```

## Important

Do not upload your real `.env` file to GitHub. Only upload `.env.example`.

## MongoDB

This project already uses Mongoose and MongoDB to store users and activities. Use MongoDB Atlas for deployment or a local MongoDB server while developing.
