# WavaGrill IMS Frontend (Next.js)

Role-based Inventory Management frontend for WavaGrill IMS.

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS v4
- Axios
- Lucide icons

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Running backend API (see `backend/README.md`)

## Project Structure

- `src/app/`: route pages (login, admin, kitchen, super-admin)
- `src/components/`: shared UI and layout components
- `src/context/`: auth and toast providers
- `src/lib/axios.js`: API client and auth interceptors

## Environment Setup

Create `.env.local` in this folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Notes:
- If backend runs on another host/port, update this value.
- If omitted, app falls back to `http://localhost:5001/api`.

## Install and Run

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Build and Start (Production)

Create production build:

```bash
npm run build
```

Run built app:

```bash
npm run start
```

## Authentication Flow

- Login stores JWT in `localStorage` and cookie.
- Axios interceptor sends `Authorization: Bearer <token>` for API requests.
- On `401`, token is cleared and user is redirected to login.

## Expected Backend

Frontend expects these API groups under `NEXT_PUBLIC_API_URL`:

- `/auth/*`
- `/super-admin/*`
- `/admin/*`
- `/kitchen/*`

## Useful Scripts

- `npm run dev`: local development
- `npm run build`: production build
- `npm run start`: run production build

## Troubleshooting

1. API requests fail / network error:
- Confirm backend is running.
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`.

2. CORS errors:
- Add frontend origin to backend `allowedOrigins` in `backend/app.js`.

3. Login loops back to login:
- Check backend JWT secret/config.
- Confirm browser can store cookies/localStorage.

4. Build works locally but not on server:
- Ensure same Node.js major version.
- Run `npm ci` then `npm run build`.

## Deployment Notes

Typical server flow:

```bash
npm ci
npm run build
npm run start
```

If using PM2:

```bash
pm2 start npm --name wavagrill-ims-next -- run start
pm2 save
```

