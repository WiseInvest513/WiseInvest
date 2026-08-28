# Google / GitHub OAuth Login Setup

Last updated: 2026-08-29

This document covers the production setup for Wise ID login on the main Wise Invest site.

## Current Implementation

The codebase already uses Auth.js / NextAuth v5 with:

- Google OAuth provider
- GitHub OAuth provider
- Email/password credentials provider
- Email OTP verification for registration
- Prisma adapter backed by Postgres
- one persistent Wise User ID per stored user

OAuth login is only useful after `DATABASE_URL` is configured. Without the database, a user cannot be persisted as a real Wise ID user.

## Required Environment Variables

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=https://wise-invest.org

AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
```

Local development can use:

```bash
AUTH_URL=http://127.0.0.1:3002
```

If the local Node.js server cannot access Google or GitHub directly, set:

```bash
AUTH_OAUTH_PROXY_URL=http://127.0.0.1:7897
```

This proxy variable is only for server-side OAuth requests in local development. Production Vercel deployments usually do not need it.

## Google OAuth

Create a Google OAuth client for a web application.

Authorized redirect URIs:

```text
http://127.0.0.1:3002/api/auth/callback/google
https://wise-invest.org/api/auth/callback/google
```

Then set:

```bash
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

Google is the recommended primary OAuth option for ordinary users.

## GitHub OAuth

Create a GitHub OAuth App.

Authorization callback URLs:

```text
http://127.0.0.1:3002/api/auth/callback/github
https://wise-invest.org/api/auth/callback/github
```

Then set:

```bash
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
```

GitHub is technically simple, but it is less friendly for non-developer users. Keep it as a supported option, while Google and email/password remain the primary login paths.

## Account Linking Policy

Do not silently merge ambiguous users.

The current provider config keeps `allowDangerousEmailAccountLinking: false`. That means a Google account and GitHub account with the same email will not be automatically merged unless a future explicit account-linking flow is implemented.

This matches the Wise ID V1 rule: preserve one stable user identity and avoid unsafe silent merges.
