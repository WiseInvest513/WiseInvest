import { NextResponse } from "next/server";
import { getSsoIssuer } from "@/lib/sso/crypto";
import { WISE_SSO_SCOPES } from "@/lib/sso/oauth";

export const runtime = "nodejs";

export async function GET() {
  const issuer = getSsoIssuer();

  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    scopes_supported: WISE_SSO_SCOPES,
    claims_supported: [
      "sub",
      "wise_user_id",
      "user_id",
      "email",
      "email_verified",
      "name",
      "picture",
      "membership_tier",
    ],
    code_challenge_methods_supported: ["S256"],
  });
}
