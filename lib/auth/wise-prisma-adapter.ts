import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import type { PrismaClient } from "@prisma/client";
import { generateWiseUserId, isInitialAdminEmail } from "@/lib/identity/user-id";

export function WisePrismaAdapter(prisma: PrismaClient): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter,
    async createUser(user) {
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          name: user.name,
          wiseUserId: generateWiseUserId(),
          role: isInitialAdminEmail(user.email) ? "ADMIN" : "USER",
        },
      });

      await prisma.auditLog
        .create({
          data: {
            actorUserId: createdUser.id,
            targetUserId: createdUser.id,
            action: "USER_CREATED",
            metadata: {
              method: "oauth",
            },
          },
        })
        .catch(() => null);

      return createdUser as AdapterUser;
    },
  };
}
