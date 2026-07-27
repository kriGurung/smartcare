# SmartCare — Verified Caregiver Rental Platform

> **Every caregiver verified. Every booking transparent. Every payment secure.**

SmartCare is a full-stack Progressive Web App that connects families with **verified, background-checked caregivers** for home and hospital care in Nepal. It ships with three complete role experiences — **Patient/Family**, **Caregiver**, and **Admin** — a secure Node/Express API, and a polished React front-end.

This build is configured to run **entirely on a local Windows 11 PC** using **Laragon (MySQL)** — no cloud services required.

---

## Table of contents

1. [What's included](#whats-included)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick start (Windows + Laragon)](#quick-start-windows--laragon)
5. [Demo accounts](#demo-accounts)
6. [Project structure](#project-structure)
7. [Available scripts](#available-scripts)
8. [Configuration reference](#configuration-reference)
9. [Payments & the sandbox](#payments--the-sandbox)
10. [How the app was adapted from AWS to local](#how-the-app-was-adapted-from-aws-to-local)
11. [Troubleshooting](#troubleshooting)

---

## What's included

**Patients / families**
- Browse and search **only verified** caregivers by service, location (home/hospital), rating and price
- Rich caregiver profiles with verification checklist, sub-ratings and reviews
- Guided multi-step booking flow with live price estimates
- Secure payments (eSewa, Khalti, bank transfer, cash) with a working sandbox
- Track visits, read digital care logs, and leave detailed reviews after completion

**Caregivers**
- Full profile setup: bio, experience, rate, services, home/hospital, availability
- Upload verification documents (citizenship, training certificate, police clearance)
- Accept/decline job requests, start & complete visits, add handover care logs
- Dashboard with earnings, ratings and job stats

**Admins**
- Verification queue with in-browser document review and per-document approve/reject
- User management (suspend/reactivate patients and caregivers)
- Platform-wide bookings and payments views, with refunds
- Reports dashboard (revenue, booking trends) powered by charts
- Configurable commission rate and homepage banner

**Under the hood**
- JWT auth with short-lived access tokens + rotating refresh tokens (httpOnly cookie)
- Role-based access control enforced in middleware **and** per-record ownership checks (anti-IDOR)
- Account lockout after repeated failed logins, rate limiting, Helmet, input validation
- Money stored as integer **paisa** to avoid floating-point errors
- Column-level AES-256-GCM encryption for sensitive fields (national ID, health notes)
- Audit logging, in-app notifications, and email/SMS hooks (mocked to console by default)
- Installable PWA with offline shell and app manifest

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, Sequelize ORM |
| Database | **MySQL** (via Laragon) |
| Auth | JWT (access + refresh), bcrypt |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Charts / icons | Recharts, Lucide |
| PWA | vite-plugin-pwa (Workbox) |

---

## Prerequisites

Install these on your Windows 11 machine first:

1. **Node.js 18 LTS or newer** — <https://nodejs.org> (includes `npm`).
   Verify in a terminal: `node -v` and `npm -v`.
2. **Laragon (Full edition)** — <https://laragon.org/download/>.
   Laragon bundles MySQL, which is the only database you need.
3. A code editor such as **VS Code** (optional but recommended).

---

## Quick start (Windows + Laragon)

### 1. Start MySQL in Laragon

1. Open **Laragon**.
2. Click **Start All**. This launches Apache/Nginx and **MySQL**.
3. That's it — the app will **create the `smartcare` database automatically** on first run.

> Laragon's default MySQL credentials are user `root` with an **empty password** on port `3306`. The app is pre-configured for exactly this. If your MySQL uses a different user/password/port, edit `server/.env` (see [Configuration reference](#configuration-reference)).

### 2. Run the backend API

Open a terminal (Laragon's **Terminal** button, or Command Prompt / PowerShell) in the project's `server` folder:

```bash
cd server
npm install          # install dependencies (first time only)
npm run seed         # create tables + load demo data
npm run dev          # start the API at http://localhost:5000
```

You should see a log line confirming the database connection and `SmartCare API listening on http://localhost:5000`.

> `npm run seed` is optional but recommended — it populates verified/pending caregivers, patients, bookings, payments and reviews so every screen has realistic data. To wipe and reseed later, run `npm run db:reset`.

### 3. Run the frontend

Open a **second** terminal in the project's `client` folder:

```bash
cd client
npm install          # install dependencies (first time only)
npm run dev          # start the app at http://localhost:5173
```

### 4. Open the app

Visit **<http://localhost:5173>** in your browser and log in with a demo account below.

> The frontend dev server automatically proxies API calls (`/api/*`) to the backend on port 5000, so you only ever open the one URL.

---

## Demo accounts

All demo accounts use the password **`Password123`**.

| Role | Email | Notes |
|------|-------|-------|
| Admin | `admin@smartcare.local` | Verification queue, users, reports, settings |
| Caregiver (verified) | `sita@smartcare.local` | Appears in search, has bookings & reviews |
| Caregiver (pending) | `deepak@smartcare.local` | Shows the verification flow |
| Patient | `hari@smartcare.local` | Has existing bookings to explore |

The login screen also has one-tap buttons to fill these in.

---

## Project structure

```
smartcare/
├── assets/                 # Logo (SVG marks + previews)
├── server/                 # Express + Sequelize API
│   ├── src/
│   │   ├── config/         # env, database (dialect-aware), constants
│   │   ├── models/         # Sequelize models + associations
│   │   ├── controllers/    # Route handlers (auth, bookings, payments, admin…)
│   │   ├── middleware/     # auth, RBAC, validation, rate limiting, uploads
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # payments, notifications, audit
│   │   ├── utils/          # jwt, crypto, money, logger, seed
│   │   ├── uploads/        # stored documents & photos (local disk)
│   │   ├── app.js          # Express app wiring
│   │   └── server.js       # bootstrap: connect → sync → seed → listen
│   ├── .env.example        # copy to .env (defaults work out of the box)
│   └── package.json
├── client/                 # React PWA (Vite)
│   ├── public/             # favicon, PWA icons, manifest
│   ├── src/
│   │   ├── components/      # UI primitives, layout, shared widgets
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # public / patient / caregiver / admin screens
│   │   ├── services/api.js # axios client with silent token refresh
│   │   └── lib/            # formatting + constants
│   └── package.json
├── package.json            # optional: run both apps together
└── README.md
```

---

## Available scripts

**Backend (`/server`)**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the API with auto-reload (nodemon) |
| `npm start` | Start the API (production mode) |
| `npm run seed` | Create tables and load demo data |
| `npm run db:reset` | Drop, recreate and reseed everything |

**Frontend (`/client`)**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (port 5173) |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

**Optional — run both at once (from the project root)**

```bash
npm install          # installs "concurrently" once
npm run dev          # starts server + client together
```

---

## Configuration reference

Backend configuration lives in `server/.env` (copy from `server/.env.example`). The defaults are tuned for a stock Laragon install, so **you usually don't need to change anything**. Key values:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed frontend origin (CORS) |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL host & port |
| `DB_NAME` | `smartcare` | Database name (auto-created) |
| `DB_USER` / `DB_PASSWORD` | `root` / *(empty)* | MySQL credentials (Laragon defaults) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev placeholders | **Change these for any real deployment** |
| `FIELD_ENCRYPTION_KEY` | dev placeholder | 32-byte hex key for encrypting sensitive fields |
| `DB_SYNC` | *(unset)* | `alter` (dev, default), `safe` (no schema changes), or `force` (drop & recreate) |

> Generate strong secrets with:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Payments & the sandbox

Out of the box, `ESEWA_ENABLED` and `KHALTI_ENABLED` are **`false`**, which activates SmartCare's **built-in mock gateway**. This lets you complete the entire payment journey — choose a method → open a hosted-style checkout page → succeed or cancel → return and finalize — **without any merchant account**. Bank transfer and cash are handled as manual/offline payments with reference numbers.

To connect **real** eSewa or Khalti sandbox/live credentials later:

1. In `server/.env`, set `ESEWA_ENABLED=true` (and/or `KHALTI_ENABLED=true`).
2. Fill in the corresponding merchant code / secret keys.
3. Restart the API. The payment service will switch from the mock sandbox to signed, real gateway requests automatically.

---

## How the app was adapted from AWS to local

The original system design targeted AWS. This build replaces every cloud dependency with a local equivalent so it runs on a single Windows PC:

| Original (AWS) | This build (local) |
|----------------|--------------------|
| RDS (managed MySQL) | **Laragon MySQL** on `localhost:3306` |
| S3 (file storage) | **Local disk** at `server/src/uploads`, served via an authenticated `/api/files` route |
| Secrets Manager | **`.env` file** |
| CloudWatch | **Winston** logs to `server/logs` |
| Managed migrations | **Sequelize sync + seed script** (zero-config on Windows) |

No code changes are needed to run locally — just start Laragon and the two dev servers.

---

## Troubleshooting

**"Unable to connect to the database" / `ECONNREFUSED`**
MySQL isn't running. Open Laragon and click **Start All**. Confirm MySQL is green.

**Access denied for user 'root'**
Your MySQL `root` password isn't empty. Put the real password in `server/.env` under `DB_PASSWORD`.

**Port 5000 or 5173 already in use**
Another process holds the port. Either close it, or change `PORT` in `server/.env` (backend) / the `server.port` in `client/vite.config.js` (frontend). If you change the API port, update `CLIENT_ORIGIN` and the client proxy target too.

**Caregiver doesn't appear in search**
By design, only **verified** caregivers are searchable. Log in as the admin, open **Verifications**, and approve the caregiver (or approve their documents). The seeded `sita@smartcare.local` is already verified.

**I want a clean database**
Run `npm run db:reset` in `/server` to drop, recreate and reseed everything.

**Emails / SMS aren't sending**
That's expected — with blank `SMTP_*` / `SMS_*` settings, notifications are logged to the API console instead of being sent. Fill in real SMTP/SMS credentials in `.env` to enable delivery.

---

Built with care for families across Nepal. 💙
