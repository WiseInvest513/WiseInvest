import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSsoIssuer, verifyJwt } from "@/lib/sso/crypto";
import { buildUserinfo } from "@/lib/sso/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized(description = "Invalid access token.") {
  return NextResponse.json(
    { error: "invalid_token", error_description: description },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="${description}"`,
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return unauthorized("Bearer token is required.");

  try {
    const payload = verifyJwt(token);
    const issuer = getSsoIssuer();
    if (payload.token_use !== "access_token" || payload.aud !== `${issuer}/oauth/userinfo`) {
      return unauthorized();
    }

    const wiseUserId = typeof payload.sub === "string" ? payload.sub : "";
    const user = await getPrisma().user.findUnique({
      where: { wiseUserId },
      select: {
        id: true,
        wiseUserId: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        membershipTier: true,
      },
    });

    if (!user) return unauthorized("User no longer exists.");

    return NextResponse.json(buildUserinfo(user, String(payload.scope ?? "")), {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch {
    return unauthorized();
  }
}
