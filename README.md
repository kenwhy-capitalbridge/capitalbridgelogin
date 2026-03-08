# capitalbridgelogin

Minimal web authentication app using Next.js (App Router), TypeScript, Supabase, and Tailwind.

## Setup

1. Copy environment variables and add your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Database: profiles table + trigger**

   The app does **not** insert into `profiles` from the frontend. Profiles are created automatically by a database trigger when a user signs up.

   In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the migration:

   - Open `supabase/migrations/001_profiles_and_trigger.sql` in this repo, copy its contents, and run it in the SQL Editor, **or**
   - Run the SQL below.

   It will:
   - Create `public.profiles` with `id` (uuid, PK, references `auth.users(id)`), `username`, `email`, `created_at`
   - Enable RLS and policies (select/update own profile)
   - Create a trigger on `auth.users` that inserts a row into `profiles` for each new user (`id`, `email`, `created_at`; `username` from signup metadata if provided)

   Then run **`supabase/migrations/002_auth_events.sql`** in the SQL Editor to create the auth audit log table.

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Signup flow

1. User submits signup form.
2. Frontend calls **only** `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
3. Supabase creates the user in `auth.users`.
4. Database trigger inserts a row into `public.profiles` with `id`, `email`, `created_at`, and optionally `username` from metadata.
5. Frontend redirects to the dashboard. No profile insert is done in the frontend.

Errors shown on signup are the **real** Supabase auth error messages (e.g. invalid email, duplicate email). The generic "Database error saving new user" should not appear once the trigger is in place and frontend profile insert is removed.

## Authentication flow

- **Login** (`/login`) – Email and password. After success, redirect to dashboard. Supports `?message=reset` to show “Password reset successfully.”
- **Signup** (`/signup`) – Email, password, username (display name). Auth only; profile created by DB trigger. Shows “Account created successfully” then redirects to dashboard.
- **Forgot password** (`/forgot-password`) – User enters email; app calls `resetPasswordForEmail` with `redirectTo: /reset-password`. Confirmation message: “Check your email for the reset link.”
- **Reset password** (`/reset-password`) – User lands here from the email link. Enters and confirms new password; app calls `updateUser({ password })`, then redirects to login with success message.
- **Dashboard** (`/dashboard`) – Protected. Requires valid session; otherwise redirect to login. Loads profile from `profiles` by `auth.uid()`.

**Supabase configuration:** In Authentication → URL Configuration, set the site URL and add `https://your-domain.com/reset-password` (and your dev URL) to Redirect URLs so the password reset email brings users back to your app.

## Features

- **Signup** – Email, password, username → auth only; profile created by DB trigger
- **Login** – Email + password; “Forgot password?” link to `/forgot-password`
- **Forgot password** – Request reset email; redirects to `/reset-password`
- **Reset password** – Set new password after email verification; redirect to login
- **Dashboard** – Protected; shows username and email from `profiles`
- **Logout** – Signs out and redirects to login

## Security and domain structure

- **Sessions**: Cookie-based via Supabase SSR; middleware refreshes tokens. No auth tokens in `localStorage`.
- **Session timeout**: Configurable inactivity logout (`NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES`, default 30). Redirects to login with “Your session has expired.”
- **Protected routes**: `/dashboard` requires a valid session; otherwise redirect to `/login?message=session_expired`.
- **Post-login redirect**: If `NEXT_PUBLIC_APP_URL` is set (e.g. `https://app.thecapitalbridge.com`), users are redirected there after login/signup.
- **Auth audit log**: Events (login, signup, logout, password reset, etc.) are stored in `public.auth_events`. Run `002_auth_events.sql` in Supabase.

See **docs/ARCHITECTURE.md** for domain structure (login vs app vs tools), Supabase checklist, and hardening notes.

## Project structure

```
/app
  /api/auth/log    – Auth event logging API
  /login           – Login page
  /signup          – Signup page
  /forgot-password – Request password reset email
  /reset-password  – Set new password (from email link)
  /dashboard       – Protected dashboard (session timeout applied)
/lib
  supabase/client.ts   – Browser Supabase client (SSR)
  supabase/server.ts   – Server Supabase client (cookies)
  supabase/middleware.ts – Session refresh and route protection
  supabaseClient.ts    – Re-exports browser client
  useSessionTimeout.ts – Inactivity timeout hook
  authLog.ts           – Auth event logging helper
middleware.ts          – Runs session refresh and protects /dashboard
supabase/migrations/
  001_profiles_and_trigger.sql – Profiles table + trigger
  002_auth_events.sql           – Auth audit log table
docs/
  ARCHITECTURE.md – Domain structure and security
```
