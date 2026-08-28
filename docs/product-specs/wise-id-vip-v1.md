# Wise ID & Wise VIP V1 Product Specification

Status: Approved product direction
Project: Wise Invest
Primary domain: https://wise-invest.org

## 1. Background

Wise Invest currently operates multiple websites and plans to continue building additional investment-related products.

Going forward, Wise Invest should gradually establish:

- one Wise account
- one identity system
- one permission system
- multiple independent Wise products

The main website `wise-invest.org` is the main brand and account entry point.

Future products may include:

- `chain.wise-invest.org`
- `crypto.wise-invest.org`
- `etf.wise-invest.org`

These future products are not part of the current implementation scope.

The current project is focused on building the foundation:

1. user login
2. user account
3. Wise VIP
4. account/channel binding
5. future cross-domain SSO capability

## 2. Business Objective

The practical business objective of the Wise VIP system is to build a long-term referral and commission ecosystem.

Wise Invest should create a user identity system where users can:

1. create a Wise account
2. bind eligible partner accounts
3. verify that they are part of the Wise referral ecosystem
4. obtain Wise VIP status
5. eventually obtain higher status based on eligible trading activity
6. use the same identity across future Wise products

The system serves both:

- user membership and benefits
- referral relationship management

Do not design Wise VIP as a simple paid membership subscription.

## 3. Current Scope

V1 includes:

- registration and login
- Wise Account
- public Wise VIP landing page
- logged-in Wise VIP center
- Member / VIP / SVIP membership model
- brokerage / exchange account binding framework
- manual or configurable verification workflow
- future SSO architecture foundation
- basic admin support for user and VIP verification

V1 does not include:

- Wise Chain
- Wise Crypto product functionality
- advanced trading dashboards
- NFT passes
- points
- complicated gamification
- payment subscriptions
- automatic on-chain verification
- unnecessary Web3 features

Keep V1 focused.

## 4. Authentication

Users must be able to create and access one Wise account.

Required login methods:

- Google
- GitHub
- email + password

Preferred email registration UX:

User enters email -> receives verification code -> enters code -> sets a password -> registration completed.

Email verification codes are used for registration and email reachability verification. Existing email users log in with email + password.

## 5. Account Unification

A user must have one internal Wise User ID regardless of login method.

Example Wise User ID:

`YXXXXXXXXXXXX`

Linked identities may include:

- Google
- GitHub
- Email

If the same verified email or an explicit account-linking workflow allows identities to be safely linked, they should resolve to the same Wise user instead of creating duplicate users.

Never silently merge ambiguous accounts.

## 6. Future Cross-Domain SSO

The authentication architecture must support future Wise applications located on different Wise subdomains and potentially completely different domains.

Future experience:

1. user logs into Wise once
2. user visits another Wise product
3. clicks `Continue with Wise`
4. the product redirects to the Wise identity authority
5. if the Wise session is still active, the user does not need to enter credentials again
6. the product receives authorization
7. the product creates its own local session

Do not implement SSO simply by sharing one cookie across all products.

Do not design every application to reuse one universal application JWT.

Each future application should be capable of having:

- its own client/application identifier
- its own redirect URI
- its own local session
- its own authorization scope

The architecture should be compatible with standard OAuth 2.0 / OpenID Connect patterns.

Use Authorization Code flow with modern security practices such as PKCE where applicable.

Do not build a custom authentication protocol.

## 7. Login UI Location

The user-facing login experience belongs to the Wise main site.

Preferred public routes:

- `/login`
- `/account`

The login page should visually feel like the main Wise Invest website.

Future applications may redirect users into this Wise identity/login flow.

The implementation may use a separate authentication service or identity authority internally if technically appropriate. For example, `id.wise-invest.org` can eventually act as infrastructure.

Normal users should perceive the experience as "Sign in to Wise".

## 8. Membership Model

V1 has three levels.

### Level 1: Member

Every successfully registered Wise user becomes a Member.

Member is the default account state.

A Member can:

- access account settings
- view Wise VIP information
- view available verification channels
- bind eligible accounts
- see upgrade progress

### Level 2: Wise VIP

A Member becomes Wise VIP after successfully binding and verifying at least one eligible Wise referral account.

Eligible account categories may include:

- supported brokerage accounts
- supported US securities accounts
- supported Hong Kong securities accounts
- supported exchange accounts where appropriate

The exact list must not be hard-coded throughout the frontend. It should come from configurable partner/channel data.

Typing an arbitrary referral code or UID must not instantly grant VIP. The binding relationship must be verified.

Verification can initially be:

- manual administrator approval
- imported referral records
- partner reporting
- API verification where available

V1 may use manual verification when automation is unavailable.

### Level 3: Wise SVIP

Wise SVIP is a higher membership tier.

Initial business logic:

Wise VIP + eligible trading volume reaches the configured threshold = Wise SVIP

Trading volume is mainly relevant to supported exchanges.

Do not hard-code one global number into the application.

SVIP qualification thresholds should be configurable by partner/channel.

Automatic volume syncing may be implemented later.

V1 should establish the data model and state machine even if some checks remain manual.

## 9. Membership States

Use explicit machine-readable values.

Suggested values:

- `MEMBER`
- `VIP`
- `VIP_PLUS`
- `ADMIN`

Do not base authorization on translated display strings. The internal membership value remains `VIP_PLUS`; the public product display name is Wise SVIP.

Display names:

- Member
- Wise VIP
- Wise SVIP

Admin is an internal role and not part of the public membership progression.

## 10. Wise VIP Public Page

Route:

`/vip`

This page must be visible without login. It is a public landing page, not a private account dashboard.

Its purpose is to explain:

- what Wise VIP is
- why Wise VIP exists
- what benefits users receive
- how users qualify
- supported verification methods
- difference between Member / VIP / SVIP
- FAQ
- login / qualification CTA

If not logged in, CTA leads to login. If logged in, CTA leads to `/account/vip`.

## 11. Logged-In VIP Center

Preferred route:

`/account/vip`

`/vip` is the public marketing and explanation page. `/account/vip` is the private user qualification and membership management page.

The logged-in VIP center should show:

- current membership
- upgrade progress
- connected / verification accounts
- benefits currently available to the user

Partner account statuses should use explicit values:

- `NOT_CONNECTED`
- `PENDING`
- `VERIFIED`
- `REJECTED`
- `NEEDS_REVIEW`

Do not represent all state using simple booleans.

## 12. Account Binding

The system must support a generic partner account binding architecture.

Do not build separate hard-coded database tables for every broker.

Recommended conceptual entities:

- Partner
- PartnerAccount
- Verification
- Membership
- Entitlement
- TradingVolume / QualificationMetric

A partner can be:

- `BROKERAGE`
- `EXCHANGE`
- `OTHER`

Each partner may define:

- name
- logo
- partner type
- referral URL
- referral code if applicable
- whether binding can grant VIP
- whether trading volume can grant SVIP
- SVIP threshold
- verification mode
- active/inactive status

## 13. Security and Privacy

Collect the minimum information necessary.

Never collect:

- brokerage passwords
- exchange passwords
- wallet seed phrases
- private keys
- 2FA secrets
- unnecessary API secrets

If a UID/account identifier is required, store only what is necessary.

Sensitive identifiers should not be exposed publicly.

Use appropriate encryption or protection at rest when necessary.

Maintain audit logs for:

- account verification
- VIP upgrade
- VIP downgrade
- admin approval
- admin rejection
- eligibility changes

A user's VIP status must never depend only on frontend state.

Authorization must be validated server-side.

## 14. Referral / Commission Foundation

The architecture should preserve:

- partner/channel
- referral source
- user binding
- verification status
- verification time
- qualification status
- membership outcome

Conceptual relationship:

Wise User -> Partner Account -> Wise Referral Channel -> Verification -> Membership Eligibility

Do not expose private commission information to ordinary users unless explicitly designed later.

V1 does not need to calculate Wise's actual commission revenue.

## 15. Admin Requirements

V1 should include enough administrative capability to operate the system.

Admin should be able to:

- view users
- search users
- view user membership
- view account binding requests
- approve a verification
- reject a verification
- add internal notes
- upgrade/downgrade membership when authorized
- configure supported partners
- enable/disable partners
- configure which partners qualify for VIP
- configure SVIP qualification rules
- view audit history

Avoid requiring database edits for normal operational work.

## 16. Suggested Core Data Model

Do not blindly create these exact tables before inspecting the existing codebase.

Use this as the domain model:

- users
- auth_identities
- partners
- partner_accounts
- qualification_metrics
- entitlements
- audit_logs

## 17. Authorization Model

Membership tier and product permissions should remain conceptually separate.

Do not assume:

VIP = every future feature.

A user can have:

- membership tier: VIP
- entitlements: `vip_group`, `etf_pro`, `future_beta_access`

Future products such as Chain or Crypto may use their own entitlements.

V1 does not need to implement Chain/Crypto entitlement logic, but the database model should not prevent it.

## 18. UI Principles

Do not copy the Qianyuwing visual design.

Use it only as a conceptual reference for:

- membership progression
- account binding
- upgrade progress
- qualification center

Wise Invest should use its own visual system.

The experience should feel modern, restrained, financial, trustworthy, and easy to understand.

Avoid gamification that makes financial-account verification look like a game.

Prioritize real usability.

## 19. Engineering Requirements

Before implementation:

1. inspect the current repository
2. identify the framework
3. identify current authentication code if any
4. identify database / ORM
5. identify deployment provider
6. identify environment variable strategy
7. identify current UI component system
8. identify whether there is already an admin architecture

Then propose the smallest compatible architecture.

Do not rewrite unrelated parts of the project.

Do not start implementation before producing a short implementation plan.

## 20. V1 Completion Criteria

V1 is complete when:

1. a user can sign in with Google
2. a user can sign in with GitHub
3. a user can sign in with email OTP
4. the system creates one persistent Wise user identity
5. `/vip` works for logged-out users
6. `/account` works for logged-in users
7. `/account/vip` works for logged-in users
8. every new user starts as Member
9. a user can submit an eligible partner account binding
10. the binding has a proper verification state
11. a verified eligible binding can upgrade Member -> VIP
12. SVIP data structures and qualification logic exist
13. admins can review / approve binding requests
14. authorization is enforced server-side
15. architecture does not block future cross-domain SSO
16. existing Wise Invest pages continue working
17. lint/typecheck/tests/build pass

## 21. Explicit Non-Goals

Do not currently build:

- Chain
- Crypto
- ETF Pro functionality
- wallet login
- Web3 wallet verification
- NFT
- points
- paid subscription
- complex trading-volume integrations unless already trivially available
- custom OAuth implementation from scratch

First make Wise Account + Wise VIP reliable.
