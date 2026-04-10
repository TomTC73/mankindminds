# Basic Spring Boot + NPM Frontend Template

## Structure

- `backend/` - Maven Spring Boot API
- `frontend/` - NPM + Vite website

## What this app does

- User chooses submission type: **text** or **image**
- Frontend sends submission to backend
- Backend forwards submission to your review email for manual approval
- Video submission is not yet implemented

## Run backend

1. Open terminal in `backend/`
2. Run:

   ```bash
   mvn spring-boot:run
   ```

Backend starts on `http://localhost:8080` and exposes:

- `POST /api/submissions`

Before running, update backend email settings in [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties):

- `review.email.to`
- `spring.mail.username`
- `spring.mail.password`
- `captcha.secret-key`

If you use Gmail, use an App Password (not your normal account password).

Also update the reCAPTCHA site key in [frontend/index.html](frontend/index.html) by replacing `replace-with-your-recaptcha-site-key`.

You can create both keys in Google reCAPTCHA admin and use the same domain you run locally (`localhost`).

## Run frontend

1. Open second terminal in `frontend/`
2. Install deps:

   ```bash
   npm install
   ```

3. Start dev server:

   ```bash
   npm run dev
   ```

Frontend starts on `http://localhost:5173` and sends submissions to the backend endpoint.
