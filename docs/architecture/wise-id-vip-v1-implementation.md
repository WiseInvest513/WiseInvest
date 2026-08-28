# Wise ID + Wise VIP V1 Implementation Notes

Status: Phase 5 support implemented locally
Last updated: 2026-08-28

## Current Stack Snapshot

- Framework: Next.js App Router
- Next.js: 15.5.9
- React: 19.2.3
- UI: Tailwind CSS, Radix UI primitives, local `components/ui/*`, lucide-react
- Deployment: Vercel via `vercel.json`
- Existing persistence: Upstash Redis for short links, rate limiting, and cache
- Existing database ORM: none before Phase 1
- Existing authentication: none before Phase 1
- Existing admin: no real admin system; the current password-protected tester is not suitable for Wise ID or VIP administration

## Phase 1 Scope

Phase 1 establishes the product and database foundation only.

Included:

- Add the approved Wise ID + Wise VIP V1 product specification to the repository.
- Add the Wise authentication and future SSO architecture document to the repository.
- Add Prisma as the ORM foundation.
- Add a Postgres-oriented Prisma schema for Auth.js-compatible authentication and Wise VIP domain data.
- Add environment variable documentation for database, auth, OAuth, and email OTP.
- Add Prisma npm scripts.

Deferred from Phase 1:

- `/login`
- `/account`
- `/vip`
- `/account/vip`
- Auth.js route handlers
- OAuth provider setup
- Email/password registration and login
- Email OTP registration verification
- middleware protection
- admin verification UI
- database migration execution against a real remote database

## Database Direction

V1 should use Postgres.

Recommended providers:

- Vercel Postgres
- Neon
- Supabase Postgres

The current Prisma schema is provider-neutral Postgres and should work with any of the above once `DATABASE_URL` is configured.

## Domain Model

The schema separates authentication identity from membership and product permissions.

Core areas:

- Auth.js-compatible auth tables: `users`, `auth_accounts`, `auth_sessions`, `auth_verification_tokens`
- Email registration OTP: `email_otps`
- VIP domain: `partners`, `partner_accounts`, `qualification_metrics`
- Permissions: `entitlements`
- Operations and compliance: `audit_logs`
- Future SSO reservation: `sso_clients`

## Phase 2 Scope

Phase 2 added the authentication runtime:

1. Auth.js / NextAuth configuration with JWT sessions.
2. Google and GitHub providers, enabled only when environment variables are present.
3. Email password registration backed by `users.password_hash`.
4. Email OTP request and verification flow for registration backed by `email_otps`.
5. `/api/auth/[...nextauth]`, `/api/auth/email-otp/request`, and `/api/auth/register/email`.
6. Wise user ID generation during OAuth and email user creation.
7. `/login`, `/register`, `/account`, and `/account/vip`.
8. Server-side account protection through `auth()` and page-level redirects.
9. A low-noise account icon in the site navbar.

The auth layer is intentionally tolerant of missing production environment variables so the existing public site can still build before the database and OAuth secrets are configured.

## Phase 3 Scope

Phase 3 added the VIP verification loop:

1. Public `/vip` explanation page.
2. Logged-in `/account/vip` partner-account binding form.
3. Server-side `POST /api/account/partner-accounts` submission endpoint.
4. Admin-only `/admin/vip` review page.
5. Server-side `PATCH /api/admin/partner-accounts/:id` approval / rejection / needs-review endpoint.
6. Membership refresh logic that upgrades `MEMBER -> VIP` only after a verified eligible partner binding.
7. `vip_group` entitlement grant and expiry logic.
8. Default partner seed script: `npm run vip:seed`.
9. Initial Prisma migration SQL under `prisma/migrations`.

User-submitted identifiers never grant VIP by themselves. The admin review endpoint is the state transition boundary.

## Phase 4 Scope

Phase 4 hardened operations:

1. Admin dashboard at `/admin`.
2. Admin user search at `/admin/users`.
3. User detail and manual membership control at `/admin/users/:id`.
4. Server-side membership update API at `/api/admin/users/:id/membership`.
5. Partner management UI at `/admin/partners`.
6. Partner create/update APIs at `/api/admin/partners` and `/api/admin/partners/:id`.
7. Audit log viewer at `/admin/audit`.
8. Shared authorization helpers in `lib/auth/authorization.ts`.

Manual membership changes update entitlements and write audit logs. Partner configuration remains server-side and does not require direct database edits.

## Phase 5 Support

Phase 5 added production-readiness support:

1. Production runbook at `docs/deployment/wise-id-vip-v1-runbook.md`.
2. `npm run prisma:migrate:deploy` script.
3. `/admin/system` configuration checklist.
4. Redis-backed rate limiting for VIP binding submissions.
5. Redis-backed rate limiting for admin mutation APIs.
6. Shared guard helpers for VIP/admin API limits.
7. Structural verification script: `npm run wise:v1:verify`.

Production infrastructure setup is still external work: provision Postgres, configure OAuth apps, verify the email sender domain, set Vercel environment variables, and run migrations/seeds.

## Phase 6 Recommendation

Phase 6 should add database-backed integration tests and final UX polish:

1. Add a test database profile.
2. Extend `npm run wise:v1:verify` with database-backed checks when a test DB is available.
3. Test email OTP sign-in and user creation.
4. Test partner binding submit -> approve -> membership upgrade.
5. Test manual SVIP upgrade and entitlement changes.
6. Add admin audit regression tests.
7. Polish empty states after testing with real data.

## Decisions Still Needed

- Which Postgres provider should be used in production?
- Which email provider should send OTP codes?
- Which email address should become the first `ADMIN` user?
- Whether default seed partners are enough for initial launch.
- Whether SVIP remains manual for V1 or needs imported trading-volume records immediately.
- Whether to add a separate staging database before production launch.
