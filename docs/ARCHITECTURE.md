# Capital Bridge Advisory Platform – Architecture & Security

## Domain structure

| Domain | Purpose |
|--------|--------|
| **login.thecapitalbridge.com** | Authentication only: login, signup, password reset, session creation. This repo. |
| **app.thecapitalbridge.com** | Primary advisory platform (separate deployment). |
| **tools.thecapitalbridge.com** | Advisory modules and tools (separate deployment). |

- Authentication is isolated on the login domain. After successful login/signup, users are redirected to `NEXT_PUBLIC_APP_URL` (e.g. `https://app.thecapitalbridge.com`) when set.
- Sessions are cookie-based (Supabase SSR). For cross-domain recognition, configure Supabase and cookies for the parent domain (e.g. `.thecapitalbridge.com`) as needed.
- All auth endpoints must be served over **HTTPS** in production.

## Security measures (implemented)

- **Secure session storage**: Supabase SSR stores session in cookies; middleware refreshes tokens.
- **Session timeout**: Configurable inactivity window (`NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES`); user is logged out and redirected to login with `message=session_expired`.
- **Protected routes**: Middleware validates session for `/dashboard`; unauthenticated users are redirected to `/login?message=session_expired`.
- **Password reset**: After password update, user is signed out; Supabase invalidates refresh tokens on password change.
- **Auth activity logging**: Events (login attempt/success/failure, signup, logout, password reset request/success, password change) are written to `public.auth_events` for auditing.
- **Redirect control**: Post-login/signup redirect only to `NEXT_PUBLIC_APP_URL` when set; no client-side redirect to arbitrary URLs.

## Supabase configuration checklist

In **Supabase Dashboard**:

1. **Authentication → URL Configuration**
   - **Site URL**: `https://login.thecapitalbridge.com` (or your login domain).
   - **Redirect URLs**: Add all authorised origins, e.g.  
     `https://login.thecapitalbridge.com/**`,  
     `https://login.thecapitalbridge.com/reset-password`,  
     `https://app.thecapitalbridge.com/**`,  
     `https://tools.thecapitalbridge.com/**`,  
     and local dev URLs if used.

2. **Authentication → JWT**
   - Use short-lived access tokens; enable refresh token rotation if available.

3. **Database**
   - Run `001_profiles_and_trigger.sql` and `002_auth_events.sql` in the SQL Editor.

4. **Password reset**
   - Email template should link to `https://login.thecapitalbridge.com/reset-password` (or your login domain + path).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon (publishable) key. |
| `NEXT_PUBLIC_APP_URL` | No | Advisory app URL; redirect here after login/signup when set. |
| `NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES` | No | Inactivity timeout in minutes (default 30). |

## Session and token behaviour

- Sessions are maintained via cookies (Supabase SSR). Tokens are not stored in `localStorage` when using the SSR client and middleware.
- Middleware runs on each request to refresh the session and protect `/dashboard`.
- Session expiry message is shown when the user is redirected to login with `?message=session_expired`.

## Auth events (audit log)

Table: `public.auth_events`

- `user_id`, `event_type`, `metadata` (JSONB), `created_at`.
- Event types: `login_attempt`, `login_success`, `login_failure`, `signup_success`, `logout`, `password_reset_request`, `password_reset_success`, `password_change`.
- RLS: users can insert (own `user_id` or `user_id` null for pre-auth events) and select own rows.

## Further hardening (Supabase / platform)

- **Session limit per user**: Implement in Supabase (e.g. Edge Function or trigger) to revoke older sessions when a limit is exceeded.
- **Abnormal behaviour**: Use Supabase Auth hooks or external monitoring on `auth_events` for rate limits, geo, and failure spikes; add CAPTCHA or step-up when needed.
- **Strict origin**: Ensure in production only HTTPS and allowed domains are used; Vercel/hosting enforces HTTPS.
