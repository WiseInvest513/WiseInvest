import { getPrisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { generateWiseUserId, isInitialAdminEmail } from "@/lib/identity/user-id";

export async function markAccountLogin(userId: string, provider: string, providerAccountId: string, type = "credentials") {
  const prisma = getPrisma();

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      type,
      userId,
    },
    create: {
      type,
      provider,
      providerAccountId,
      userId,
    },
  });
}

export async function findOrCreateEmailUser(email: string) {
  const prisma = getPrisma();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const user = !existingUser.emailVerified
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: new Date() },
        })
      : existingUser;

    await markAccountLogin(user.id, "email-otp", normalizedEmail);
    return user;
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      emailVerified: new Date(),
      wiseUserId: generateWiseUserId(),
      role: isInitialAdminEmail(normalizedEmail) ? "ADMIN" : "USER",
    },
  });

  await markAccountLogin(user.id, "email-otp", normalizedEmail);

  await prisma.auditLog
    .create({
      data: {
        actorUserId: user.id,
        targetUserId: user.id,
        action: "USER_CREATED",
        metadata: {
          method: "email-otp",
        },
      },
    })
    .catch(() => null);

  return user;
}

export async function findPasswordUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  return getPrisma().user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      wiseUserId: true,
      email: true,
      emailVerified: true,
      image: true,
      name: true,
      passwordHash: true,
      membershipTier: true,
      role: true,
    },
  });
}

export async function registerEmailPasswordUser(email: string, password: string) {
  const prisma = getPrisma();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      passwordHash: true,
      emailVerified: true,
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: existingUser.emailVerified ?? new Date(),
          passwordHash,
        },
      })
    : await prisma.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: new Date(),
          passwordHash,
          wiseUserId: generateWiseUserId(),
          role: isInitialAdminEmail(normalizedEmail) ? "ADMIN" : "USER",
        },
      });

  await markAccountLogin(user.id, "password", normalizedEmail);

  if (!existingUser) {
    await prisma.auditLog
      .create({
        data: {
          actorUserId: user.id,
          targetUserId: user.id,
          action: "USER_CREATED",
          metadata: {
            method: "email-password",
          },
        },
      })
      .catch(() => null);
  }

  return user;
}

export async function updateUserPassword(userId: string, email: string, password: string) {
  const prisma = getPrisma();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: new Date(),
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  await markAccountLogin(user.id, "password", normalizedEmail);

  return user;
}
