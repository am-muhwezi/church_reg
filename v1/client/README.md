# Client — Manifest Kenya

[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8.svg)](https://tailwindcss.com)

React frontend for the Manifest Kenya Registration Platform. Mobile-first UI for member check-in and registration, plus an admin dashboard with analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript 5.7 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router 6 |

## Project Structure

```
src/
├── api/
│   ├── client.ts       # Fetch wrapper (get, post, patch, del)
│   ├── saints.ts       # Member API calls
│   └── types.ts        # Shared TypeScript types
├── pages/
│   ├── CheckIn.tsx     # Member check-in (name search)
│   ├── Register.tsx    # Multi-step registration / edit form
│   ├── MemberFound.tsx # Returning member confirmation
│   ├── Welcome.tsx     # Post-registration welcome screen
│   └── admin/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── Saints.tsx
│       ├── SaintDetail.tsx
│       ├── Reports.tsx
│       └── AdminSettings.tsx
└── components/         # Shared UI components
```

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

1. Install dependencies
```bash
npm install
```

2. Configure environment
```bash
# Create a .env.local file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

> In development, Vite proxies `/api` → `http://localhost:8000` by default (configured in `vite.config.ts`), so the env variable is optional.

3. Start the dev server
```bash
npm run dev
```

App will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

Output is in `dist/`. The project includes a `vercel.json` for deployment on Vercel with API rewrites configured.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `/api` |
