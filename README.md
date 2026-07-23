# Mankind Minds

## Structure

- `backend/` - Maven Spring Boot API
- `frontend/` - React + Vite website

## What this app does

- Frontend loads verified creator profiles from the backend API
- Creator profile images are served as backend static assets
- Creator pages are rendered dynamically from `/api/creators`

## Run backend

1. Open a terminal in `backend/`
2. Run:

   ```bash
   mvn spring-boot:run
   ```

Backend starts on `http://localhost:8080` and exposes:

- `GET /api/creators`
- `GET /api/creators/{slug}`

## Run frontend

1. Open a separate terminal in `frontend/`
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

Frontend starts on `http://localhost:5173` and fetches creator data from the backend API.