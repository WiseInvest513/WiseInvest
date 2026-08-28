import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function getWiseAuthorization() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      signedIn: false,
      userId: null,
      wiseUserId: null,
      role: "USER",
      membershipTier: "MEMBER",
      entitlements: new Set<string>(),
    };
  }

  const user = await getPrisma().user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      wiseUserId: true,
      role: true,
      membershipTier: true,
      entitlements: {
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: {
          key: true,
        },
      },
    },
  });

  if (!user) {
    return {
      signedIn: false,
      userId: null,
      wiseUserId: null,
      role: "USER",
      membershipTier: "MEMBER",
      entitlements: new Set<string>(),
    };
  }

  return {
    signedIn: true,
    userId: user.id,
    wiseUserId: user.wiseUserId,
    role: user.role,
    membershipTier: user.membershipTier,
    entitlements: new Set(user.entitlements.map((entitlement) => entitlement.key)),
  };
}

export async function hasEntitlement(key: string) {
  const authorization = await getWiseAuthorization();
  return authorization.role === "ADMIN" || authorization.entitlements.has(key);
}

export async function isWiseVipOrAbove() {
  const authorization = await getWiseAuthorization();
  return (
    authorization.role === "ADMIN" ||
    authorization.membershipTier === "VIP" ||
    authorization.membershipTier === "VIP_PLUS"
  );
}
