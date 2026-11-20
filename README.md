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
To preview the signed-in account editor without a backend, open
`http://localhost:5173/account` and choose **Open sample profile**. This
development-only preview is read-only and is not available in production.

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
- `/about/`
- `/certificates`
- `/apply`

Creator data is loaded from the configured API in
`frontend/src/apiConfig.js`.

The About page's text and review-category panels are in
`frontend/src/about-content.html`; the same content is included in the static
page generated for search engines. Replace the "coming soon" text in each
category when its screening details are ready. The Dani and Thomas portrait
placeholders can be replaced with images stored in `frontend/public/` and
referenced from that file. Run `npm run build` followed by
`node --test scripts/check-about.mjs` from `frontend/` to check the static page.
