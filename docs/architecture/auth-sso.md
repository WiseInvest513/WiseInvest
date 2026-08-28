# Wise Authentication & SSO Architecture

## Goal

Wise Invest must eventually support one Wise identity across multiple independent applications and domains.

Main user-facing account entry:

`https://wise-invest.org/login`

Possible future identity authority:

`https://id.wise-invest.org`

Future clients may include:

- `wise-invest.org`
- `chain.wise-invest.org`
- `crypto.wise-invest.org`
- `etf.wise-invest.org`
- legacy independent domains

## Principle

Each application may have its own repository, deployment, and local session.

All applications trust one Wise identity authority.

Do not depend on a `.wise-invest.org` shared cookie as the long-term SSO architecture.

Future login flow:

1. Application redirects to Wise authorization endpoint.
2. Wise checks the existing Wise session.
3. Wise issues an authorization code.
4. Application receives the callback.
5. Application creates its own local session.

Prefer standards-based OAuth 2.0 / OpenID Connect.

Use secure authorization-code based flows.

Do not design a custom protocol.

## V1

For the current main-site implementation:

- build a robust primary Wise account
- keep authentication code modular
- avoid assumptions that only one domain will ever exist
- preserve a stable global user ID
- separate authentication identity from membership authorization
- document how future applications will be registered

Full external-client SSO implementation may be deferred until the first second application needs authentication.

## V1 Boundary

V1 should not expose a public OAuth/OIDC identity provider yet.

V1 should prepare the model and code layout so the public identity provider can be added later without replacing the account system.

The main-site session can remain a first-party Wise session. Future applications should not depend on reading that session cookie directly.

## Future External Client Model

Future SSO-capable applications should be registered as clients with:

- client id
- display name
- allowed redirect URIs
- allowed scopes
- active status
- created at / updated at

When external SSO becomes necessary, implement an Authorization Code + PKCE flow using a mature OAuth/OIDC library or identity provider.

Do not create a one-off token exchange protocol between Wise applications.
