# Wise ID + Wise VIP V1 Production Runbook

Last updated: 2026-08-28

## Scope

This runbook covers the main Wise Invest site only:

- `https://wise-invest.org/login`
- `https://wise-invest.org/account`
- `https://wise-invest.org/account/vip`
- `https://wise-invest.org/admin`

It does not launch Chain, Crypto, ETF Pro, wallet login, paid subscriptions, or a public OAuth/OIDC identity provider.

## Required Services

1. Postgres
   - Recommended: Vercel Postgres, Neon, or Supabase Postgres.
   - Required env: `DATABASE_URL`.
2. Auth.js secret
   - Required env: `AUTH_SECRET`.
   - Generate with: `openssl rand -base64 32`.
3. Google OAuth
   - Required env: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
   - Callback: `https://wise-invest.org/api/auth/callback/google`.
4. GitHub OAuth
   - Required env: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
   - Callback: `https://wise-invest.org/api/auth/callback/github`.
5. Email registration OTP provider
   - Current implementation supports Resend.
   - Required env: `RESEND_API_KEY`, `EMAIL_FROM`.
6. Redis rate limit
   - Uses the existing Upstash Redis env pair:
     - `KV_REST_API_URL`, `KV_REST_API_TOKEN`
     - or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
7. Initial admin
   - Required env before first admin login: `WISE_ADMIN_EMAILS`.
   - Multiple emails are comma-separated.

## Deployment Steps

1. Configure production environment variables in Vercel.
2. Deploy the build.
3. Run the local structural verification:

```bash
npm run wise:v1:verify
```

4. Run database migration:

```bash
npx prisma migrate deploy
```

5. Seed the default VIP partners:

```bash
npm run vip:seed
```

6. Sign in with an email included in `WISE_ADMIN_EMAILS`.
7. Open `/admin/system` and confirm required services are configured.
8. Open `/admin/partners` and confirm default partners are correct.
9. Submit a test binding from `/account/vip`.
10. Review the test binding from `/admin/vip`.
11. Confirm the user becomes `Wise VIP` only after approval.

Detailed Google / GitHub OAuth setup is documented in `docs/deployment/oauth-login-setup.md`.

## Operational Checks

- `/admin/users`: search users by email, name, or Wise User ID.
- `/admin/users/:id`: inspect membership, entitlements, bindings, and recent audit events.
- `/admin/partners`: enable, disable, or update VIP-eligible partners.
- `/admin/audit`: inspect recent admin and membership events.
- `/admin/system`: verify environment readiness without exposing secrets.

## Security Boundaries

- Users submit only UID / account identifiers and optional notes.
- Never collect exchange passwords, broker passwords, wallet seed phrases, private keys, API secrets, or 2FA secrets.
- A submitted binding is not enough to grant VIP.
- `MEMBER -> VIP` only happens through verified eligible partner bindings or explicit admin membership update.
- Admin mutation APIs require server-side `ADMIN` role.
- Mutation APIs are rate-limited when Redis is configured.

## Rollback

If a production deployment has to be rolled back:

1. Roll back the Vercel deployment first.
2. Do not manually delete auth tables unless there is a confirmed schema issue.
3. If partner configuration is wrong, prefer fixing it in `/admin/partners`.
4. If a membership status is wrong, fix it in `/admin/users/:id` so an audit record is preserved.

## Future SSO

The `sso_clients` table is reserved for future external Wise applications.

Do not use shared `.wise-invest.org` cookies as the long-term cross-domain SSO mechanism. Future applications should use an Authorization Code + PKCE flow via a mature OAuth/OIDC implementation.
