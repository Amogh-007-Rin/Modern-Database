# Server

## Authentication setup

Copy `.env.example` values into `server/.env` and set a long, random
`JWT_SECRET`. The server loads `server/.env` automatically no matter which
directory you run it from. Set `CLIENT_URL` to the origin serving the client
(`http://localhost:5173` for Vite dev) so browser cookie auth passes CORS.
OAuth is opt-in: add the client ID and secret for Google, GitHub,
and/or Discord, then register the corresponding callback URL:

`<APP_URL>/auth/google/callback`

`<APP_URL>/auth/github/callback`

`<APP_URL>/auth/discord/callback`

## Password reset emails

`POST /auth/forgot-password` sends a real email when SMTP is configured:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey-or-username
SMTP_PASS=secret
EMAIL_FROM="Modern Databases" <no-reply@example.com>
```

The email contains a designed HTML template (plus plain-text fallback) with a
button linking to `<WEB_URL>/reset-password?token=...` (defaults to
`CLIENT_URL`). The link expires in 1 hour. Without SMTP settings, development
builds print the reset link to the console instead; failures never change the
generic API response, so account existence can't be probed.

## Routes

- `POST /auth/signup` — create a password account and receive an HTTP-only JWT cookie.
- `POST /auth/login` — sign in with email and password.
- `GET /auth/google`, `GET /auth/github`, `GET /auth/discord` — begin OAuth sign-in (browser redirect; redirects back to the client login with `?error=` if the provider isn't configured).
- `GET /auth/:provider/callback` — provider callback endpoint. Sets the session cookie and redirects to the client on success, or to the client login with `?error=oauth_cancelled|oauth_invalid|oauth_failed` on failure.
- `GET /auth/me` — retrieve the current user using the session cookie or a Bearer JWT.
- `POST /auth/logout` — clear the session cookie.
- `POST /auth/forgot-password` — request a password reset token (1h expiry, generic response to avoid email enumeration; raw `resetToken` is returned only outside production for local testing).
- `POST /auth/reset-password` — reset the password with a token and receive an HTTP-only JWT cookie.

## Development

```bash
bun run dev
```
