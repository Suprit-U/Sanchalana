# Sanchalana

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)

**A modern, responsive full-stack web application with robust authentication, real-time updates, and a comprehensive dashboard — built with React, TypeScript, and Supabase.**

</div>

---

## Overview

Sanchalana is a production-ready web application showcasing modern frontend architecture. It features a complete authentication system, real-time data updates, and an accessible component library built on Radix UI primitives with Tailwind CSS styling.

The name "Sanchalana" (ಸಂಚಾಲನ) means *"management"* or *"operation"* in Kannada.

**Key highlights:**
- Fully typed with TypeScript end-to-end
- Supabase backend for auth, database, and real-time subscriptions
- Accessible UI components via Radix UI
- Form validation with React Hook Form + Zod
- Vite for lightning-fast development and builds

---

## Features

| Feature | Description |
|---------|-------------|
| Secure Authentication | Email/password auth with session management via Supabase |
| Real-Time Updates | Live data sync using Supabase Realtime subscriptions |
| Responsive Design | Mobile-first layout with Tailwind CSS |
| Comprehensive Dashboard | Structured views for managing application data |
| Accessible Components | Radix UI primitives ensuring WCAG compliance |
| Form Validation | Type-safe forms with React Hook Form and Zod schemas |
| Dark Mode Ready | Theme-aware styling with CSS variables |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| UI Primitives | Radix UI |
| Backend | Supabase (Auth + PostgreSQL + Realtime) |
| Form Handling | React Hook Form + Zod |
| HTTP Client | Built-in Supabase JS client |
| Linting | ESLint |

---

## Requirements

- **Node.js** 18+ (or **Bun** 1.0+)
- **npm** 9+ (or **bun**)
- A **Supabase** project (free tier available at [supabase.com](https://supabase.com))

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Suprit-U/Sanchalana.git
cd Sanchalana
```

### 2. Install dependencies

```bash
# Using npm
npm install

# Or using bun (faster)
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if .env.example exists
# or create it manually:
```

Add your Supabase credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Find these values in your Supabase project dashboard under **Project Settings > API**.

### 4. Set up Supabase (if using local dev)

If you prefer a local Supabase instance:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# Apply database migrations
supabase db push
```

The local SQL migrations are in `supabase/migrations/`.

---

## Running the App

### Development server

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build for production

```bash
npm run build
# or
bun run build
```

### Preview production build

```bash
npm run preview
```

---

## Project Structure

```
Sanchalana/
├── src/
│   ├── components/         # Reusable UI components (shadcn/ui based)
│   ├── pages/              # Route-level page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and Supabase client
│   ├── types/              # TypeScript type definitions
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── supabase/
│   └── migrations/         # SQL database migration files
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── components.json         # shadcn/ui component registry config
└── package.json            # Dependencies and scripts
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on the source files |

---

## Troubleshooting

**`VITE_SUPABASE_URL` is not defined**
- Ensure `.env` file exists in the project root with valid Supabase credentials
- Restart the dev server after editing `.env`

**Authentication not working**
- Confirm your Supabase project has Email Auth enabled: *Authentication > Providers > Email*
- Check that `VITE_SUPABASE_ANON_KEY` is the **anon/public** key, not the service role key

**Port already in use**
```bash
# Kill the process on port 8080
npx kill-port 8080
npm run dev
```

---

## Author

**Suprit U** — [GitHub](https://github.com/Suprit-U)

---

*Part of the [Suprit-U/Public](https://github.com/Suprit-U/Public) project collection.*
