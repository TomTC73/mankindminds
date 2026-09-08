# Mankind Minds

Mankind Minds is a React and Vite website for browsing verified creators,
exploring tattoo studios, and submitting creator applications.

## Project structure

```text
frontend/
  public/       Static images, map assets, and GitHub Pages fallback
  src/          React components, routes, and styles
  package.json  Frontend scripts and dependencies
.github/
  workflows/    GitHub Pages deployment
```

## Run locally

From the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`. The root route redirects to the Tattoos section.

To create a production build:

```powershell
cd frontend
npm run build
```

## Main routes

- `/tattoos`
- `/music`
- `/writing`
- `/art`
- `/process/tattoos`
- `/process/music`
- `/process/writing`
- `/process/art`
- `/certificates`
- `/apply`

Creator data is loaded from the configured API in
`frontend/src/apiConfig.js`.
