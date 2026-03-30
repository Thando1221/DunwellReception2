# Dunwell Youth Priority Clinic - Patient Management System

## Overview
A full-stack clinic management system for patient records, appointments, attendance, and staff management.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui components
- **Backend**: Node.js Express API server
- **Database**: Microsoft SQL Server / Azure SQL (via `mssql` package)
- **Auth**: JWT (jsonwebtoken) + bcryptjs password hashing

## Project Structure
```
/
├── src/                  # React frontend source
│   ├── pages/            # Route-level page components
│   ├── components/       # Reusable UI components (shadcn/ui + Layout)
│   ├── lib/              # Utilities (api.js, utils.ts)
│   └── hooks/            # Custom React hooks
├── backend/              # Express API server
│   ├── routes/           # API route handlers
│   ├── db.js             # Azure SQL connection pool helper
│   └── server.js         # Express entry point
├── public/               # Static assets
├── vite.config.ts        # Vite config (proxies /api → backend:3001)
└── start.sh              # Startup script (runs both servers)
```

## Running the App
The workflow runs `bash start.sh` which:
1. Starts the Express backend on port 3001
2. Starts the Vite dev server on port 5000

Vite proxies all `/api/*` requests to the backend on port 3001.

## Environment Variables
- `VITE_API_URL` = `/api` (relative path, proxied by Vite)
- `BACKEND_PORT` = `3001`
- `DB_SERVER`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` — Azure SQL credentials
- `JWT_SECRET` — JWT signing secret
- `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE` — Azure SQL TLS settings

## Key Features
- **Login** — JWT-based authentication for staff
- **Dashboard** — Summary metrics and charts
- **Patients** — CRUD for patient records
- **Appointments** — Book and manage appointments
- **Bookings** — View/edit scheduled bookings
- **Attendance** — Track staff/patient attendance
- **Nurses/Users** — Staff management (via backend routes)
