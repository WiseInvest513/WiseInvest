import type { PrismaClient } from "@prisma/client";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function refreshUserMembership(prisma: PrismaTx, userId: string) {
  const verifiedVipBinding = await prisma.partnerAccount.findFirst({
    where: {
      userId,
      status: "VERIFIED",
      partner: {
        enabled: true,
        vipEligible: true,
      },
    },
    select: {
      id: true,
    },
  });

  if (!verifiedVipBinding) {
    await prisma.user.update({
      where: { id: userId },
      data: { membershipTier: "MEMBER" },
    });
    await prisma.entitlement.updateMany({
      where: {
        userId,
        key: "vip_group",
        expiresAt: null,
      },
      data: {
        expiresAt: new Date(),
      },
    });
    return "MEMBER";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipTier: true },
  });

  if (user?.membershipTier === "VIP_PLUS") return "VIP_PLUS";

  await prisma.user.update({
    where: { id: userId },
    data: { membershipTier: "VIP" },
  });

  await prisma.entitlement.upsert({
    where: {
      userId_key: {
        userId,
        key: "vip_group",
      },
    },
    update: {
      source: "verified_partner_account",
      expiresAt: null,
    },
    create: {
      userId,
      key: "vip_group",
      source: "verified_partner_account",
    },
  });

  return "VIP";
}

export async function setUserMembership(
  prisma: PrismaTx,
  userId: string,
  membershipTier: "MEMBER" | "VIP" | "VIP_PLUS"
) {
  await prisma.user.update({
    where: { id: userId },
    data: { membershipTier },
  });

  if (membershipTier === "MEMBER") {
    await prisma.entitlement.updateMany({
      where: {
        userId,
        key: {
          in: ["vip_group", "vip_plus"],
        },
        expiresAt: null,
      },
      data: {
        expiresAt: new Date(),
      },
    });
    return;
  }

  await prisma.entitlement.upsert({
    where: {
      userId_key: {
        userId,
        key: "vip_group",
      },
    },
    update: {
      source: "admin_membership",
      expiresAt: null,
    },
    create: {
      userId,
      key: "vip_group",
      source: "admin_membership",
    },
  });

  if (membershipTier === "VIP_PLUS") {
    await prisma.entitlement.upsert({
      where: {
        userId_key: {
          userId,
          key: "vip_plus",
        },
      },
      update: {
        source: "admin_membership",
        expiresAt: null,
      },
      create: {
        userId,
        key: "vip_plus",
        source: "admin_membership",
      },
    });
  } else {
    await prisma.entitlement.updateMany({
      where: {
        userId,
        key: "vip_plus",
        expiresAt: null,
      },
      data: {
        expiresAt: new Date(),
      },
    });
  }
}
